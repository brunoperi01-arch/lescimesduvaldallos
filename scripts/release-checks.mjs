// Contrôles de release (après lint/test/build) : dist sans secret ni Supabase,
// runtime sans import Supabase, migrations gelées intactes. Sortie != 0 si échec.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
const fails = [];
const walk = (d) => existsSync(d) ? readdirSync(d).flatMap((n) => { const p = d + "/" + n; return statSync(p).isDirectory() ? walk(p) : [p]; }) : [];
const sha = (f) => createHash("sha256").update(readFileSync(f, "utf8")).digest("hex");

if (!existsSync("dist")) fails.push("dist/ absent — exécutez `npm run build` avant.");
const secretPat = [/DATABASE_URL/, /DATABASE_ADMIN_URL/, /SESSION_SECRET/, /ADMIN_PASS/, /postgres:\/\//, /service_role/, /BLOB_READ_WRITE_TOKEN/, /supabase/i];
for (const f of walk("dist")) { const c = readFileSync(f, "utf8"); for (const p of secretPat) if (p.test(c)) fails.push(`dist contient ${p} (${f})`); }

const runtime = [...walk("src"), ...walk("api"), ...walk("server")].filter((f) => /\.(js|jsx)$/.test(f) && !/__tests__/.test(f));
for (const f of runtime) {
  const c = readFileSync(f, "utf8");
  if (/@supabase\/|VITE_SUPABASE|from ["'][^"']*supabase/.test(c)) fails.push(`import Supabase applicatif dans ${f}`);
  if (/@vercel\/blob|BLOB_READ_WRITE_TOKEN/.test(c)) fails.push(`Blob applicatif dans ${f}`);
}

const frozen = {
  "0001_init.sql": "6f87a17a793fb91c483327a606d04df24011b4cedace76809ba567b82711896e",
  "0002_security_core.sql": "358e6def890d6500d1708810beeee1f6a911910b1e4d51b8d3fbb60d0eba1d11",
  "0003_runtime_validation.sql": "df0c9d2d075cc317215b21a6c45a8359bba9444fe747e39a4a244e80eadc7658",
  "0004_publication_integrity.sql": "9f0fbb0f15f463c1dbce1cedd8ad8081e68e661f70a9f76c957f230b6c5d5444",
  "0005_final_hardening.sql": "c3a63efe6f991f9817ca3f90490fc6aa63684711e81b2d05a2dd0d0ad0513778",
};
for (const [f, ck] of Object.entries(frozen)) { const a = sha("neon/migrations/" + f); if (a !== ck) fails.push(`checksum gelé modifié: ${f}`); }
if (!existsSync("neon/migrations/0006_runtime_release.sql")) fails.push("migration 0006 absente");

if (fails.length) { console.error("VALIDATION RELEASE : ÉCHEC\n- " + fails.join("\n- ")); process.exit(1); }
console.log("VALIDATION RELEASE : OK (dist sans secret, Supabase ou Blob ; migrations 0001-0005 gelées intactes).");
