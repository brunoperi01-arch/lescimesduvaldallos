import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { dbTestConfig, expectedDbName } from "../dbTestGuard.js";

const CFG = dbTestConfig();
const run = CFG ? describe : describe.skip;
const rid = () => "t" + Math.random().toString(36).slice(2, 10);

run("PostgreSQL réel — runtime, permissions et parcours CMS", () => {
  let pg, admin, runtime, pool;
  const valid = {
    legal: { mediateur: "Médiateur test", raisonSociale: "R", capital: "1", rcs: "1", siret: "1", tva: "1", atoutFrance: "1" },
    pages: [], hebergements: [], reviews: [],
  };

  beforeAll(async () => {
    pg = (await import("pg")).default;
    admin = new pg.Client({ connectionString: CFG.adminUrl });
    runtime = new pg.Client({ connectionString: CFG.runtimeUrl });
    pool = new pg.Pool({ connectionString: CFG.runtimeUrl, max: 24 });
    await admin.connect(); await runtime.connect();
    for (const client of [admin, runtime]) {
      const q = await client.query("select current_database() db");
      if (q.rows[0].db !== expectedDbName(CFG.runtimeUrl)) throw new Error("Base courante inattendue — abandon");
    }
  });
  afterAll(async () => { await runtime?.end(); await admin?.end(); await pool?.end(); });

  async function reset() {
    await admin.query(`truncate public.cimes_audit_log, public.cimes_content_media_refs,
      public.cimes_media, public.cimes_sessions, public.cimes_login_attempts,
      public.cimes_content_versions, public.cimes_content_drafts,
      public.cimes_published_content, public.cimes_admins restart identity cascade`);
  }
  async function denied(sql, params = [], client = runtime) {
    try { await client.query(sql, params); return null; } catch (e) { return e.code; }
  }

  it("rôle runtime restreint et écritures directes refusées", async () => {
    const identity = await runtime.query(`select current_user username,
      pg_has_role(current_user,'cimes_app','member') member,
      (select rolsuper from pg_catalog.pg_roles where rolname=current_user) superuser`);
    expect(identity.rows[0].member).toBe(true);
    expect(identity.rows[0].superuser).toBe(false);
    expect(await denied("insert into public.cimes_published_content(id,version,content) values(true,1,'{}')")).toBe("42501");
    expect(await denied("insert into public.cimes_content_versions(version,action,content) values(1,'publish','{}')")).toBe("42501");
    expect(await denied("insert into public.cimes_audit_log(action) values('login_fail')")).toBe("42501");
    expect(await denied("update public.cimes_audit_log set action='login_fail'")).toBe("42501");
    expect(await denied("delete from public.cimes_audit_log")).toBe("42501");
    expect(await denied("select public.cimes_seed('{}'::jsonb,true)")).toBe("42501");
    const old = await runtime.query("select to_regprocedure('public.cimes_log_audit(text,uuid)') fn");
    expect(old.rows[0].fn).toBeNull();
  });

  it("session, brouillon, publication, historique, restauration, révocation et audit atomiques", async () => {
    await reset();
    const a = await admin.query("insert into public.cimes_admins(email,password_hash) values('admin@test.invalid','hash') returning id");
    const aid = a.rows[0].id;
    await admin.query("insert into public.cimes_content_drafts(id,content,base_version,draft_revision) values(true,$1,0,1)", [valid]);

    const token = "a".repeat(64);
    const s = await runtime.query("select public.cimes_create_session($1,$2) id", [aid, token]);
    expect(s.rows[0].id).toBeTruthy();
    const visible = await runtime.query("select admin_id from public.cimes_sessions where token_hash=$1 and revoked_at is null", [token]);
    expect(visible.rows[0].admin_id).toBe(aid);

    const saved = await runtime.query("select public.cimes_save_draft($1,0,1,$2::jsonb) rev", [aid, JSON.stringify(valid)]);
    expect(Number(saved.rows[0].rev)).toBe(2);
    expect(await denied("select public.cimes_save_draft($1,0,1,$2::jsonb)", [aid, JSON.stringify(valid)])).toBe("P0001");

    const pub = await runtime.query("select public.cimes_publish($1,0,2) version", [aid]);
    expect(Number(pub.rows[0].version)).toBe(1);
    const history = await runtime.query("select id,action from public.cimes_content_versions order by id");
    expect(history.rows.some((x) => x.action === "publish")).toBe(true);
    const versionId = history.rows.find((x) => x.action === "publish").id;

    const restored = await runtime.query("select public.cimes_restore($1,1,3,$2) version", [aid, versionId]);
    expect(Number(restored.rows[0].version)).toBe(2);
    const revoked = await runtime.query("select public.cimes_revoke_session($1) ok", [token]);
    expect(revoked.rows[0].ok).toBe(true);
    const gone = await runtime.query("select 1 from public.cimes_sessions where token_hash=$1 and revoked_at is null", [token]);
    expect(gone.rowCount).toBe(0);

    const audit = await admin.query("select action,admin_id,admin_email from public.cimes_audit_log order by id");
    expect(audit.rows.map((x) => x.action)).toEqual(["login_ok", "save_draft", "publish", "restore", "logout"]);
    expect(audit.rows.every((x) => x.admin_id === aid && x.admin_email === "admin@test.invalid")).toBe(true);
  });

  it("administrateur désactivé et contenu non publiable refusés", async () => {
    await reset();
    const a = await admin.query("insert into public.cimes_admins(email,password_hash,disabled_at) values('off@test.invalid','hash',now()) returning id");
    expect(await denied("select public.cimes_create_session($1,$2)", [a.rows[0].id, "b".repeat(64)])).toBe("P0001");
    const active = await admin.query("insert into public.cimes_admins(email,password_hash) values('on@test.invalid','hash') returning id");
    await admin.query("insert into public.cimes_content_drafts(id,content,base_version,draft_revision) values(true,$1,0,1)", [{ legal: {} }]);
    expect(await denied("select public.cimes_publish($1,0,1)", [active.rows[0].id])).toBe("P0001");
  });

  it("garde-fous 0005 : casse et espaces variables", async () => {
    for (const note of ["safeBOOKING", "54   places", "230\u00a0km", "TODO", "35 € animal"]) {
      expect(await denied("select public.cimes_assert_publishable($1::jsonb)", [JSON.stringify({ ...valid, note })], admin)).toBe("P0001");
    }
    await expect(admin.query("select public.cimes_assert_publishable($1::jsonb)", [JSON.stringify({ ...valid, note: "Texte public conforme" })])).resolves.toBeTruthy();
  });

  it("rate limiting concurrent : e-mail et IP sérialisés", async () => {
    const p = rid(), email = `${p}@test.invalid`, ip = `${p}-ip`, p2 = rid(), sharedIp = `${p2}-ip`;
    try {
      const sameEmail = await Promise.all(Array.from({ length: 6 }, (_, i) =>
        pool.query("select allowed from public.cimes_begin_login_attempt($1,$2)", [email, `${ip}-${i}`]).then((r) => r.rows[0].allowed)));
      expect(sameEmail.filter(Boolean).length).toBeLessThanOrEqual(5);
      const sameIp = await Promise.all(Array.from({ length: 21 }, (_, i) =>
        pool.query("select allowed from public.cimes_begin_login_attempt($1,$2)", [`${p2}${i}@test.invalid`, sharedIp]).then((r) => r.rows[0].allowed)));
      expect(sameIp.filter(Boolean).length).toBeLessThanOrEqual(20);
    } finally {
      await admin.query("delete from public.cimes_login_attempts where email like $1 or ip_hash like $2", [`${p}%`, `${p2}%`]);
    }
  });
});
