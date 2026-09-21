import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createLoginHandler } from "../../api/auth/login.js";
import { hashPassword, __derivations, __resetDerivations } from "../auth.js";

const config = { allowedOrigins: "https://site.fr", sessionSecret: "x".repeat(40), isProd: false };
function mockRes() {
  return { statusCode: 200, headers: {}, body: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { this.body = b ? JSON.parse(b) : null; } };
}
function req(body, extra = {}) {
  return { method: "POST", headers: { origin: "https://site.fr", "content-type": "application/json; charset=utf-8", "x-forwarded-for": "1.2.3.4", "content-length": String(JSON.stringify(body || {}).length), ...extra }, body };
}
function fakeDb(over = {}) {
  return {
    admin: null, rl: { allowed: true, attemptId: 1, retryAfter: 0 }, completed: [], loginFailures: 0,
    async beginLoginAttempt() { return this.rl; },
    async completeLoginAttempt(id, ok) { this.completed.push({ id, ok }); },
    async getAdminByEmail() { return this.admin; },
    async createSession() { return { id: "sess-1" }; },
    async logLoginFailure() { this.loginFailures += 1; },
    ...over,
  };
}
let hash;
beforeAll(async () => { hash = await hashPassword("bon-mot-de-passe"); });
beforeEach(() => __resetDerivations());

describe("login handler (V7.3.2)", () => {
  it("accepte application/json; charset=utf-8 et connecte", async () => {
    const db = fakeDb(); db.admin = { id: "a1", email: "a@b.fr", password_hash: hash, disabled_at: null };
    const res = mockRes();
    await createLoginHandler({ db, config })(req({ email: "a@b.fr", password: "bon-mot-de-passe" }), res);
    expect(res.statusCode).toBe(200); expect(res.body.csrf).toBeTruthy();
    expect(db.completed[0].ok).toBe(true);
  });
  it("rate limit atomique -> 429 + Retry-After (sans toucher scrypt)", async () => {
    const db = fakeDb({ rl: { allowed: false, retryAfter: 900 } });
    const res = mockRes();
    await createLoginHandler({ db, config })(req({ email: "a@b.fr", password: "x" }), res);
    expect(res.statusCode).toBe(429); expect(res.headers["retry-after"]).toBe("900");
  });
  it("405 renvoie Allow: POST", async () => {
    const res = mockRes();
    await createLoginHandler({ db: fakeDb(), config })({ method: "GET", headers: {} }, res);
    expect(res.statusCode).toBe(405); expect(res.headers.allow).toBe("POST");
  });
  it("body trop grand -> 413", async () => {
    const res = mockRes();
    await createLoginHandler({ db: fakeDb(), config })(req({ email: "a@b.fr", password: "x" }, { "content-length": "999999" }), res);
    expect(res.statusCode).toBe(413);
  });
  it("compte inconnu : EXACTEMENT une dérivation scrypt (instrumenté)", async () => {
    const res = mockRes();
    await createLoginHandler({ db: fakeDb(), config })(req({ email: "x@y.fr", password: "peu importe" }), res);
    expect(res.statusCode).toBe(401);
    expect(__derivations).toBe(1);
  });
  it("erreur DB -> 500 JSON générique (handler try/catch)", async () => {
    const db = fakeDb({ beginLoginAttempt: async () => { throw new Error("db down"); } });
    const res = mockRes();
    await createLoginHandler({ db, config })(req({ email: "a@b.fr", password: "x" }), res);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBeTruthy();
  });
  it("mauvais mot de passe : EXACTEMENT une dérivation scrypt", async () => {
    const db = fakeDb(); db.admin = { id: "a1", email: "a@b.fr", password_hash: hash, disabled_at: null };
    const res = mockRes();
    await createLoginHandler({ db, config })(req({ email: "a@b.fr", password: "faux" }), res);
    expect(res.statusCode).toBe(401); expect(__derivations).toBe(1);
  });
});
