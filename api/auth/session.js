import { neonDb } from "../../server/db.js";
import { requireAdmin, csrfForSession } from "../../server/session.js";
import { getConfig } from "../../server/config.js";
import { ok, unauthorized, methodNotAllowed, serverError } from "../../server/responses.js";

export function createSessionHandler({ db, config }) {
  return async function handler(req, res) {
    try {
      if (req.method !== "GET") return methodNotAllowed(res, "GET");
      const target = new URL(config.databaseUrl);
      console.info("[db-target]", {
        host: target.hostname,
        database: target.pathname.slice(1),
        user: target.username
      });
      const s = await requireAdmin(db, req, config);
      if (!s) return unauthorized(res);
      return ok(res, { email: s.email, csrf: csrfForSession(s.sessionId, config) });
    } catch (error) {
    const code = String(error?.code || error?.cause?.code || "UNKNOWN");
    let message = String(error?.message || "Sans message");
    for (const value of Object.values(process.env)) {
      if (typeof value === "string" && value.length >= 8) {
        message = message.split(value).join("[MASQUÉ]");
      }
    }
    message = message.replace(
      /(?:https?|postgres(?:ql)?):\/\/[^\s"'<>]+/gi,
      "[URL MASQUÉE]"
    );
    console.error("[auth/session]", {
      message: message.slice(0, 500),
      code: /^[A-Z0-9_]{1,40}$/.test(code) ? code : "UNKNOWN"
    });
    return serverError(res);
  }
  };
}
export default async function handler(req, res) {
  let config; try { config = getConfig(); } catch (error) {
    const code = String(error?.code || error?.cause?.code || "UNKNOWN");
    let message = String(error?.message || "Sans message");
    for (const value of Object.values(process.env)) {
      if (typeof value === "string" && value.length >= 8) {
        message = message.split(value).join("[MASQUÉ]");
      }
    }
    message = message.replace(
      /(?:https?|postgres(?:ql)?):\/\/[^\s"'<>]+/gi,
      "[URL MASQUÉE]"
    );
    console.error("[auth/session]", {
      message: message.slice(0, 500),
      code: /^[A-Z0-9_]{1,40}$/.test(code) ? code : "UNKNOWN"
    });
    return serverError(res);
  }
  return createSessionHandler({ db: neonDb, config })(req, res);
}
