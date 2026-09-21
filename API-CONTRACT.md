# Contrat API — Les Cimes (Neon)

Toutes les réponses sont JSON. Mutations : cookie de session + en-tête `x-csrf-token` (lié à la session) + `Origin` autorisée. `Cache-Control: no-store` sur auth/admin.

## Public
### GET /api/content/published
- Auth : non. Méthode : GET (405 + `Allow: GET` sinon).
- 200 : contenu publié (validé Zod) + `ETag`, cache public. `If-None-Match` → 304.
- 503 : `{ "error": "non_initialise" }`. 500 : `{ "error": "erreur_serveur" }` (aucune stack).

## Auth
### POST /api/auth/login  → `{ email, password }` → 200 `{ csrf }` (cookie `__Host-cimes_session`). 401 générique. 429 + `Retry-After`.
### POST /api/auth/logout → session + CSRF + Origin → 200. Révoque la session, efface le cookie.
### GET  /api/auth/session → 200 `{ email, csrf }` si session active, sinon 401.

## Administration du contenu (session admin obligatoire)
### GET /api/admin/content/draft
- 200 : `{ "content": {}, "publishedVersion": 1, "draftRevision": 2, "updatedAt": "ISO" }`.
### PUT /api/admin/content/draft
- Body : `{ "content": {}, "expectedVersion": <draftRevision attendu> }`.
- 200 : `{ "draftRevision": <nouveau> }`. 400 Zod. 409 conflit. 413 corps trop grand.
### POST /api/admin/content/publish
- Body : `{ "expectedVersion": <publishedVersion attendu> }`.
- Publie le **brouillon stocké** (jamais le JSON du navigateur). 200 `{ "version" }`.
- 422 `{ "error": "publication_bloquee", "blockers": [...] }` (médiateur, placeholders, liens #, alt, contenus non confirmés…). 409 conflit.
### GET /api/admin/content/versions?limit=20&cursor=…
- 200 : `{ "items": [ { id, version, action, createdAt, authorEmail } ], "nextCursor": null }` (borné, max 50).
### POST /api/admin/content/restore
- Body : `{ "versionId": "…", "expectedVersion": <publishedVersion attendu> }`.
- Valide + garde-fous avant restauration. 200 `{ "version" }`. 422 si non publiable. 409 conflit.

## Codes d'erreur communs
401 non authentifié · 403 Origin/CSRF · 405 méthode (+`Allow`) · 409 conflit de version · 413 corps trop grand · 422 blocages métier · 429 rate-limit · 503 indisponible.
