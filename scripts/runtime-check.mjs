import pg from "pg";

const url = process.env.DATABASE_URL;
const expected = process.env.DATABASE_RUNTIME_ROLE;
if (!url || !expected) {
  console.error("DATABASE_URL et DATABASE_RUNTIME_ROLE requis");
  process.exit(1);
}
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const q = await client.query(`select current_user as username,
    (select rolsuper from pg_catalog.pg_roles where rolname = current_user) as rolsuper,
    pg_has_role(current_user, 'cimes_app', 'member') as app_member,
    exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_roles o on o.oid=c.relowner
      where c.relnamespace='public'::regnamespace and o.rolname=current_user) as owns_app_object,
    has_table_privilege(current_user,'public.cimes_published_content','SELECT') as can_read_published,
    has_table_privilege(current_user,'public.cimes_published_content','INSERT,UPDATE,DELETE') as can_write_published,
    has_table_privilege(current_user,'public.cimes_audit_log','INSERT,UPDATE,DELETE') as can_write_audit,
    has_table_privilege(current_user,'public.cimes_admins','INSERT,UPDATE,DELETE') as can_write_admins`);
  const r = q.rows[0];
  if (r.username !== expected) throw new Error("DATABASE_URL n'utilise pas DATABASE_RUNTIME_ROLE");
  if (r.rolsuper || r.owns_app_object || !r.app_member || !r.can_read_published || r.can_write_published || r.can_write_audit || r.can_write_admins) {
    throw new Error("permissions du rôle runtime non conformes");
  }
  console.log("Rôle runtime restreint : OK.");
} finally { await client.end(); }

