import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, dummyVerify, newSessionToken, hashToken } from "../auth";

describe("auth scrypt", () => {
  it("hash puis vérifie le bon mot de passe", async () => {
    const h = await hashPassword("Motdepasse-Fort-123");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("Motdepasse-Fort-123", h)).toBe(true);
  });
  it("refuse un mauvais mot de passe", async () => {
    const h = await hashPassword("bon");
    expect(await verifyPassword("mauvais", h)).toBe(false);
  });
  it("refuse un hash malformé sans lever", async () => {
    expect(await verifyPassword("x", "pas-un-hash")).toBe(false);
  });
  it("dummyVerify renvoie toujours false", async () => {
    expect(await dummyVerify("n'importe")).toBe(false);
  });
  it("token de session opaque + hash déterministe", () => {
    const t = newSessionToken();
    expect(t.length).toBeGreaterThanOrEqual(43);
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toBe(t);
  });
});
