import { describe, it, expect } from "vitest";
import { buildResalysUrl } from "../bookResalys";

describe("buildResalysUrl", () => {
  it("convertit les dates en JJ/MM/AAAA et calcule les nuits", () => {
    const url = buildResalysUrl({ dateIn: "2026-07-20", dateOut: "2026-07-27", adults: 2 });
    expect(url).toContain("search_form_start_date=20/07/2026");
    expect(url).toContain("search_form_nb_days=7");
    expect(url).toContain("search_form_nb_adults=2");
    expect(url).toContain("actions=updateCriterias;getProposals");
    expect(url).toContain("display=search_results");
  });
  it("n'ajoute pas de durée si les dates sont incohérentes", () => {
    const url = buildResalysUrl({ dateIn: "2026-07-27", dateOut: "2026-07-20", adults: 2 });
    expect(url).not.toContain("search_form_nb_days=");
  });
  it("gère l'absence de dates", () => {
    const url = buildResalysUrl({ adults: 4 });
    expect(url).toContain("search_form_nb_adults=4");
    expect(url).not.toContain("search_form_start_date=");
  });
});
