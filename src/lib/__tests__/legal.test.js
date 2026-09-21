import { describe, it, expect } from "vitest";
import { legalMentions, mediateur } from "../legal";

const base = {
  residence: { adresse: "La Foux d'Allos", telephone: "04 92 83 65 59", email: "reservation@lescimesduvaldallos.com" },
  legal: {
    raisonSociale: "SAS Les Foux d'Allos", capital: "71 400 € (capital variable)",
    rcs: "Manosque 528 901 705", siret: "528 901 705 00012", tva: "FR79 528 901 705",
    atoutFrance: "IM004180007", mediateur: "",
  },
};

describe("mentions légales depuis le CMS", () => {
  it("inclut les champs renseignés", () => {
    const labels = legalMentions(base).map(([l]) => l);
    expect(labels).toContain("Raison sociale");
    expect(labels).toContain("Capital social");
    expect(labels).toContain("SIRET (siège)");
  });
  it("n'affiche aucun champ vide (pas de placeholder)", () => {
    const values = legalMentions(base).map(([, v]) => v);
    expect(values.every((v) => v && v.trim() !== "")).toBe(true);
  });
  it("médiateur absent tant qu'il n'est pas renseigné", () => {
    expect(mediateur(base)).toBeNull();
  });
  it("médiateur publié apparaît une fois renseigné", () => {
    const withMed = { ...base, legal: { ...base.legal, mediateur: "Médiateur du Tourisme et du Voyage, BP 80303, 75823 Paris Cedex 17 — mtv.travel" } };
    expect(mediateur(withMed)).toContain("Médiateur du Tourisme");
  });
});
