import { z } from "zod";
import { verifyPassword, dummyVerify, newSessionToken, hashToken } from "../../server/auth.js";
import { checkOrigin, pseudonymizeIp } from "../../server/csrf.js";
import { buildSessionCookie, csrfForSession } from "../../server/session.js";
import { getConfig } from "../../server/config.js";
import { neonDb } from "../../server/db.js";
import { ok, badRequest, unauthorized, forbidden, methodNotAllowed, payloadTooLarge, tooManyRequests, serverError } from "../../server/responses.js";

const Body = z.object({ email: z.string().email(), password: z.string().min(1).max(200) }).strict();
const MAX_BODY = 10 * 1024;

function isJson(req) { return (req.headers["content-type"] || "").split(";")[0].trim() === "application/json"; }

export function createLoginHandler({ db, config }) {
  return async function handler(req, res) {
   try {
    if (req.method !== "POST") return methodNotAllowed(res, "POST");
    if (!isJson(req)) return badRequest(res, "content-type");
    // Content-Length = pré-filtre bon marché (indicatif) ; la limite RÉELLE est
    // appliquée sur le corps effectivement reçu ci-dessous.
    if (Number(req.headers["content-length"] || 0) > MAX_BODY) return payloadTooLarge(res);
    if (!checkOrigin(req.headers.origin, config.allowedOrigins)) return forbidden(res);
    const rawLen = req.body == null ? 0 : Buffer.byteLength(typeof req.body === "string" ? req.body : JSON.stringify(req.body), "utf8");
    if (rawLen > MAX_BODY) return payloadTooLarge(res);   // taille du corps parsé (indicative ; limite dure imposée par le runtime Vercel)
    let body; try { body = Body.parse(req.body); } catch { return badRequest(res); }
    const email = body.email.toLowerCase();
    const ipHash = pseudonymizeIp(req.headers["x-forwarded-for"] || "", config.sessionSecret);

    const rl = await db.beginLoginAttempt({ email, ipHash });   // atomique (réserve la tentative)
    if (!rl.allowed) return tooManyRequests(res, rl.retryAfter);

    const admin = await db.getAdminByEmail(email);
    let good = false;
    if (!admin || admin.disabled_at) { await dummyVerify(body.password); }   // exactement 1 scrypt
    else { good = await verifyPassword(body.password, admin.password_hash); }
    const success = Boolean(admin) && !admin?.disabled_at && good;
    await db.completeLoginAttempt(rl.attemptId, success);
    if (!success) { await db.logLoginFailure(); return unauthorized(res); }

    const token = newSessionToken();
    const s = await db.createSession(admin.id, hashToken(token));
    res.setHeader("Set-Cookie", buildSessionCookie(token, config));
    return ok(res, { csrf: csrfForSession(s.id, config) });
   } catch { return serverError(res); }   // erreur DB/inattendue -> JSON générique
  };
}

export default async function handler(req, res) {
  let config; try { config = getConfig(); } catch { res.statusCode = 500; res.setHeader("Content-Type", "application/json"); return res.end(JSON.stringify({ error: "config" })); }
  return createLoginHandler({ db: neonDb, config })(req, res);
}
