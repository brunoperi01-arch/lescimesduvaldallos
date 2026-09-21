// Configuration serveur validée (jamais de secret ni de stack exposés).
function fail(msg) { const e = new Error(msg); e.code = "CONFIG"; throw e; }

let cached = null;
export function getConfig(env = process.env) {
  if (cached) return cached;
  const databaseUrl = env.DATABASE_URL;
  const sessionSecret = env.SESSION_SECRET;
  const allowedOrigins = env.ALLOWED_ORIGINS;
  const nodeEnv = env.NODE_ENV || "development";
  if (!databaseUrl) fail("DATABASE_URL manquant");
  if (!sessionSecret || Buffer.byteLength(sessionSecret, "utf8") < 32) fail("SESSION_SECRET manquant ou < 32 octets");
  if (!allowedOrigins) fail("ALLOWED_ORIGINS manquant");
  cached = { databaseUrl, sessionSecret, allowedOrigins, nodeEnv, isProd: nodeEnv === "production" };
  return cached;
}
export function resetConfigCache() { cached = null; }  // pour les tests
