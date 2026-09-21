// Tests DB autorisés uniquement avec connexions admin/runtime distinctes vers
// la même cible et marqueur canonique exact "hostname:port/database".
// Jamais d'acceptation automatique parce que le nom contient "test".
function parts(u) {
  try { const x = new URL(u); return { host: x.hostname, port: x.port || "5432", db: x.pathname.replace(/^\//, ""), user: decodeURIComponent(x.username) }; }
  catch { return null; }
}
function canon(p) { return p ? `${p.host}:${p.port}/${p.db}` : null; }

export function dbTestUrl(env = process.env) {
  const cfg = dbTestConfig(env);
  return cfg ? cfg.runtimeUrl : null;
}

export function dbTestConfig(env = process.env) {
  const runtimeUrl = env.TEST_DATABASE_URL;
  const adminUrl = env.TEST_DATABASE_ADMIN_URL;
  const marker = env.TEST_DATABASE_MARKER;
  if (env.ALLOW_DB_TESTS !== "1" || !runtimeUrl || !adminUrl || !marker) return null;
  const runtime = parts(runtimeUrl), admin = parts(adminUrl);
  const target = canon(runtime);
  if (!target || marker !== target) return null;                 // marqueur = empreinte exacte
  if (canon(admin) !== target || !runtime?.user || !admin?.user || runtime.user === admin.user) return null;
  const prod = [canon(parts(env.DATABASE_URL)), canon(parts(env.DATABASE_ADMIN_URL))].filter(Boolean);
  if (prod.includes(target)) return null;                        // jamais la prod
  return { runtimeUrl, adminUrl, marker, runtimeRole: runtime.user, database: runtime.db };
}
// Nom de base attendu (à comparer à current_database() après connexion).
export function expectedDbName(url) { const p = parts(url); return p ? p.db : null; }
