// Handlers d'administration du contenu (factories injectables).
import { z } from "zod";
import { validateContent, checkPublishable } from "../src/lib/contentSchema.js";
import { requireAdmin } from "./session.js";
import { verifyCsrf, checkOrigin } from "./csrf.js";
import { ok, badRequest, unauthorized, forbidden, methodNotAllowed, conflict, serverError, json } from "./responses.js";

const MAX_BODY = 512 * 1024;
const ver = z.number().int().nonnegative();
const DraftBody = z.object({ content: z.unknown(), expectedPublishedVersion: ver, expectedDraftRevision: ver }).strict();
const PublishBody = z.object({ expectedPublishedVersion: ver, expectedDraftRevision: ver }).strict();
const RestoreBody = z.object({ versionId: z.string().regex(/^[1-9]\d*$/, "id invalide"), expectedPublishedVersion: ver, expectedDraftRevision: ver }).strict();

function isJson(req) { return (req.headers["content-type"] || "").split(";")[0].trim() === "application/json"; }
function tooBig(req) { return Number(req.headers["content-length"] || 0) > MAX_BODY; }
function handleConflict(res, e) { if (/conflict/i.test(e && e.message)) { conflict(res, "version_conflict"); return true; } return false; }

async function guardMutation(req, res, deps) {
  if (!isJson(req)) { badRequest(res, "content-type"); return null; }
  if (tooBig(req)) { json(res, 413, { error: "corps_trop_grand" }); return null; }
  if (!checkOrigin(req.headers.origin, deps.config.allowedOrigins)) { forbidden(res); return null; }
  const s = await requireAdmin(deps.repo, req, deps.config);
  if (!s) { unauthorized(res); return null; }
  if (!verifyCsrf(req.headers["x-csrf-token"], s.sessionId, deps.config.sessionSecret)) { forbidden(res); return null; }
  return s;
}

export function createDraftHandler(deps) {
  return async function handler(req, res) {
    try {
      if (req.method === "GET") {
        const s = await requireAdmin(deps.repo, req, deps.config); if (!s) return unauthorized(res);
        const st = await deps.repo.getDraftState();
        return ok(res, { content: st.content, publishedVersion: st.publishedVersion, draftRevision: st.draftRevision, updatedAt: st.updatedAt });
      }
      if (req.method === "PUT") {
        const s = await guardMutation(req, res, deps); if (!s) return;
        let body; try { body = DraftBody.parse(req.body); } catch { return badRequest(res); }
        if (!validateContent(body.content).success) return badRequest(res, "contenu_invalide");
        try {
          const rev = await deps.repo.saveDraft(s.adminId, body.expectedPublishedVersion, body.expectedDraftRevision, body.content);
          return ok(res, { draftRevision: rev });
        } catch (e) { if (handleConflict(res, e)) return; return serverError(res); }
      }
      res.setHeader("Allow", "GET, PUT"); return methodNotAllowed(res, "GET, PUT");
    } catch { return serverError(res); }
  };
}

export function createPublishHandler(deps) {
  return async function handler(req, res) {
    try {
      if (req.method !== "POST") return methodNotAllowed(res, "POST");
      const s = await guardMutation(req, res, deps); if (!s) return;
      let body; try { body = PublishBody.parse(req.body); } catch { return badRequest(res); }
      const draft = await deps.repo.getDraftContent();
      if (!draft) return badRequest(res, "aucun_brouillon");
      if (!validateContent(draft).success) return badRequest(res, "contenu_invalide");
      const blockers = checkPublishable(draft);
      if (blockers.length) return json(res, 422, { error: "publication_bloquee", blockers });
      try {
        const version = await deps.repo.publish(s.adminId, body.expectedPublishedVersion, body.expectedDraftRevision);
        return ok(res, { version });
      } catch (e) { if (handleConflict(res, e)) return; return serverError(res); }
    } catch { return serverError(res); }
  };
}

export function createVersionsHandler(deps) {
  return async function handler(req, res) {
    try {
      if (req.method !== "GET") return methodNotAllowed(res, "GET");
      const s = await requireAdmin(deps.repo, req, deps.config); if (!s) return unauthorized(res);
      const rawLimit = req.query?.limit;
      let limit = 20;
      if (rawLimit !== undefined) {
        limit = Number(rawLimit);
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) return badRequest(res, "limit_invalide");
      }
      const cursor = req.query?.cursor;
      if (cursor !== undefined && cursor !== null && !/^[1-9]\d*$/.test(String(cursor))) return badRequest(res, "cursor_invalide");
      const { items, nextCursor } = await deps.repo.listVersions(limit, cursor || null);
      return ok(res, { items, nextCursor: nextCursor || null });
    } catch { return serverError(res); }
  };
}

export function createRestoreHandler(deps) {
  return async function handler(req, res) {
    try {
      if (req.method !== "POST") return methodNotAllowed(res, "POST");
      const s = await guardMutation(req, res, deps); if (!s) return;
      let body; try { body = RestoreBody.parse(req.body); } catch { return badRequest(res); }
      const content = await deps.repo.getVersionContent(body.versionId);
      if (!content) return badRequest(res, "version_introuvable");
      if (!validateContent(content).success) return badRequest(res, "contenu_invalide");
      const blockers = checkPublishable(content);
      if (blockers.length) return json(res, 422, { error: "restauration_bloquee", blockers });
      try {
        const version = await deps.repo.restore(s.adminId, body.expectedPublishedVersion, body.expectedDraftRevision, body.versionId);
        return ok(res, { version });
      } catch (e) { if (handleConflict(res, e)) return; return serverError(res); }
    } catch { return serverError(res); }
  };
}
