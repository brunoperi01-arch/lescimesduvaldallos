// Réponses JSON stables (jamais de stack en production).
export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
export const ok = (res, body) => json(res, 200, body);
export const badRequest = (res, msg = "requête invalide") => json(res, 400, { error: msg });
export const unauthorized = (res) => json(res, 401, { error: "non authentifié" });
export const forbidden = (res) => json(res, 403, { error: "interdit" });
export const methodNotAllowed = (res, allow = "") => { if (allow) res.setHeader("Allow", allow); return json(res, 405, { error: "méthode non autorisée" }); };
export const payloadTooLarge = (res) => json(res, 413, { error: "corps trop volumineux" });
export const tooManyRequests = (res, retryAfter) => { if (retryAfter) res.setHeader("Retry-After", String(retryAfter)); return json(res, 429, { error: "trop_de_tentatives" }); };
export const conflict = (res, msg) => json(res, 409, { error: msg || "conflit" });
export const serverError = (res) => json(res, 500, { error: "erreur serveur" });
