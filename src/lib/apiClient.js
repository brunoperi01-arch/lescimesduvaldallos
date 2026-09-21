// Client API unique (frontend -> /api). Cookies same-origin, CSRF, timeouts,
// mapping d'erreurs propre. Aucune stack technique affichée.
let _csrf = null;
export function setCsrf(t) { _csrf = t || null; }

export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.name = "ApiError"; this.status = status; this.code = code; }
}
const MESSAGES = {
  0: "Connexion impossible. Vérifiez votre réseau.",
  401: "Session expirée. Reconnectez-vous.",
  403: "Action non autorisée.",
  409: "Conflit : le contenu a changé entre-temps. Rechargez la dernière version.",
  422: "Publication bloquée : corrigez les points signalés.",
  429: "Trop de tentatives. Réessayez dans quelques minutes.",
  503: "Service momentanément indisponible.",
};

async function request(method, path, body, { timeoutMs = 10000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch("/api" + path, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(method !== "GET" && _csrf ? { "x-csrf-token": _csrf } : {}) },
      body: body != null ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch {
    throw new ApiError(0, "reseau", MESSAGES[0]);
  } finally { clearTimeout(timer); }

  let data = null;
  try { data = await res.json(); } catch { /* corps vide/non-JSON */ }
  if (!res.ok) {
    const err = new ApiError(res.status, data && data.error, MESSAGES[res.status] || (data && data.error) || "Erreur.");
    if (data && Array.isArray(data.blockers)) err.blockers = data.blockers;
    throw err;
  }
  return data;
}

export const api = {
  get: (p, o) => request("GET", p, null, o),
  put: (p, b, o) => request("PUT", p, b, o),
  post: (p, b, o) => request("POST", p, b, o),
};
