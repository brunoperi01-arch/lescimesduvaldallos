-- =====================================================================
-- 0005_final_hardening.sql — Regex robustes + intégrité du journal d'audit.
-- Additif. Convention : aucun begin/commit (le runner enveloppe).
-- NON EXÉCUTÉ ici (aucun Postgres réel). 0001–0004 restent gelées.
-- =====================================================================

-- Garde-fou de publiabilité : regex PostgreSQL robustes ([[:space:]], ~* casse).
create or replace function public.cimes_assert_publishable(c jsonb)
returns void language plpgsql immutable set search_path = pg_catalog, public, pg_temp as $$
declare t text := c::text; pg jsonb; sec jsonb; h jsonb;
begin
  if btrim(coalesce(c #>> '{legal,mediateur}', '')) = '' then raise exception 'mediateur_manquant' using errcode = 'P0001'; end if;
  if btrim(coalesce(c #>> '{legal,raisonSociale}', '')) = '' or btrim(coalesce(c #>> '{legal,capital}', '')) = ''
     or btrim(coalesce(c #>> '{legal,rcs}', '')) = '' or btrim(coalesce(c #>> '{legal,siret}', '')) = ''
     or btrim(coalesce(c #>> '{legal,tva}', '')) = '' or btrim(coalesce(c #>> '{legal,atoutFrance}', '')) = '' then
    raise exception 'mentions_legales_incompletes' using errcode = 'P0001'; end if;
  if t ~* 'À COMPLÉTER' or t ~* '(^|[^[:alnum:]])TODO([^[:alnum:]]|$)' then raise exception 'placeholder_present' using errcode = 'P0001'; end if;
  if t ~* '230[[:space:]]*km' then raise exception 'chiffre_230_interdit' using errcode = 'P0001'; end if;
  if t ~* '(domaines?|skiables?)[[:space:]]+(de[[:space:]]+France|français)' then raise exception 'mention_de_France_interdite' using errcode = 'P0001'; end if;
  if t ~* '2[[:space:]]*575[[:space:]]*m' or t ~* 'altitude[[:space:]]+max' then raise exception 'altitude_interdite' using errcode = 'P0001'; end if;
  if t ~* 'safebooking' then raise exception 'info_safebooking' using errcode = 'P0001'; end if;
  if t ~* '54[[:space:]]*places' then raise exception 'info_54_places' using errcode = 'P0001'; end if;
  if t ~* '35[[:space:]]*€' and t ~* 'animal' then raise exception 'info_animaux' using errcode = 'P0001'; end if;
  if t ~* 'acompte' and t ~* '30[[:space:]]*%' then raise exception 'info_acompte' using errcode = 'P0001'; end if;
  if (t ~* '40[[:space:]]*€' and t ~* 'hiver') or (t ~* '25[[:space:]]*€' and t ~* 'été') then raise exception 'info_parking' using errcode = 'P0001'; end if;
  if (c->'reviews') is not null and jsonb_typeof(c->'reviews') = 'array' and jsonb_array_length(c->'reviews') > 0 then
    raise exception 'avis_fictifs' using errcode = 'P0001'; end if;
  for pg in select * from jsonb_array_elements(coalesce(c->'pages', '[]'::jsonb)) loop
    for sec in select * from jsonb_array_elements(coalesce(pg->'sections', '[]'::jsonb)) loop
      if sec->>'type' = 'cta' and coalesce(sec->>'lien', '') in ('', '#') then raise exception 'lien_invalide' using errcode = 'P0001'; end if;
      if sec->>'type' = 'image' and btrim(coalesce(sec->>'alt', '')) = '' then raise exception 'image_sans_alt' using errcode = 'P0001'; end if;
    end loop;
  end loop;
  for h in select * from jsonb_array_elements(coalesce(c->'hebergements', '[]'::jsonb)) loop
    if coalesce(h->>'img', '') <> '' and btrim(coalesce(h->>'alt', '')) = '' then raise exception 'hebergement_image_sans_alt' using errcode = 'P0001'; end if;
  end loop;
end $$;
revoke all on function public.cimes_assert_publishable(jsonb) from public;

-- Intégrité de l'audit : plus d'écriture directe du runtime ; e-mail dérivé de l'identité.
revoke insert, update, delete on public.cimes_audit_log from cimes_app;
drop function if exists public.cimes_log_audit(text, uuid, text);   -- ancienne signature (email fourni)

create or replace function public.cimes_log_audit(p_action text, p_admin uuid)
returns void language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare a_email text;
begin
  if p_action not in ('login_ok','login_fail','logout','save_draft','publish','restore','seed','media_upload','media_delete') then
    raise exception 'action_invalide' using errcode = 'P0001'; end if;
  if p_admin is not null then
    select email into a_email from public.cimes_admins where id = p_admin and disabled_at is null;
    if a_email is null then raise exception 'admin_invalide' using errcode = 'P0001'; end if;   -- absent/désactivé/incohérent
  end if;
  insert into public.cimes_audit_log(action, admin_id, admin_email) values(p_action, p_admin, a_email);
end $$;
revoke all on function public.cimes_log_audit(text, uuid) from public;
grant execute on function public.cimes_log_audit(text, uuid) to cimes_app;
