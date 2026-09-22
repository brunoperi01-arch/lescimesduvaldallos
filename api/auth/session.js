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
    } catch (error) {
    const code = String(error?.code || error?.cause?.code || "UNKNOWN");
    console.error("[auth/session]", {
      code: /^[A-Z0-9_]{1,40}$/.test(code) ? code : "UNKNOWN"
    });
    return serverError(res);
  }
  };
}
export default async function handler(req, res) {
  let config; try { config = getConfig(); } catch (error) {
    const code = String(error?.code || error?.cause?.code || "UNKNOWN");
    console.error("[auth/session]", {
      code: /^[A-Z0-9_]{1,40}$/.test(code) ? code : "UNKNOWN"
    });
    return serverError(res);
  }
  return createSessionHandler({ db: neonDb, config })(req, res);
}
