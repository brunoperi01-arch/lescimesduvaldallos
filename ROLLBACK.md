# Rollback

## Contenu (via l'admin, une fois la bascule Neon faite)
Historique → Restaurer une version antérieure (publication atomique).

## Configuration / bascule
- Le frontend et le CMS utilisent Neon via `/api` ; il n'existe aucun repli Supabase.
- En production sans Neon configuré, la page affiche « indisponible » au lieu de publier silencieusement `content.json`.
- Revenir au dernier commit Git validé et à la branche Neon correspondante.

## Base de données
- Neon : utiliser une branche dédiée ; en cas de problème, repointer `DATABASE_URL` vers la branche précédente puis redéployer. Ne supprimer aucune branche avant validation.
- Les migrations sont additives ; le ledger `cimes_schema_migrations` permet de connaître l'état (`npm run db:status`).

## Secrets
Rotation : régénérer `SESSION_SECRET` (invalide les sessions) et les identifiants Neon ; mettre à jour les variables Vercel puis redéployer.
