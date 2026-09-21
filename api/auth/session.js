import { neonDb } from "../../server/db.js";
import { requireAdmin, csrfForSession } from "../../server/session.js";
import { getConfig } from "../../server/config.js";
import { ok, unauthorized, methodNotAllowed, serverError } from "../../server/responses.js";

export function createSessionHandler({ db, config }) {
  return async function handler(req, res) {
    try {
      if (req.method !== "GET") return methodNotAllowed(res, "GET");
      const s = await requireAdmin(db, req, config);
      if (!s) return unauthorized(res);
      return ok(res, { email: s.email, csrf: csrfForSession(s.sessionId, config) });
    } catch { return serverError(res); }
  };
}
export default async function handler(req, res) {
  let config; try { config = getConfig(); } catch { return serverError(res); }
  return createSessionHandler({ db: neonDb, config })(req, res);
}
