-- =====================================================================
-- 0002_security_core.sql — Durcissement. Additif, idempotent.
-- Convention : AUCUN begin/commit ici — le runner enveloppe chaque fichier
-- dans une transaction unique. NON EXÉCUTÉ ici (aucun Postgres réel).
-- =====================================================================
revoke create on schema public from public;

create table if not exists public.cimes_schema_migrations (
  filename   text primary key,
  checksum   text not null,
  applied_at timestamptz not null default now()
);

-- Anciennes signatures éventuelles (bases ayant reçu une version antérieure)
drop function if exists public.cimes_publish(uuid, text, integer, bigint);
drop function if exists public.cimes_restore(uuid, text, integer, bigint, bigint);
drop function if exists public.cimes_begin_login_attempt(text, text);

-- Le runtime n'écrit plus directement le brouillon ni les tentatives.
revoke insert, update on public.cimes_content_drafts from cimes_app;
revoke insert, update on public.cimes_login_attempts from cimes_app;
revoke execute on function public.cimes_seed(jsonb, boolean) from cimes_app;

-- Sauvegarde de brouillon contrôlée (identité chargée depuis la base)
create or replace function public.cimes_save_draft(p_admin uuid, p_expected_version integer, p_expected_revision bigint, p_content jsonb)
returns bigint language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare cur_pub integer; cur_rev bigint; a_email text;
begin
  select email into a_email from public.cimes_admins where id = p_admin and disabled_at is null;
  if a_email is null then raise exception 'admin_invalide'; end if;
  select version into cur_pub from public.cimes_published_content where id = true for update;
  select draft_revision into cur_rev from public.cimes_content_drafts where id = true for update;
  cur_pub := coalesce(cur_pub, 0); cur_rev := coalesce(cur_rev, 0);
  if p_expected_version <> cur_pub then raise exception 'published_conflict'; end if;
  if p_expected_revision <> cur_rev then raise exception 'draft_conflict'; end if;
  insert into public.cimes_content_drafts(id, content, base_version, draft_revision, author_id, updated_at)
    values(true, p_content, cur_pub, cur_rev + 1, p_admin, now())
    on conflict (id) do update set content = p_content, base_version = cur_pub,
      draft_revision = cur_rev + 1, author_id = p_admin, updated_at = now();
  insert into public.cimes_audit_log(action, admin_id, admin_email) values('save_draft', p_admin, a_email);
  return cur_rev + 1;
end $$;
revoke all on function public.cimes_save_draft(uuid, integer, bigint, jsonb) from public;
grant execute on function public.cimes_save_draft(uuid, integer, bigint, jsonb) to cimes_app;

-- Rate limiting atomique : DOUBLE verrou (e-mail + IP) acquis dans un ordre déterministe.
create or replace function public.cimes_begin_login_attempt(p_email text, p_ip_hash text)
returns table(allowed boolean, retry_after integer, attempt_id bigint)
language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare k1 bigint; k2 bigint; n_email integer; n_ip integer; new_id bigint;
begin
  k1 := hashtext('cimes_login_email:' || coalesce(p_email, ''));
  k2 := hashtext('cimes_login_ip:'    || coalesce(p_ip_hash, ''));
  perform pg_advisory_xact_lock(least(k1, k2));   -- ordre déterministe -> pas d'interblocage
  perform pg_advisory_xact_lock(greatest(k1, k2));
  delete from public.cimes_login_attempts where at < now() - interval '1 hour';
  select count(*) into n_email from public.cimes_login_attempts
    where email = p_email and success = false and at > now() - interval '15 minutes';
  select count(*) into n_ip from public.cimes_login_attempts
    where ip_hash = p_ip_hash and success = false and at > now() - interval '15 minutes';
  if n_email >= 5 or n_ip >= 20 then
    return query select false, 900, null::bigint; return;
  end if;
  insert into public.cimes_login_attempts(email, ip_hash, success)
    values(p_email, p_ip_hash, false) returning id into new_id;
  return query select true, 0, new_id;
end $$;
revoke all on function public.cimes_begin_login_attempt(text, text) from public;
grant execute on function public.cimes_begin_login_attempt(text, text) to cimes_app;

create or replace function public.cimes_complete_login_attempt(p_attempt_id bigint, p_success boolean)
returns void language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  update public.cimes_login_attempts set success = p_success where id = p_attempt_id;
end $$;
revoke all on function public.cimes_complete_login_attempt(bigint, boolean) from public;
grant execute on function public.cimes_complete_login_attempt(bigint, boolean) to cimes_app;
