import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { validateContent, checkPublishable } from "../contentSchema";

const real = JSON.parse(readFileSync(new URL("../../../public/content.json", import.meta.url)));
const clone = () => structuredClone(real);

describe("validateContent (strict)", () => {
  it("valide le vrai public/content.json", () => {
    const r = validateContent(real);
    expect(r.success, r.success ? "" : JSON.stringify(r.error?.issues?.slice(0, 4))).toBe(true);
  });

  it("refuse un contenu quasi vide (test imposé)", () => {
    expect(validateContent({
      residence: {}, seasons: { hiver: {}, ete: {} }, hebergements: [], services: [], pages: [],
    }).success).toBe(false);
  });

  it("refuse une résidence vide", () => {
    const b = clone(); b.residence = {}; expect(validateContent(b).success).toBe(false);
  });
  it("refuse un faux téléphone", () => {
    const b = clone(); b.residence.telephone = "abc"; expect(validateContent(b).success).toBe(false);
  });
  it("refuse une fausse URL Resalys", () => {
    const b = clone(); b.residence.resalys = "pas-une-url"; expect(validateContent(b).success).toBe(false);
  });
  it("refuse une clé inconnue", () => {
    const b = clone(); b.residence.inconnue = "x"; expect(validateContent(b).success).toBe(false);
  });
  it("refuse un slug dupliqué", () => {
    const b = clone(); b.pages.push({ ...b.pages[0] }); expect(validateContent(b).success).toBe(false);
  });
  it("refuse un slug réservé", () => {
    const b = clone(); b.pages[0].slug = "admin"; expect(validateContent(b).success).toBe(false);
  });
  it("refuse une section image sans alt", () => {
    const b = clone(); b.pages[0].sections.push({ type: "image", image: "/images/x.webp", alt: "" });
    expect(validateContent(b).success).toBe(false);
  });
  it("refuse un type de section inconnu", () => {
    const b = clone(); b.pages[0].sections.push({ type: "video", url: "x" });
    expect(validateContent(b).success).toBe(false);
  });
  it("refuse une couleur invalide", () => {
    const b = clone(); b.seasons.hiver.accent = "bleu"; expect(validateContent(b).success).toBe(false);
  });
});

describe("checkPublishable (garde-fous)", () => {
  it("signale le médiateur manquant sur le contenu réel", () => {
    const bl = checkPublishable(real);
    expect(bl.some((m) => m.toLowerCase().includes("médiateur"))).toBe(true);
  });
  it("devient publiable quand le médiateur est renseigné", () => {
    const b = clone(); b.legal.mediateur = "Médiateur du Tourisme et du Voyage, BP 80303, 75823 Paris Cedex 17";
    expect(checkPublishable(b)).toEqual([]);
  });
  it("bloque un placeholder entre crochets", () => {
    const b = clone(); b.legal.mediateur = "OK"; b.residence.nom = "[À COMPLÉTER]";
    expect(checkPublishable(b).some((m) => m.includes("crochets"))).toBe(true);
  });
  it("bloque « 230 km »", () => {
    const b = clone(); b.legal.mediateur = "OK"; b.seasons.hiver.domaineIntro = "230 km de pistes";
    expect(checkPublishable(b).some((m) => m.includes("230"))).toBe(true);
  });
  it("bloque les faux avis", () => {
    const b = clone(); b.legal.mediateur = "OK"; b.reviews = [{ stars: 5, txt: "x", who: "y" }];
    expect(checkPublishable(b).some((m) => m.toLowerCase().includes("avis"))).toBe(true);
  });
  it("bloque une info commerciale non confirmée (SafeBooking)", () => {
    const b = clone(); b.legal.mediateur = "OK"; b.pages[0].sections[1] = { type: "text", titre: "x", contenu: "Assurance SafeBooking 4,5 %" };
    expect(checkPublishable(b).some((m) => m.includes("SafeBooking"))).toBe(true);
  });
});
