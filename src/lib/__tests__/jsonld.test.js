import { describe, it, expect } from "vitest";
import { buildJsonLd } from "../jsonld";

const content = {
  residence: { nom: "Les Cimes", telephone: "04 92 83 65 59", adresse: "La Foux d'Allos" },
  legal: { siege: "Lieudit La Sestrière, 04260 Allos" },
  pricing: { ete: { afficher: true, aPartirDe: "312", devise: "€" }, hiver: { afficher: false, messageAttente: "x" } },
};

describe("buildJsonLd", () => {
  it("Offer avec prix numérique en été", () => {
    const ld = buildJsonLd(content, "ete");
    expect(ld.makesOffer.price).toBe(312);
    expect(ld.makesOffer.priceCurrency).toBe("EUR");
    expect(ld.address.streetAddress).toBe("La Foux d'Allos");
  });
  it("aucun Offer en hiver (prix masqué)", () => {
    expect(buildJsonLd(content, "hiver").makesOffer).toBeUndefined();
  });
  it("jamais d'aggregateRating inventé", () => {
    expect(buildJsonLd(content, "ete").aggregateRating).toBeUndefined();
  });
});
