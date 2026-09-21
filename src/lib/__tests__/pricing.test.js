import { describe, it, expect } from "vitest";
import { priceDisplay } from "../pricing";

const pricing = {
  ete: { afficher: true, aPartirDe: "312", devise: "€", unite: "la semaine", mention: "selon dates" },
  hiver: { afficher: false, messageAttente: "Tarifs hiver bientôt disponibles" },
};

describe("priceDisplay", () => {
  it("affiche le prix été quand afficher=true", () => {
    const d = priceDisplay(pricing, "ete");
    expect(d.kind).toBe("price");
    expect(d.text).toContain("312");
    expect(d.mention).toBe("selon dates");
  });
  it("affiche le message d'attente hiver (aucun prix)", () => {
    expect(priceDisplay(pricing, "hiver").kind).toBe("wait");
  });
  it("n'affiche rien si afficher=false sans message", () => {
    expect(priceDisplay({ ete: { afficher: false } }, "ete")).toBeNull();
  });
});
