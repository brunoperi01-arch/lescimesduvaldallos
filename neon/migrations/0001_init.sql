-- =====================================================================
-- Neon PostgreSQL — Schéma CMS Les Cimes (idempotent, VALIDE).
-- Appliqué avec DATABASE_ADMIN_URL. Runtime = rôle cimes_app restreint.
-- NON EXÉCUTÉ ici (aucun Neon réel) — vérification statique uniquement.
-- =====================================================================
create extension if not exists pgcrypto;
revoke create on schema public from public;

create table if not exists cimes_admins (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique check (email = lower(email)),
  password_hash text not null,
  created_at    timestamptz not null default now(),
  disabled_at   timestamptz
);

create table if not exists cimes_sessions (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid not null references cimes_admins(id) on delete cascade,
  token_hash   text not null unique,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  revoked_at   timestamptz,
  check (expires_at > created_at)
);
create index if not exists cimes_sessions_admin_idx on cimes_sessions(admin_id);
create index if not exists cimes_sessions_expires_idx on cimes_sessions(expires_at);

create table if not exists cimes_login_attempts (
  id       bigint generated always as identity primary key,
  email    text,
  ip_hash  text,                       -- HMAC de l'IP, jamais l'IP brute
  at       timestamptz not null default now(),
  success  boolean not null default false
);
create index if not exists cimes_login_ip_idx on cimes_login_attempts(ip_hash, at);
create index if not exists cimes_login_email_idx on cimes_login_attempts(email, at);

create table if not exists cimes_published_content (
  id            boolean primary key default true check (id),
  version       integer not null check (version > 0),
  content       jsonb   not null,
  author_id     uuid references cimes_admins(id),
  published_at  timestamptz not null default now()
);

create table if not exists cimes_content_drafts (
  id             boolean primary key default true check (id),
  content        jsonb   not null,
  base_version   integer not null default 0 check (base_version >= 0),
  draft_revision bigint  not null default 1 check (draft_revision > 0),
  author_id      uuid references cimes_admins(id),
  updated_at     timestamptz not null default now()
);

create table if not exists cimes_content_versions (
  id          bigint generated always as identity primary key,
  version     integer not null check (version > 0),
  action      text    not null check (action in ('seed','publish','archive','restore')),
  content     jsonb   not null,
  author_id   uuid references cimes_admins(id),
  created_at  timestamptz not null default now()
);
create index if not exists cimes_versions_version_idx on cimes_content_versions(version desc);
-- Immuabilité : interdit UPDATE/DELETE sur l'historique.
create or replace function cimes_versions_immutable() returns trigger language plpgsql as $$
begin raise exception 'cimes_content_versions est immuable'; end $$;
drop trigger if exists cimes_versions_no_change on cimes_content_versions;
create trigger cimes_versions_no_change before update or delete on cimes_content_versions
  for each row execute function cimes_versions_immutable();

create table if not exists cimes_media (
  id          uuid primary key default gen_random_uuid(),
  blob_url    text not null unique,
  blob_key    text not null unique,
  alt         text,
  mime        text not null check (mime in ('image/jpeg','image/png','image/webp','image/avif')),
  bytes       integer check (bytes is null or bytes >= 0),
  width       integer check (width  is null or width  > 0),
  height      integer check (height is null or height > 0),
  status      text not null default 'ready' check (status in ('ready','deleting')),
  author_id   uuid references cimes_admins(id),
  created_at  timestamptz not null default now()
);

-- Références média (clé primaire simple + index unique avec expression)
create table if not exists cimes_content_media_refs (
  id          bigint generated always as identity primary key,
  media_id    uuid not null references cimes_media(id) on delete restrict,
  scope       text not null check (scope in ('draft','published','version')),
  version_id  bigint references cimes_content_versions(id) on delete cascade,
  created_at  timestamptz not null default now(),
  check ((scope = 'version' and version_id is not null)
      or (scope in ('draft','published') and version_id is null))
);
create unique index if not exists cimes_media_refs_unique_idx
  on cimes_content_media_refs (media_id, scope, coalesce(version_id, -1));
create index if not exists cimes_media_refs_media_idx on cimes_content_media_refs(media_id);

create table if not exists cimes_audit_log (
  id           bigint generated always as identity primary key,
  action       text not null check (action in
                 ('login_ok','login_fail','logout','save_draft','publish','restore','seed','media_upload','media_delete')),
  admin_id     uuid references cimes_admins(id),
  admin_email  text,
  version      integer,
  details      jsonb,
  created_at   timestamptz not null default now()
);

