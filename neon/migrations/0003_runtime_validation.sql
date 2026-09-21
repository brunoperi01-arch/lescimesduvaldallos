-- =====================================================================
-- 0003_runtime_validation.sql — Renforce cimes_begin_login_attempt.
-- Additif. Convention : aucun begin/commit (le runner enveloppe).
-- NON EXÉCUTÉ ici (aucun Postgres réel).
-- =====================================================================
drop function if exists public.cimes_begin_login_attempt(text, text);

create function public.cimes_begin_login_attempt(p_email text, p_ip_hash text)
returns table(allowed boolean, retry_after integer, attempt_id bigint)
language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_email text; v_ip text; k1 bigint; k2 bigint; n_email integer; n_ip integer; new_id bigint;
begin
  v_email := lower(btrim(coalesce(p_email, '')));
  v_ip := btrim(coalesce(p_ip_hash, ''));
  if v_email = '' or v_ip = '' then raise exception 'parametres_invalides' using errcode = '22023'; end if;
  if length(v_email) > 320 or length(v_ip) > 128 then raise exception 'parametres_trop_longs' using errcode = '22023'; end if;

  k1 := hashtext('cimes_login_email:' || v_email);
  k2 := hashtext('cimes_login_ip:' || v_ip);
  perform pg_advisory_xact_lock(least(k1, k2));    -- ordre déterministe
  perform pg_advisory_xact_lock(greatest(k1, k2));

  delete from public.cimes_login_attempts where at < now() - interval '1 hour';
  select count(*) into n_email from public.cimes_login_attempts
    where email = v_email and success = false and at > now() - interval '15 minutes';
  select count(*) into n_ip from public.cimes_login_attempts
    where ip_hash = v_ip and success = false and at > now() - interval '15 minutes';
  if n_email >= 5 or n_ip >= 20 then
    return query select false, 900, null::bigint; return;
  end if;
  insert into public.cimes_login_attempts(email, ip_hash, success)
    values(v_email, v_ip, false) returning id into new_id;
  return query select true, 0, new_id;
end $$;
revoke all on function public.cimes_begin_login_attempt(text, text) from public;
grant execute on function public.cimes_begin_login_attempt(text, text) to cimes_app;
