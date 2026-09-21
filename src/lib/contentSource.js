// Source de contenu du site public.
// - "api"  : /api/content/published (défaut prod & dev).
// - "file" : fallback local, UNIQUEMENT si explicitement autorisé en dev.
// - "e2e"  : fixture locale (build e2e).
export function chooseContentSource({ isDev, mode, allowFallback }) {
  if (mode === "e2e") return "e2e";
  if (isDev && allowFallback) return "file";
  return "api";
}
