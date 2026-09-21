// Accès Neon (runtime). Client paresseux : pas d'init au chargement (testable).
import { neon } from "@neondatabase/serverless";
import { getConfig } from "./config.js";
let _sql = null;
function sql() { if (!_sql) _sql = neon(getConfig().databaseUrl); return _sql; }

export const neonDb = {
  async getPublished() {
    const r = await sql()`select version, content from public.cimes_published_content where id = true`;
    return r[0] || null;
  },
  async getAdminByEmail(email) {
    const r = await sql()`select id, email, password_hash, disabled_at from public.cimes_admins where email = ${email}`;
    return r[0] || null;
  },
  async beginLoginAttempt({ email, ipHash }) {
    const r = await sql()`select allowed, retry_after as "retryAfter", attempt_id as "attemptId"
      from public.cimes_begin_login_attempt(${email}, ${ipHash})`;
    return r[0];
  },
  async completeLoginAttempt(attemptId, success) {
    await sql()`select public.cimes_complete_login_attempt(${attemptId}, ${success})`;
  },
  async createSession(adminId, tokenHash) {
    const r = await sql()`select public.cimes_create_session(${adminId}::uuid, ${tokenHash}) as id`;
    return r[0];
  },
  async getSessionByTokenHash(th) {
    const r = await sql()`select s.id as "sessionId", s.admin_id as "adminId", a.email, s.expires_at as "expiresAt"
      from public.cimes_sessions s join public.cimes_admins a on a.id = s.admin_id
      where s.token_hash = ${th} and s.revoked_at is null and s.expires_at > now() and a.disabled_at is null`;
    return r[0] || null;
  },
  async revokeSessionByTokenHash(th) {
    await sql()`select public.cimes_revoke_session(${th})`;
  },
  async getDraftState() {
    const r = await sql()`select d.content, d.draft_revision as "draftRevision", d.updated_at as "updatedAt",
      coalesce(p.version, 0) as "publishedVersion"
      from public.cimes_content_drafts d left join public.cimes_published_content p on p.id = true where d.id = true`;
    const row = r[0];
    return row ? { content: row.content, draftRevision: Number(row.draftRevision), updatedAt: row.updatedAt, publishedVersion: Number(row.publishedVersion) }
               : { content: null, draftRevision: 0, updatedAt: null, publishedVersion: 0 };
  },
  async getDraftContent() { const r = await sql()`select content from public.cimes_content_drafts where id = true`; return r[0] ? r[0].content : null; },
  async saveDraft(adminId, expectedVersion, expectedRevision, content) {
    // Valeurs attendues transmises EXACTEMENT par le client (aucune relecture auto).
    const r = await sql()`select public.cimes_save_draft(${adminId}::uuid, ${expectedVersion}, ${expectedRevision}, ${JSON.stringify(content)}::jsonb) as rev`;
    return Number(r[0].rev);
  },
  async publish(adminId, expectedVersion, expectedRevision) {
    const r = await sql()`select public.cimes_publish(${adminId}::uuid, ${expectedVersion}, ${expectedRevision}) as v`;
    return Number(r[0].v);
  },
  async listVersions(limit, cursor) {
    const rows = cursor
      ? await sql()`select v.id, v.version, v.action, v.created_at as "createdAt", a.email as "authorEmail"
          from public.cimes_content_versions v left join public.cimes_admins a on a.id = v.author_id where v.id < ${cursor} order by v.id desc limit ${limit + 1}`
      : await sql()`select v.id, v.version, v.action, v.created_at as "createdAt", a.email as "authorEmail"
          from public.cimes_content_versions v left join public.cimes_admins a on a.id = v.author_id order by v.id desc limit ${limit + 1}`;
    const items = rows.slice(0, limit);
    return { items, nextCursor: rows.length > limit ? items[items.length - 1].id : null };
  },
  async getVersionContent(versionId) { const r = await sql()`select content from public.cimes_content_versions where id = ${versionId}`; return r[0] ? r[0].content : null; },
  async restore(adminId, expectedVersion, expectedRevision, versionId) {
    const r = await sql()`select public.cimes_restore(${adminId}::uuid, ${expectedVersion}, ${expectedRevision}, ${versionId}) as v`;
    return Number(r[0].v);
  },
  async logLoginFailure() {
    await sql()`select public.cimes_log_login_failure()`;
  },
};
