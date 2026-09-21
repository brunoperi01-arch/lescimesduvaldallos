import { z } from "zod";

// ---- Primitives validées ----
const nonEmpty = z.string().min(1, "Champ requis");
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur #RRGGBB attendue");
const phone = z.string().regex(/^[0-9 +().-]{6,}$/, "Téléphone invalide");
const email = z.string().email("E-mail invalide");
const httpUrl = z.string().url().refine((u) => /^https?:\/\//.test(u), "URL http(s) requise");
const urlOrEmpty = z.union([z.literal(""), httpUrl]);
const imageRef = z.string().refine(
  (v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v),
  "Chemin (/images/…) ou URL http(s) attendu"
);
const ctaLink = z.string().refine(
  (v) => v !== "#" && /^(https?:\/\/|tel:|mailto:|\/)/.test(v),
  "Lien invalide (http(s), tel:, mailto: ou /… ; « # » interdit)"
);
const slug = z.string().regex(/^[a-z0-9-]+$/, "slug invalide (a-z, 0-9, -)");

const RESERVED_SLUGS = new Set([
  "admin", "api", "assets", "images", "hiver-ski", "ete-randonnee", "nos-hebergements",
  "mentions-legales", "politique-confidentialite", "politique-cookies", "conditions-location",
]);

// ---- Objets ----
const heroSeason = z.object({
  eyebrow: z.string().optional(),
  titre: z.string().optional(),
  sousTitre: z.string().optional(),
  image: imageRef.optional(),
  alt: z.string().optional(),
}).strict();

const pillar = z.object({ k: nonEmpty, h: nonEmpty, p: nonEmpty }).strict();
const activite = z.object({ h: nonEmpty, p: z.string(), img: imageRef.optional(), alt: z.string().optional() }).strict();
const stat = z.object({ n: nonEmpty, lb: nonEmpty }).strict();

const season = z.object({
  accent: color,
  accentDeep: color,
  hero: heroSeason,
  pillars: z.array(pillar),
  activites: z.array(activite),
  activitesTitre: z.string(),
  activitesIntro: z.string(),
  domaineTitre: z.string(),
  domaineIntro: z.string(),
  domaineImage: imageRef,
  stats: z.array(stat).optional(),
}).strict();

const hebergement = z.object({
  tag: z.string(), meta: z.string(), h: nonEmpty, p: z.string(),
  img: imageRef, alt: z.string().optional(),
}).strict().refine((h) => !h.img || (h.alt && h.alt.trim().length > 0),
  { message: "Texte alternatif obligatoire pour une photo d'hébergement", path: ["alt"] });

const service = z.object({ i: z.string(), h: nonEmpty, p: z.string() }).strict();

const section = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), titre: z.string().optional(), sousTitre: z.string().optional(), image: imageRef.optional(), alt: z.string().optional() }).strict(),
  z.object({ type: z.literal("text"), titre: z.string().optional(), contenu: nonEmpty }).strict(),
  z.object({ type: z.literal("image"), image: imageRef, legende: z.string().optional(), alt: nonEmpty }).strict(),
  z.object({ type: z.literal("cta"), titre: z.string().optional(), texte: nonEmpty, lien: ctaLink }).strict(),
]);

const page = z.object({
  slug, title: nonEmpty, metaDescription: z.string().optional(), sections: z.array(section),
}).strict();

const legal = z.object({
  raisonSociale: z.string().optional(), capital: z.string().optional(), rcs: z.string().optional(),
  siren: z.string().optional(), siret: z.string().optional(), tva: z.string().optional(),
  atoutFrance: z.string().optional(), garantFinancier: z.string().optional(), rcp: z.string().optional(),
  hebergeur: z.string().optional(), responsablesPublication: z.string().optional(), siege: z.string().optional(),
  mediateur: z.string().optional(),   // peut être vide → bloqué à la publication
}).strict();

const seasonPricing = z.object({
  afficher: z.boolean(),
  aPartirDe: z.string().optional(),
  devise: z.string().optional(),
  unite: z.string().optional(),
  mention: z.string().optional(),
  messageAttente: z.string().optional(),
  statut: z.enum(["ferme", "disponibilites", "reservation"]).optional(),
}).strict();
const pricing = z.object({ ete: seasonPricing, hiver: seasonPricing }).strict();

