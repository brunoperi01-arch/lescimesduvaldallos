// Accès CMS via l'API Neon (/api).
import { api, setCsrf, ApiError } from "./apiClient";
export { ApiError };

// --- Auth ---
export async function getSession() { const d = await api.get("/auth/session"); setCsrf(d.csrf); return d; }
export async function login(email, password) { const d = await api.post("/auth/login", { email, password }); setCsrf(d.csrf); return d; }
export async function logout() { try { await api.post("/auth/logout"); } finally { setCsrf(null); } }

// --- Contenu admin ---
export async function getState() {
  const d = await api.get("/admin/content/draft");
  return { publishedVersion: d.publishedVersion, draftRevision: d.draftRevision, draftContent: d.content };
}
export async function saveDraft(content, expectedDraftRevision, expectedPublishedVersion) {
  const d = await api.put("/admin/content/draft", { content, expectedPublishedVersion, expectedDraftRevision });
  return d.draftRevision;
}
export async function publish(expectedPublishedVersion, expectedDraftRevision) {
  const d = await api.post("/admin/content/publish", { expectedPublishedVersion, expectedDraftRevision });
  return d.version;
}
export async function listVersions() { const d = await api.get("/admin/content/versions"); return d.items; }
export async function restore(expectedPublishedVersion, expectedDraftRevision, versionId) {
  const d = await api.post("/admin/content/restore", { versionId, expectedPublishedVersion, expectedDraftRevision });
  return d.version;
}

// --- Médias : upload désactivé cette passe (assets existants conservés) ---
export async function listMedia() { return []; }
export async function uploadMedia() { throw new Error("Import de média désactivé (disponible dans une prochaine version)."); }
