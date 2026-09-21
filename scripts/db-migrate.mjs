// Applique neon/migrations/*.sql avec DATABASE_ADMIN_URL (client pg, transactions réelles).
import { readdirSync, readFileSync } from "node:fs";
import pg from "pg";
import { runMigrations } from "../server/migrate.js";

const url = process.env.DATABASE_ADMIN_URL;
if (!url) { console.error("DATABASE_ADMIN_URL requis"); process.exit(1); }
const dir = new URL("../neon/migrations/", import.meta.url);
const files = readdirSync(dir).filter((x) => x.endsWith(".sql"))
  .map((filename) => ({ filename, body: readFileSync(new URL(filename, dir), "utf8") }));

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const results = await runMigrations({ client, files });
  for (const r of results) console.log(`${r.status === "applied" ? "→" : "="} ${r.file} (${r.status})`);
  console.log("Migrations à jour.");
} finally {
  await client.end();
}
