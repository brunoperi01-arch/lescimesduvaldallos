// CSRF lié à la session (HMAC) + contrôle d'Origin.
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";

export function issueCsrf(sessionId, secret) {
  const nonce = randomBytes(16).toString("hex");
  const mac = createHmac("sha256", secret).update(`${sessionId}.${nonce}`).digest("hex");
  return `${nonce}.${mac}`;
}

export function verifyCsrf(token, sessionId, secret) {
  if (!token || typeof token !== "string") return false;
  const [nonce, mac] = token.split(".");
  if (!nonce || !mac) return false;
  const expected = createHmac("sha256", secret).update(`${sessionId}.${nonce}`).digest("hex");
  const a = Buffer.from(mac), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function checkOrigin(origin, allowedOrigins) {
  if (!origin) return false;
  return String(allowedOrigins || "").split(",").map((s) => s.trim()).filter(Boolean).includes(origin);
}

// IP pseudonymisée (HMAC) pour le rate-limit — jamais l'IP brute.
export function pseudonymizeIp(ip, secret) {
  return createHmac("sha256", secret).update(String(ip || "")).digest("hex").slice(0, 32);
}
