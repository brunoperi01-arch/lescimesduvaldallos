-- =====================================================================
-- 0004_publication_integrity.sql — Garde-fou de publiabilité côté BASE.
-- Additif. Convention : aucun begin/commit (le runner enveloppe).
-- NON EXÉCUTÉ ici (aucun Postgres réel). 0001/0002/0003 restent gelées.
-- =====================================================================

-- Lève une exception si le contenu n'est pas publiable (défense en profondeur).
create or replace function public.cimes_assert_publishable(c jsonb)
returns void language plpgsql immutable set search_path = pg_catalog, public, pg_temp as $$
declare t text := c::text; pg jsonb; sec jsonb; h jsonb;
begin
  if btrim(coalesce(c #>> '{legal,mediateur}', '')) = '' then raise exception 'mediateur_manquant' using errcode = 'P0001'; end if;
  if btrim(coalesce(c #>> '{legal,raisonSociale}', '')) = '' or btrim(coalesce(c #>> '{legal,capital}', '')) = ''
     or btrim(coalesce(c #>> '{legal,rcs}', '')) = '' or btrim(coalesce(c #>> '{legal,siret}', '')) = ''
     or btrim(coalesce(c #>> '{legal,tva}', '')) = '' or btrim(coalesce(c #>> '{legal,atoutFrance}', '')) = '' then
    raise exception 'mentions_legales_incompletes' using errcode = 'P0001'; end if;
  if t ~ 'À COMPLÉTER' or t ~ '\mTODO\M' then raise exception 'placeholder_present' using errcode = 'P0001'; end if;
  if position('230 km' in t) > 0 then raise exception 'chiffre_230_interdit' using errcode = 'P0001'; end if;
  if t ~* '(domaines?|skiables?) (de France|français)' then raise exception 'mention_de_France_interdite' using errcode = 'P0001'; end if;
  if position('2 575 m' in t) > 0 or t ~* 'altitude max' then raise exception 'altitude_interdite' using errcode = 'P0001'; end if;
  if position('SafeBooking' in t) > 0 or t ~ '54\s*places' then raise exception 'info_non_confirmee' using errcode = 'P0001'; end if;
  if t ~* '35\s*€' and t ~* 'animal' then raise exception 'info_animaux_non_confirmee' using errcode = 'P0001'; end if;
  if t ~* 'acompte' and t ~* '30\s*%' then raise exception 'info_acompte_non_confirmee' using errcode = 'P0001'; end if;
  if (t ~* '40\s*€' and t ~* 'hiver') or (t ~* '25\s*€' and t ~* 'été') then raise exception 'info_parking_non_confirmee' using errcode = 'P0001'; end if;
  if (c->'reviews') is not null and jsonb_typeof(c->'reviews') = 'array' and jsonb_array_length(c->'reviews') > 0 then
    raise exception 'avis_fictifs_interdits' using errcode = 'P0001'; end if;
  -- liens # et images sans alt dans les pages
  for pg in select * from jsonb_array_elements(coalesce(c->'pages','[]'::jsonb)) loop
    for sec in select * from jsonb_array_elements(coalesce(pg->'sections','[]'::jsonb)) loop
      if sec->>'type' = 'cta' and coalesce(sec->>'lien','') in ('','#') then raise exception 'lien_vide_ou_diese' using errcode = 'P0001'; end if;
      if sec->>'type' = 'image' and coalesce(sec->>'alt','') = '' then raise exception 'image_sans_alt' using errcode = 'P0001'; end if;
    end loop;
  end loop;
  for h in select * from jsonb_array_elements(coalesce(c->'hebergements','[]'::jsonb)) loop
    if coalesce(h->>'img','') <> '' and coalesce(h->>'alt','') = '' then raise exception 'hebergement_image_sans_alt' using errcode = 'P0001'; end if;
  end loop;
end $$;
revoke all on function public.cimes_assert_publishable(jsonb) from public;

-- Publication : contrôle le BROUILLON VERROUILLÉ avant de le publier.
create or replace function public.cimes_publish(p_admin uuid, p_expected_version integer, p_expected_rev bigint)
returns integer language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare cur_pub integer; cur_rev bigint; draft jsonb; cur_pub_content jsonb; next_ver integer; a_email text;
begin
  select email into a_email from public.cimes_admins where id = p_admin and disabled_at is null;
  if a_email is null then raise exception 'admin_invalide' using errcode = 'P0001'; end if;
  select version, content into cur_pub, cur_pub_content from public.cimes_published_content where id = true for update;
  select draft_revision, content into cur_rev, draft from public.cimes_content_drafts where id = true for update;
  cur_pub := coalesce(cur_pub,0); cur_rev := coalesce(cur_rev,0);
  if draft is null then raise exception 'aucun_brouillon' using errcode = 'P0001'; end if;
  if p_expected_version <> cur_pub then raise exception 'published_conflict' using errcode = 'P0001'; end if;
  if p_expected_rev <> cur_rev then raise exception 'draft_conflict' using errcode = 'P0001'; end if;
  perform public.cimes_assert_publishable(draft);   -- contenu verrouillé = contenu publié
  next_ver := cur_pub + 1;
  if cur_pub_content is not null then
    insert into public.cimes_content_versions(version,action,content,author_id) values(cur_pub,'archive',cur_pub_content,p_admin);
  end if;
  insert into public.cimes_published_content(id,version,content,author_id,published_at)
    values(true,next_ver,draft,p_admin,now())
    on conflict(id) do update set version=next_ver, content=draft, author_id=p_admin, published_at=now();
  insert into public.cimes_content_versions(version,action,content,author_id) values(next_ver,'publish',draft,p_admin);
  update public.cimes_content_drafts set base_version=next_ver, draft_revision=cur_rev+1 where id=true;
  insert into public.cimes_audit_log(action,admin_id,admin_email,version) values('publish',p_admin,a_email,next_ver);
  return next_ver;
end $$;
revoke all on function public.cimes_publish(uuid, integer, bigint) from public;
grant execute on function public.cimes_publish(uuid, integer, bigint) to cimes_app;

-- Restauration : contrôle l'entrée d'historique verrouillée avant restauration.
create or replace function public.cimes_restore(p_admin uuid, p_expected_version integer, p_expected_rev bigint, p_version_id bigint)
returns integer language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare src jsonb; cur_pub integer; cur_rev bigint; next_ver integer; a_email text;
begin
  select email into a_email from public.cimes_admins where id = p_admin and disabled_at is null;
  if a_email is null then raise exception 'admin_invalide' using errcode = 'P0001'; end if;
  select version into cur_pub from public.cimes_published_content where id = true for update;
  select draft_revision into cur_rev from public.cimes_content_drafts where id = true for update;
  cur_pub := coalesce(cur_pub,0); cur_rev := coalesce(cur_rev,0);
  if p_expected_version <> cur_pub then raise exception 'published_conflict' using errcode = 'P0001'; end if;
  if p_expected_rev <> cur_rev then raise exception 'draft_conflict' using errcode = 'P0001'; end if;
  select content into src from public.cimes_content_versions where id = p_version_id;
  if src is null then raise exception 'version_introuvable' using errcode = 'P0001'; end if;
  perform public.cimes_assert_publishable(src);
  next_ver := cur_pub + 1;
  insert into public.cimes_published_content(id,version,content,author_id,published_at)
    values(true,next_ver,src,p_admin,now())
    on conflict(id) do update set version=next_ver, content=src, author_id=p_admin, published_at=now();
  insert into public.cimes_content_versions(version,action,content,author_id) values(next_ver,'restore',src,p_admin);
  update public.cimes_content_drafts set content=src, base_version=next_ver, draft_revision=cur_rev+1, author_id=p_admin, updated_at=now() where id=true;
  insert into public.cimes_audit_log(action,admin_id,admin_email,version) values('restore',p_admin,a_email,next_ver);
  return next_ver;
end $$;
revoke all on function public.cimes_restore(uuid, integer, bigint, bigint) from public;
grant execute on function public.cimes_restore(uuid, integer, bigint, bigint) to cimes_app;

-- Seed : ne publie que si le contenu est réellement publiable (le booléen ne suffit pas).
create or replace function public.cimes_seed(p_content jsonb, p_publishable boolean)
returns text language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare pubv integer; has_draft boolean; really boolean := false;
begin
  perform pg_advisory_xact_lock(hashtext('cimes_seed_singleton'));
  select version into pubv from public.cimes_published_content where id=true;
  if pubv is not null then return 'already_initialized'; end if;
  select exists(select 1 from public.cimes_content_drafts where id=true) into has_draft;
  if has_draft then return 'already_initialized'; end if;
  if p_publishable then
    begin perform public.cimes_assert_publishable(p_content); really := true;
    exception when others then if sqlstate = 'P0001' then really := false; else raise; end if; end;
  end if;
  if really then
    insert into public.cimes_published_content(id,version,content) values(true,1,p_content);
    insert into public.cimes_content_drafts(id,content,base_version,draft_revision) values(true,p_content,1,1);
    insert into public.cimes_content_versions(version,action,content) values(1,'seed',p_content);
    return 'published';
  else
    insert into public.cimes_content_drafts(id,content,base_version,draft_revision) values(true,p_content,0,1);
    return 'draft_only';
  end if;
end $$;
revoke all on function public.cimes_seed(jsonb, boolean) from public;
revoke execute on function public.cimes_seed(jsonb, boolean) from cimes_app;
-- Aucun GRANT : le seed est exécuté par le PROPRIÉTAIRE via DATABASE_ADMIN_URL.

-- Écriture d'audit contrôlée (évite d'accorder un droit de séquence général à cimes_app).
create or replace function public.cimes_log_audit(p_action text, p_admin uuid, p_email text)
returns void language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin insert into public.cimes_audit_log(action, admin_id, admin_email) values(p_action, p_admin, p_email); end $$;
revoke all on function public.cimes_log_audit(text, uuid, text) from public;
grant execute on function public.cimes_log_audit(text, uuid, text) to cimes_app;
