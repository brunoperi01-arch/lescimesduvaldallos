import { describe, it, expect } from "vitest";
import { createSessionHandler } from "../../api/auth/session.js";
import { createLogoutHandler } from "../../api/auth/logout.js";
import { createPublishedHandler } from "../../api/content/published.js";
import { issueCsrf } from "../csrf.js";
import { readFileSync } from "node:fs";
const validContent = JSON.parse(readFileSync(new URL("../../public/content.json", import.meta.url)));

const config = { allowedOrigins: "https://site.fr", sessionSecret: "x".repeat(40), isProd: false };
function mockRes() { return { statusCode: 200, headers: {}, ended: false, body: null,
  setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { this.ended = true; this.body = b ? JSON.parse(b) : null; } }; }
const cookie = "cimes_session_dev=tok";

describe("session handler", () => {
  it("session valide -> 200 + csrf lié à sessionId", async () => {
    const db = { async getSessionByTokenHash() { return { sessionId: "s1", adminId: "a1", email: "a@b.fr" }; } };
    const res = mockRes();
    await createSessionHandler({ db, config })({ method: "GET", headers: { cookie } }, res);
    expect(res.statusCode).toBe(200); expect(res.body.email).toBe("a@b.fr");
  });
  it("session expirée/révoquée/désactivée -> 401 (la requête filtrante renvoie null)", async () => {
    const db = { async getSessionByTokenHash() { return null; } };
    const res = mockRes();
    await createSessionHandler({ db, config })({ method: "GET", headers: { cookie } }, res);
    expect(res.statusCode).toBe(401);
  });
  it("405 -> Allow: GET", async () => {
    const res = mockRes();
    await createSessionHandler({ db: {}, config })({ method: "POST", headers: {} }, res);
    expect(res.statusCode).toBe(405); expect(res.headers.allow).toBe("GET");
  });
});

describe("logout handler", () => {
  const sess = { sessionId: "s1", adminId: "a1", email: "a@b.fr" };
  const db = { async getSessionByTokenHash() { return sess; }, async revokeSessionByTokenHash() {} };
  it("valide (origin + csrf) -> 200 + cookie effacé", async () => {
    const res = mockRes();
    const csrf = issueCsrf("s1", config.sessionSecret);
    await createLogoutHandler({ db, config })({ method: "POST", headers: { origin: "https://site.fr", cookie, "x-csrf-token": csrf } }, res);
    expect(res.statusCode).toBe(200); expect(res.headers["set-cookie"]).toContain("Max-Age=0");
  });
  it("Origin invalide -> 403", async () => {
    const res = mockRes();
    await createLogoutHandler({ db, config })({ method: "POST", headers: { origin: "https://evil.fr", cookie } }, res);
    expect(res.statusCode).toBe(403);
  });
  it("CSRF invalide -> 403", async () => {
    const res = mockRes();
    await createLogoutHandler({ db, config })({ method: "POST", headers: { origin: "https://site.fr", cookie, "x-csrf-token": "bad" } }, res);
    expect(res.statusCode).toBe(403);
  });
  it("erreur DB -> 500", async () => {
    const res = mockRes();
    const badDb = { async getSessionByTokenHash() { throw new Error("db"); } };
    await createLogoutHandler({ db: badDb, config })({ method: "POST", headers: { origin: "https://site.fr", cookie } }, res);
    expect(res.statusCode).toBe(500);
  });
});

describe("published handler", () => {
  const content = validContent;
  it("publié valide -> 200 JSON + ETag", async () => {
    const res = mockRes();
    await createPublishedHandler({ db: { async getPublished() { return { version: 3, content }; } } })({ method: "GET", headers: {} }, res);
    expect(res.statusCode).toBe(200); expect(res.headers["content-type"]).toBe("application/json"); expect(res.headers.etag).toContain("v3");
  });
  it("aucun contenu -> 503 no-store JSON", async () => {
    const res = mockRes();
    await createPublishedHandler({ db: { async getPublished() { return null; } } })({ method: "GET", headers: {} }, res);
    expect(res.statusCode).toBe(503); expect(res.headers["cache-control"]).toBe("no-store"); expect(res.headers["content-type"]).toBe("application/json");
  });
  it("contenu invalide -> 500", async () => {
    const res = mockRes();
    await createPublishedHandler({ db: { async getPublished() { return { version: 1, content: { residence: {} } }; } } })({ method: "GET", headers: {} }, res);
    expect(res.statusCode).toBe(500);
  });
  it("ETag correspondant -> 304", async () => {
    const res = mockRes();
    await createPublishedHandler({ db: { async getPublished() { return { version: 3, content }; } } })({ method: "GET", headers: { "if-none-match": 'W/"v3"' } }, res);
    expect(res.statusCode).toBe(304);
  });
  it("405 -> Allow: GET", async () => {
    const res = mockRes();
    await createPublishedHandler({ db: {} })({ method: "POST", headers: {} }, res);
    expect(res.statusCode).toBe(405); expect(res.headers.allow).toBe("GET");
  });
});
