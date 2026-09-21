import { describe, it, expect } from "vitest";
import { issueCsrf, verifyCsrf, checkOrigin, pseudonymizeIp } from "../csrf";

const SECRET = "test-secret";
describe("csrf", () => {
  it("émet puis vérifie un token lié à la session", () => {
    const t = issueCsrf("sess-1", SECRET);
    expect(verifyCsrf(t, "sess-1", SECRET)).toBe(true);
  });
  it("refuse un token d'une autre session", () => {
    const t = issueCsrf("sess-1", SECRET);
    expect(verifyCsrf(t, "sess-2", SECRET)).toBe(false);
  });
  it("refuse un token altéré ou vide", () => {
    expect(verifyCsrf("x.y", "sess-1", SECRET)).toBe(false);
    expect(verifyCsrf("", "sess-1", SECRET)).toBe(false);
  });
  it("checkOrigin : liste blanche stricte", () => {
    expect(checkOrigin("https://a.fr", "https://a.fr,https://b.fr")).toBe(true);
    expect(checkOrigin("https://evil.fr", "https://a.fr")).toBe(false);
    expect(checkOrigin(null, "https://a.fr")).toBe(false);
  });
  it("pseudonymizeIp ne renvoie jamais l'IP brute", () => {
    const p = pseudonymizeIp("1.2.3.4", SECRET);
    expect(p).not.toContain("1.2.3.4");
    expect(p).toBe(pseudonymizeIp("1.2.3.4", SECRET));
  });
});
