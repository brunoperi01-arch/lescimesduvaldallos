import pg from "pg";

const url = process.env.DATABASE_ADMIN_URL;
const role = process.env.DATABASE_RUNTIME_ROLE;
if (!url || !role) {
  console.error("DATABASE_ADMIN_URL et DATABASE_RUNTIME_ROLE requis");
  process.exit(1);
}
if (!/^[a-z_][a-z0-9_]{0,62}$/.test(role) || role === "cimes_app") {
  console.error("DATABASE_RUNTIME_ROLE invalide");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const q = await client.query(`select r.rolcanlogin, r.rolsuper,
    r.oid = d.datdba as owns_database, r.rolname = current_user as is_current_user
    from pg_catalog.pg_roles r
    cross join pg_catalog.pg_database d
    where r.rolname = $1 and d.datname = current_database()`, [role]);
  const r = q.rows[0];
  if (!r) throw new Error("rôle runtime introuvable");
  if (!r.rolcanlogin) throw new Error("le rôle runtime doit posséder LOGIN");
  if (r.rolsuper || r.owns_database || r.is_current_user) throw new Error("le rôle runtime ne doit être ni superuser, ni propriétaire, ni rôle administrateur courant");
  await client.query(`grant cimes_app to "${role}"`);
  console.log("Rôle runtime associé à cimes_app.");
} finally { await client.end(); }

