# Promotion Preview → Production

1. **GitHub** : pousser la candidate sur `v8-neon-test`. Protéger `main` en exigeant les jobs `code-validation` et `neon-validation`.
2. **Neon test** : renseigner les secrets de l'environnement GitHub `neon-test` : `TEST_DATABASE_ADMIN_URL`, `TEST_DATABASE_URL`, `TEST_DATABASE_MARKER`. Le job doit échouer si l'un manque.
3. **Preview Vercel** : déployer la branche avec l'URL du rôle runtime restreint. Variables Preview : `DATABASE_URL`, `DATABASE_RUNTIME_ROLE`, `SESSION_SECRET`, `ALLOWED_ORIGINS`, `PUBLIC_SITE_URL`, `BOOKING_URL`, `ADMIN_USER`, `ADMIN_PASS`. Le site reste `noindex` tant que le médiateur/mentions sont incomplets.
4. **Contrôles manuels** : site public, connexion `/admin`, brouillon, publication bloquée sans médiateur, historique et restauration.
5. **Production** : lever les blocages métier, préparer la branche Neon production avec `DEPLOY_ENV=production scripts/prepare-neon.sh`, puis promouvoir exactement le commit validé. Jamais d'URL admin dans Vercel.
6. **Rollback** : suivre `ROLLBACK.md` ; ne jamais supprimer une base ni modifier une migration déjà appliquée.
