// État des migrations SANS modifier la base (DATABASE_ADMIN_URL).
import { readdirSync, readFileSync } from "node:fs";
import pg from "pg";
import { sha256 } from "../server/migrate.js";
import { statusReport, statusExitCode } from "../server/status.js";
const url = process.env.DATABASE_ADMIN_URL;
if (!url) { console.error("DATABASE_ADMIN_URL requis"); process.exit(1); }
const dir = new URL("../neon/migrations/", import.meta.url);
const files = readdirSync(dir).filter((x) => x.endsWith(".sql"))
  .map((filename) => ({ filename, checksum: sha256(readFileSync(new URL(filename, dir), "utf8")) }));
const client = new pg.Client({ connectionString: url });
await client.connect();
let rows = [];
try {
  const r = await client.query("select filename, checksum from public.cimes_schema_migrations");
  rows = r.rows;
} catch (e) {
  if (e.code === "42P01") { rows = []; }                 // ledger absent : normal
  else { console.error("Erreur SQL:", e.message); await client.end(); process.exit(1); }
} 
await client.end();
const report = statusReport(files, rows);
for (const r of report) console.log(`${r.state.padEnd(12)} ${r.filename}  local=${(r.local || "-").slice(0, 12)}  recorded=${(r.recorded || "-").slice(0, 12)}`);
process.exit(statusExitCode(report));
