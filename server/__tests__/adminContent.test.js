import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { createDraftHandler, createPublishHandler, createRestoreHandler, createVersionsHandler } from "../contentService.js";
import { issueCsrf } from "../csrf.js";

const config = { allowedOrigins: "https://site.fr", sessionSecret: "x".repeat(40), isProd: false };
const session = { sessionId: "s1", adminId: "a1", email: "a@b.fr" };
let valid;
beforeAll(() => { valid = JSON.parse(readFileSync(new URL("../../public/content.json", import.meta.url))); });

function mockRes() { return { statusCode: 200, headers: {}, body: null, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { this.body = b ? JSON.parse(b) : null; } }; }
const authed = (extra = {}) => ({ origin: "https://site.fr", "content-type": "application/json", cookie: "cimes_session_dev=tok", "x-csrf-token": issueCsrf("s1", config.sessionSecret), ...extra });
const repoBase = (over = {}) => ({ async getSessionByTokenHash() { return session; }, async getDraftState() { return { content: valid, publishedVersion: 1, draftRevision: 2, updatedAt: "d" }; }, async getDraftContent() { return valid; }, async saveDraft() { return 3; }, async publish() { return 2; }, async getVersionContent() { return valid; }, async restore() { return 5; }, async listVersions() { return { items: [], nextCursor: null }; }, ...over });

describe("admin content — sécurité", () => {
  it("GET draft sans session -> 401", async () => {
    const res = mockRes();
    await createDraftHandler({ repo: { async getSessionByTokenHash() { return null; } }, config })({ method: "GET", headers: {} }, res);
    expect(res.statusCode).toBe(401);
  });
  it("PUT draft Origin invalide -> 403", async () => {
    const res = mockRes();
    await createDraftHandler({ repo: repoBase(), config })({ method: "PUT", headers: authed({ origin: "https://evil.fr" }), body: { content: valid, expectedPublishedVersion: 1, expectedDraftRevision: 2 } }, res);
    expect(res.statusCode).toBe(403);
  });
  it("PUT draft CSRF invalide -> 403", async () => {
    const res = mockRes();
    await createDraftHandler({ repo: repoBase(), config })({ method: "PUT", headers: authed({ "x-csrf-token": "bad" }), body: { content: valid, expectedPublishedVersion: 1, expectedDraftRevision: 2 } }, res);
    expect(res.statusCode).toBe(403);
  });
  it("mauvaise méthode -> 405 + Allow", async () => {
    const res = mockRes();
    await createDraftHandler({ repo: repoBase(), config })({ method: "DELETE", headers: authed() }, res);
    expect(res.statusCode).toBe(405); expect(res.headers.allow).toContain("GET");
  });
});

describe("admin content — logique", () => {
  it("PUT draft valide -> nouvelle révision + args repo corrects", async () => {
    let called = null;
    const repo = repoBase({ async saveDraft(adminId, ev, er, content) { called = { adminId, ev, er, content }; return 7; } });
    const res = mockRes();
    await createDraftHandler({ repo, config })({ method: "PUT", headers: authed(), body: { content: valid, expectedPublishedVersion: 1, expectedDraftRevision: 2 } }, res);
    expect(res.statusCode).toBe(200); expect(res.body.draftRevision).toBe(7);
    expect(called.ev).toBe(1); expect(called.er).toBe(2); expect(called.adminId).toBe("a1");
  });
  it("PUT draft contenu Zod invalide -> 400", async () => {
    const res = mockRes();
    await createDraftHandler({ repo: repoBase(), config })({ method: "PUT", headers: authed(), body: { content: { residence: {} }, expectedPublishedVersion: 1, expectedDraftRevision: 2 } }, res);
    expect(res.statusCode).toBe(400);
  });
  it("publish bloqué par médiateur manquant -> 422 + blockers", async () => {
    const bad = structuredClone(valid); // legal.mediateur vide dans content.json -> checkPublishable bloque
    const res = mockRes();
    await createPublishHandler({ repo: repoBase({ async getDraftContent() { return bad; } }), config })({ method: "POST", headers: authed(), body: { expectedPublishedVersion: 1, expectedDraftRevision: 2 } }, res);
    expect(res.statusCode).toBe(422); expect(Array.isArray(res.body.blockers)).toBe(true);
    expect(res.body.blockers.some((b) => /médiateur/i.test(b))).toBe(true);
  });
  it("publish -> 409 si conflit de version", async () => {
    const ok = structuredClone(valid); ok.legal.mediateur = "Médiateur X, Paris";
    const repo = repoBase({ async getDraftContent() { return ok; }, async publish() { throw new Error("published_conflict"); } });
    const res = mockRes();
    await createPublishHandler({ repo, config })({ method: "POST", headers: authed(), body: { expectedPublishedVersion: 1, expectedDraftRevision: 2 } }, res);
    expect(res.statusCode).toBe(409);
  });
  it("versions -> liste bornée { items, nextCursor }", async () => {
    const res = mockRes();
    await createVersionsHandler({ repo: repoBase(), config })({ method: "GET", headers: authed(), query: {} }, res);
    expect(res.statusCode).toBe(200); expect(res.body).toHaveProperty("items"); expect(res.body).toHaveProperty("nextCursor");
  });
  it("versions limit invalide -> 400 (aucun SQL exécuté)", async () => {
    let listed = false;
    const repo = repoBase({ async listVersions() { listed = true; return { items: [], nextCursor: null }; } });
    const res = mockRes();
    await createVersionsHandler({ repo, config })({ method: "GET", headers: authed(), query: { limit: "999" } }, res);
    expect(res.statusCode).toBe(400); expect(listed).toBe(false);
  });
  it("restore versionId non numérique -> 400", async () => {
    const res = mockRes();
    await createRestoreHandler({ repo: repoBase(), config })({ method: "POST", headers: authed(), body: { versionId: "abc", expectedPublishedVersion: 1, expectedDraftRevision: 2 } }, res);
    expect(res.statusCode).toBe(400);
  });
  it("restore refusé si contenu devenu non publiable -> 422", async () => {
    const res = mockRes();
    await createRestoreHandler({ repo: repoBase({ async getVersionContent() { return valid; } }), config })({ method: "POST", headers: authed(), body: { versionId: "12", expectedPublishedVersion: 1, expectedDraftRevision: 2 } }, res);
    expect(res.statusCode).toBe(422);
  });
});
