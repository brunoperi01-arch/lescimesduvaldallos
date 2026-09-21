-- =====================================================================
-- 0006_runtime_release.sql — sessions et audit atomiques.
-- Additif : 0001..0005 restent gelées. Le runner gère la transaction.
-- =====================================================================

-- Le runtime ne peut plus écrire directement les sessions ni appeler une
-- fonction d'audit générique avec une identité choisie par le client.
revoke insert, update, delete on public.cimes_sessions from cimes_app;
revoke select, insert, update, delete on public.cimes_audit_log from cimes_app;
revoke all on function public.cimes_log_audit(text, uuid) from cimes_app;
drop function if exists public.cimes_log_audit(text, uuid);

create or replace function public.cimes_create_session(p_admin uuid, p_token_hash text)
returns uuid language plpgsql security definer
set search_path = pg_catalog, public, pg_temp as $$
declare sid uuid; a_email text;
begin
  if p_token_hash is null or length(p_token_hash) < 32 then
    raise exception 'token_invalide' using errcode = 'P0001';
  end if;
  select email into a_email from public.cimes_admins
    where id = p_admin and disabled_at is null;
  if a_email is null then raise exception 'admin_invalide' using errcode = 'P0001'; end if;
  insert into public.cimes_sessions(admin_id, token_hash, expires_at)
    values(p_admin, p_token_hash, now() + interval '8 hours') returning id into sid;
  insert into public.cimes_audit_log(action, admin_id, admin_email)
    values('login_ok', p_admin, a_email);
  return sid;
end $$;
revoke all on function public.cimes_create_session(uuid, text) from public;
grant execute on function public.cimes_create_session(uuid, text) to cimes_app;

create or replace function public.cimes_revoke_session(p_token_hash text)
returns boolean language plpgsql security definer
set search_path = pg_catalog, public, pg_temp as $$
declare aid uuid; a_email text;
begin
  select s.admin_id, a.email into aid, a_email
    from public.cimes_sessions s
    join public.cimes_admins a on a.id = s.admin_id
    where s.token_hash = p_token_hash and s.revoked_at is null
    for update of s;
  if aid is null then return false; end if;
  update public.cimes_sessions set revoked_at = now()
    where token_hash = p_token_hash and revoked_at is null;
  insert into public.cimes_audit_log(action, admin_id, admin_email)
    values('logout', aid, a_email);
  return true;
end $$;
revoke all on function public.cimes_revoke_session(text) from public;
grant execute on function public.cimes_revoke_session(text) to cimes_app;

-- Un échec anonyme ne peut produire que l'action login_fail.
create or replace function public.cimes_log_login_failure()
returns void language plpgsql security definer
set search_path = pg_catalog, public, pg_temp as $$
begin
  insert into public.cimes_audit_log(action, admin_id, admin_email)
    values('login_fail', null, null);
end $$;
revoke all on function public.cimes_log_login_failure() from public;
grant execute on function public.cimes_log_login_failure() to cimes_app;
