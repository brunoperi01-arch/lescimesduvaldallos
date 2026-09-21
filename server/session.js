// Cookie de session centralisé + résolution de l'admin courant.
import { hashToken } from "./auth.js";
import { issueCsrf } from "./csrf.js";

export function cookieName(isProd) { return isProd ? "__Host-cimes_session" : "cimes_session_dev"; }

export function buildSessionCookie(token, config) {
  const base = `${cookieName(config.isProd)}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`;
  return config.isProd ? base + "; Secure" : base;
}
export function clearSessionCookie(config) {
  const base = `${cookieName(config.isProd)}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
  return config.isProd ? base + "; Secure" : base;
}
export function readSessionToken(req, config) {
  const name = cookieName(config.isProd);
  const m = (req.headers.cookie || "").match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

// Retourne { sessionId, adminId, email, expiresAt } ou null.
export async function requireAdmin(db, req, config) {
  const token = readSessionToken(req, config);
  if (!token) return null;
  return db.getSessionByTokenHash(hashToken(token));
}
export function csrfForSession(sessionId, config) { return issueCsrf(sessionId, config.sessionSecret); }
