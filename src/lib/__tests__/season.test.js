import { describe, it, expect } from "vitest";
import { seasonByDate, resolveSeason } from "../season";

describe("season marketing", () => {
  it("hiver de septembre à avril", () => {
    for (const m of [9, 10, 11, 12, 1, 2, 3, 4])
      expect(seasonByDate(new Date(2026, m - 1, 15))).toBe("hiver");
  });
  it("été de mai à août", () => {
    for (const m of [5, 6, 7, 8])
      expect(seasonByDate(new Date(2026, m - 1, 15))).toBe("ete");
  });
  it("override admin prioritaire sur la date", () => {
    expect(resolveSeason({ adminOverride: "ete" })).toBe("ete");
  });
  it("choix visiteur prioritaire sur tout", () => {
    expect(resolveSeason({ adminOverride: "ete", visitorOverride: "hiver" })).toBe("hiver");
  });
});
