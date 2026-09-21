import { priceDisplay } from "./pricing";

// Statut commercial UNIQUE dérivé de pricing[season] + residence.resalys.
// statut : "reservation" | "disponibilites" | "ferme".
// - reservation/disponibilites : CTA « Voir les disponibilités » actif si URL valide.
// - ferme : aucun CTA de réservation.
// N'affirme jamais que les réservations sont "ouvertes".
export function bookingStatus(content, season) {
  const p = (content && content.pricing && content.pricing[season]) || {};
  const price = priceDisplay(content && content.pricing, season);
  const resa = content && content.residence && content.residence.resalys;
  const statut = p.statut || (p.afficher ? "reservation" : "disponibilites");
  const ctaEnabled = statut !== "ferme" && Boolean(resa);
  return {
    statut,
    priceKind: price ? price.kind : null,
    priceText: price ? price.text : null,
    priceMention: price ? price.mention : "",
    ctaLabel: "Voir les disponibilités",
    ctaUrl: ctaEnabled ? resa : null,
    ctaEnabled,
  };
}
