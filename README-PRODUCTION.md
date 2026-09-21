# Production — Les Cimes du Val d'Allos (Neon + Vercel)

## État réel
- **Frontend et CMS basculés sur `/api`.**
- **Supabase supprimé** (aucune occurrence applicative).
- **Code non encore validé sur Neon** (aucune exécution PostgreSQL réalisée).
- **Migrations `0001→0006` à valider sur Neon avant toute production.**
- **Upload média désactivé** (assets existants conservés).

## Migrations (checksums)
- 0001 `6f87a17a793fb91c483327a606d04df24011b4cedace76809ba567b82711896e`
- 0002 `358e6def890d6500d1708810beeee1f6a911910b1e4d51b8d3fbb60d0eba1d11`
- 0003 `df0c9d2d075cc317215b21a6c45a8359bba9444fe747e39a4a244e80eadc7658`
- 0004 `9f0fbb0f15f463c1dbce1cedd8ad8081e68e661f70a9f76c957f230b6c5d5444`
- 0005 `c3a63efe6f991f9817ca3f90490fc6aa63684711e81b2d05a2dd0d0ad0513778`
- 0006 `90faa222e48e20eb02251e76b49e3d09a0141f0965e4a03f660474e52ec0ccbe`

## Déploiement (branche Neon de test)
1. Créer une branche Neon de test et deux utilisateurs : propriétaire/admin et utilisateur `LOGIN` runtime non privilégié.
2. Utiliser l'URL admin comme `TEST_DATABASE_ADMIN_URL` et l'URL runtime comme `TEST_DATABASE_URL`. Elles doivent viser exactement la même base avec des utilisateurs différents.
3. Définir `TEST_DATABASE_MARKER=hostname:port/database` et `ALLOW_DB_TESTS=1`, puis lancer `npm run validate:neon`.
4. Pour Preview, définir localement `DATABASE_ADMIN_URL`, `DATABASE_URL` et `DATABASE_RUNTIME_ROLE`, puis lancer `scripts/prepare-neon.sh`.
5. Configurer dans Vercel uniquement les variables runtime : `DATABASE_URL`, `DATABASE_RUNTIME_ROLE`, `SESSION_SECRET`, `ALLOWED_ORIGINS`, `PUBLIC_SITE_URL`, `BOOKING_URL`, `ADMIN_USER`, `ADMIN_PASS`.
6. Ne jamais placer `DATABASE_ADMIN_URL` dans les fonctions Vercel.
7. Déployer la Preview en `noindex`, vérifier le site et `/admin`, puis promouvoir le même commit après CI verte.

`cimes_app` est volontairement `NOLOGIN` : il porte les permissions. L'utilisateur contenu dans `DATABASE_URL` doit être un rôle Neon `LOGIN`, non propriétaire et membre de `cimes_app` via `npm run runtime:grant`.

## Rollback
Voir `ROLLBACK.md`. Le CMS ne peut plus retomber sur Supabase ; en dev, fallback fichier possible uniquement via `VITE_ALLOW_LOCAL_CONTENT_FALLBACK=true`.