-- ---- Publication atomique (SECURITY DEFINER : écrit publié/versions/audit) ----
create or replace function cimes_publish(p_admin uuid, p_expected_version integer, p_expected_rev bigint)
returns integer language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare cur_pub integer; cur_rev bigint; draft jsonb; cur_pub_content jsonb; next_ver integer; a_email text;
begin
  select email into a_email from public.cimes_admins where id = p_admin and disabled_at is null;
  if a_email is null then raise exception 'admin_invalide'; end if;
  if p_expected_version is null or p_expected_rev is null then raise exception 'versions_attendues_requises'; end if;
  select version, content into cur_pub, cur_pub_content from public.cimes_published_content where id=true for update;
  select draft_revision, content into cur_rev, draft from public.cimes_content_drafts where id=true for update;
  cur_pub := coalesce(cur_pub,0); cur_rev := coalesce(cur_rev,0);
  if draft is null then raise exception 'aucun_brouillon'; end if;
  if p_expected_version <> cur_pub then raise exception 'published_conflict'; end if;
  if p_expected_rev <> cur_rev then raise exception 'draft_conflict'; end if;
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

create or replace function cimes_restore(p_admin uuid, p_expected_version integer, p_expected_rev bigint, p_version_id bigint)
returns integer language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare src jsonb; cur_pub integer; cur_rev bigint; next_ver integer; a_email text;
begin
  select email into a_email from public.cimes_admins where id = p_admin and disabled_at is null;
  if a_email is null then raise exception 'admin_invalide'; end if;
  if p_expected_version is null or p_expected_rev is null or p_version_id is null then raise exception 'parametres_attendus_requis'; end if;
  select version into cur_pub from public.cimes_published_content where id=true for update;
  select draft_revision into cur_rev from public.cimes_content_drafts where id=true for update;
  cur_pub := coalesce(cur_pub,0); cur_rev := coalesce(cur_rev,0);
  if p_expected_version <> cur_pub then raise exception 'published_conflict'; end if;
  if p_expected_rev <> cur_rev then raise exception 'draft_conflict'; end if;
  select content into src from public.cimes_content_versions where id = p_version_id;
  if src is null then raise exception 'version_introuvable'; end if;
  next_ver := cur_pub + 1;
  insert into public.cimes_published_content(id,version,content,author_id,published_at)
    values(true,next_ver,src,p_admin,now())
    on conflict(id) do update set version=next_ver, content=src, author_id=p_admin, published_at=now();
  insert into public.cimes_content_versions(version,action,content,author_id) values(next_ver,'restore',src,p_admin);
  update public.cimes_content_drafts set content=src, base_version=next_ver, draft_revision=cur_rev+1, author_id=p_admin, updated_at=now() where id=true;
  insert into public.cimes_audit_log(action,admin_id,admin_email,version) values('restore',p_admin,a_email,next_ver);
  return next_ver;
end $$;

-- Seed idempotent + concurrent-sûr (verrou advisory). Publie seulement si publiable
-- (la publiabilité métier est vérifiée par le SERVEUR avant l'appel ; ici, garde-fou minimal).
create or replace function cimes_seed(p_content jsonb, p_publishable boolean)
returns text language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare pubv integer; has_draft boolean;
begin
  perform pg_advisory_xact_lock(hashtext('cimes_seed_singleton'));
  select version into pubv from public.cimes_published_content where id=true;
  if pubv is not null then return 'already_initialized'; end if;
  select exists(select 1 from public.cimes_content_drafts where id=true) into has_draft;
  if has_draft then return 'already_initialized'; end if;
  if p_publishable then
    insert into public.cimes_published_content(id,version,content) values(true,1,p_content);
    insert into public.cimes_content_drafts(id,content,base_version,draft_revision) values(true,p_content,1,1);
    insert into public.cimes_content_versions(version,action,content) values(1,'seed',p_content);
    return 'published';
  else
    insert into public.cimes_content_drafts(id,content,base_version,draft_revision) values(true,p_content,0,1);
    return 'draft_only';
  end if;
end $$;

-- ---- Rôle runtime restreint ----
do $$ begin
  if not exists (select 1 from pg_roles where rolname='cimes_app') then create role cimes_app nologin; end if;
end $$;
-- lectures
grant select on cimes_published_content, cimes_content_versions, cimes_media, cimes_content_media_refs to cimes_app;
grant select on cimes_admins to cimes_app;                    -- lecture pour login
-- écritures autorisées (append/maj limitées)
grant select, insert, update, delete on cimes_sessions to cimes_app;
grant select, insert on cimes_login_attempts to cimes_app;
grant select, insert, update on cimes_content_drafts to cimes_app;
grant select, insert, update on cimes_media to cimes_app;     -- statut deleting ; suppression via API après Blob
grant select, insert, delete on cimes_content_media_refs to cimes_app;
grant insert, select on cimes_audit_log to cimes_app;         -- append-only
-- INTERDIT au runtime : écrire directement publié/versions/audit-maj/admins-maj
--   (assuré par l'absence de grant + trigger d'immuabilité des versions)
-- opérations sensibles via fonctions definer :
revoke all on function cimes_publish(uuid,integer,bigint) from public;
revoke all on function cimes_restore(uuid,integer,bigint,bigint) from public;
revoke all on function cimes_seed(jsonb,boolean) from public;
grant execute on function cimes_publish(uuid,integer,bigint) to cimes_app;
grant execute on function cimes_restore(uuid,integer,bigint,bigint) to cimes_app;
-- Associer l'utilisateur Neon runtime au rôle : GRANT cimes_app TO <utilisateur_runtime>;
