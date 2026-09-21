// Exécute réellement migrations + tests DB. ÉCHOUE si les tests seraient SAUTÉS.
import { execSync } from "node:child_process";
import { dbTestConfig } from "../server/dbTestGuard.js";
const cfg = dbTestConfig();
if (!cfg) {
  console.error("validate:neon : ALLOW_DB_TESTS=1, TEST_DATABASE_ADMIN_URL, TEST_DATABASE_URL et TEST_DATABASE_MARKER cohérents sont requis.");
  process.exit(1);
}
try {
  const clean = { ...process.env };
  delete clean.DATABASE_URL;
  delete clean.DATABASE_ADMIN_URL;
  const adminEnv = { ...clean, DATABASE_ADMIN_URL: cfg.adminUrl, DATABASE_RUNTIME_ROLE: cfg.runtimeRole };
  const runtimeEnv = { ...clean, DATABASE_URL: cfg.runtimeUrl, DATABASE_RUNTIME_ROLE: cfg.runtimeRole };
  execSync("node scripts/db-migrate.mjs", { stdio: "inherit", env: adminEnv });
  execSync("node scripts/db-migrate.mjs", { stdio: "inherit", env: adminEnv });
  execSync("node scripts/runtime-grant.mjs", { stdio: "inherit", env: adminEnv });
  execSync("node scripts/runtime-check.mjs", { stdio: "inherit", env: runtimeEnv });
  execSync("npx vitest run", { stdio: "inherit", env: clean });
} catch { process.exit(1); }
console.log("validate:neon : migrations idempotentes, rôle runtime et tests DB validés sur la même base.");
