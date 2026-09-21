import { neonDb } from "../../server/db.js";
import { requireAdmin, readSessionToken, clearSessionCookie } from "../../server/session.js";
import { hashToken } from "../../server/auth.js";
import { verifyCsrf, checkOrigin } from "../../server/csrf.js";
import { getConfig } from "../../server/config.js";
import { ok, forbidden, unauthorized, methodNotAllowed, serverError } from "../../server/responses.js";

export function createLogoutHandler({ db, config }) {
  return async function handler(req, res) {
    try {
      if (req.method !== "POST") return methodNotAllowed(res, "POST");
      if (!checkOrigin(req.headers.origin, config.allowedOrigins)) return forbidden(res);
      const s = await requireAdmin(db, req, config);
      if (!s) return unauthorized(res);
      if (!verifyCsrf(req.headers["x-csrf-token"], s.sessionId, config.sessionSecret)) return forbidden(res);
      await db.revokeSessionByTokenHash(hashToken(readSessionToken(req, config)));
      res.setHeader("Set-Cookie", clearSessionCookie(config));
      return ok(res, { ok: true });
    } catch { return serverError(res); }
  };
}
export default async function handler(req, res) {
  let config; try { config = getConfig(); } catch { return serverError(res); }
  return createLogoutHandler({ db: neonDb, config })(req, res);
}