export const contentSchema = z.object({
  residence: z.object({
    nom: nonEmpty, raisonSociale: nonEmpty, adresse: nonEmpty,
    telephone: phone, email,
    resalys: httpUrl, resalysClient: urlOrEmpty, coffrets: urlOrEmpty, etatDesLieux: urlOrEmpty,
    atoutFrance: z.string(), classement: z.string().optional(),
    famillePlus: z.boolean().optional(), responsablesPublication: z.string().optional(), siege: z.string().optional(),
  }).strict(),
  seasonOverride: z.enum(["auto", "hiver", "ete"]),
  seasons: z.object({ hiver: season, ete: season }).strict(),
  hebergements: z.array(hebergement),
  services: z.array(service),
  pages: z.array(page),
  legal,
  pricing,
}).strict().superRefine((data, ctx) => {
  const seen = new Set();
  data.pages.forEach((p, i) => {
    if (RESERVED_SLUGS.has(p.slug)) ctx.addIssue({ code: "custom", message: `slug réservé : ${p.slug}`, path: ["pages", i, "slug"] });
    if (seen.has(p.slug)) ctx.addIssue({ code: "custom", message: `slug dupliqué : ${p.slug}`, path: ["pages", i, "slug"] });
    seen.add(p.slug);
  });
});

export function validateContent(data) {
  return contentSchema.safeParse(data);
}

// Mentions légales obligatoires (le médiateur doit être renseigné avant publication)
const REQUIRED_LEGAL = ["raisonSociale", "capital", "rcs", "siret", "tva", "atoutFrance", "mediateur"];

// Garde-fous AVANT publication : renvoie la liste des blocages (vide = publiable).
export function checkPublishable(content) {
  const blockers = [];
  const raw = JSON.stringify(content);

  // Tout placeholder entre crochets
  const brackets = raw.match(/\[[^\]{}[]*\]/g); // exclut les tableaux JSON
  if (brackets && brackets.length) blockers.push("Placeholder entre crochets détecté : " + brackets[0]);
  if (/\bTODO\b/.test(raw)) blockers.push("« TODO » présent.");
  if (raw.includes("230 km")) blockers.push("« 230 km » interdit (Le Seignus/navette non validé).");
  if (/domaines?\s+(de France|français)/i.test(raw) || /skiables?\s+(de France|français)/i.test(raw))
    blockers.push("Écrire « Alpes du Sud », pas « de France ».");
  if (/\b2\s?575\s?m|altitude\s+max/i.test(raw)) blockers.push("Altitude maximale non validée : à retirer.");
  if (Array.isArray(content.reviews) && content.reviews.length) blockers.push("Aucun avis fictif ne doit être publié.");

  // Informations commerciales non confirmées (§1)
  [[/54\s*places/i, "parking 54 places"], [/SafeBooking/i, "SafeBooking"],
   [/35\s*€.*animal|animal.*35\s*€/i, "animaux 35 €"], [/acompte\s+de\s+30/i, "acompte 30 %"],
   [/40\s*€.*hiver|25\s*€.*été/i, "tarifs parking"]].forEach(([re, lab]) => {
    if (re.test(raw)) blockers.push(`Information non confirmée publiée : ${lab}.`);
  });

  // Liens factices
  (content.pages || []).forEach((p) => (p.sections || []).forEach((s) => {
    if (s.type === "cta" && (!s.lien || s.lien === "#")) blockers.push(`Lien « # » sur « ${p.title} ».`);
  }));

  // Images d'hébergement sans alt
  (content.hebergements || []).forEach((h, i) => {
    if (h.img && !(h.alt && h.alt.trim())) blockers.push(`Hébergement #${i + 1} : photo sans texte alternatif.`);
  });

  // Mentions légales obligatoires
  const L = content.legal || {};
  REQUIRED_LEGAL.forEach((k) => {
    if (!L[k] || !String(L[k]).trim()) blockers.push(`Mention légale obligatoire manquante : ${k}${k === "mediateur" ? " (médiateur de la consommation)" : ""}.`);
  });

  // Structure
  const v = validateContent(content);
  if (!v.success) blockers.push("Structure invalide : " + (v.error.issues[0]?.message || "schéma"));

  return blockers;
}
