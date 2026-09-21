// Runner de migrations : exécute chaque FICHIER COMPLET en une requête, dans
// une transaction, et enregistre nom+checksum atomiquement. Aucun parseur SQL maison.
import { createHash } from "node:crypto";

export function sha256(text) { return createHash("sha256").update(text).digest("hex"); }

const MIGRATION_LOCK_KEY = 918273645; // clé stable : empêche deux migrations simultanées

export function migrationId(filename) {
  const m = String(filename).match(/^(\d{4})_[a-z0-9_]+\.sql$/);
  if (!m) throw new Error("nom de migration invalide: " + filename);
  return m[1];
}

// client : objet avec query(text[, params]) -> { rows } (compatible pg.Client).
export async function runMigrations({ client, files }) {
  const ids = new Set();
  for (const f of files) {
    const id = migrationId(f.filename);
    if (ids.has(id)) throw new Error("identifiant de migration dupliqué: " + id);
    ids.add(id);
  }

  // Configuration valide et paramétrée ; aucune erreur masquée : si elle échoue,
  // la migration ne démarre pas (l'exception remonte).
  await client.query("select set_config('lock_timeout', $1, false)", ["5s"]);

  // Le verrou est acquis ici ; en cas d'échec l'exception remonte et le try
  // n'est pas exécuté (donc pas de unlock injustifié).
  await client.query("select pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
  try {
    await client.query(`create table if not exists public.cimes_schema_migrations (
      filename text primary key, checksum text not null, applied_at timestamptz not null default now())`);
    const prev = {};
    const r = await client.query("select filename, checksum from public.cimes_schema_migrations");
    for (const row of r.rows) prev[row.filename] = row.checksum;

    const results = [];
    for (const f of [...files].sort((a, b) => a.filename.localeCompare(b.filename))) {
      const checksum = sha256(f.body);
      if (prev[f.filename]) {
        if (prev[f.filename] !== checksum) throw new Error("checksum modifié pour une migration appliquée: " + f.filename);
        results.push({ file: f.filename, status: "skipped" });
        continue;
      }
      await client.query("BEGIN");
      try {
        await client.query(f.body); // FICHIER COMPLET — jamais découpé
        await client.query("insert into public.cimes_schema_migrations(filename, checksum) values($1, $2)", [f.filename, checksum]);
        await client.query("COMMIT");
        results.push({ file: f.filename, status: "applied" });
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    }
    return results;
  } finally {
    await client.query("select pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY]);
  }
}
