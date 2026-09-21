import { describe, it, expect } from "vitest";
import { bookingStatus } from "../bookingStatus";

const c = (statut, extra = {}) => ({
  residence: { resalys: "https://cdva.resalys.com/rsl/clickbooking" },
  pricing: { ete: { afficher: true, aPartirDe: "312", devise: "€", statut: "reservation" },
             hiver: { afficher: false, messageAttente: "Tarifs hiver bientôt disponibles", statut, ...extra } },
});

describe("bookingStatus (modèle unique)", () => {
  it("été : prix + CTA actif", () => {
    const s = bookingStatus(c("disponibilites"), "ete");
    expect(s.priceKind).toBe("price"); expect(s.ctaEnabled).toBe(true); expect(s.ctaUrl).toContain("resalys");
  });
  it("hiver disponibilites : pas de prix, CTA actif (sans « ouvertes »)", () => {
    const s = bookingStatus(c("disponibilites"), "hiver");
    expect(s.priceKind).toBe("wait"); expect(s.statut).toBe("disponibilites"); expect(s.ctaEnabled).toBe(true);
    expect(s.ctaLabel).toBe("Voir les disponibilités");
  });
  it("ferme : aucun CTA, aucune URL", () => {
    const s = bookingStatus(c("ferme"), "hiver");
    expect(s.ctaEnabled).toBe(false); expect(s.ctaUrl).toBeNull();
  });
  it("sans URL Resalys : CTA désactivé", () => {
    expect(bookingStatus({ pricing: { hiver: { statut: "reservation" } } }, "hiver").ctaEnabled).toBe(false);
  });
});
