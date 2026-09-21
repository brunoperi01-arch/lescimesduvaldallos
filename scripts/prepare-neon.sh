#!/usr/bin/env bash
# Séquence opérateur guidée (non destructive). Arrêt à la première erreur.
# N'affiche jamais les secrets. Confirmation avant toute action de PRODUCTION.
set -euo pipefail
say() { printf '\n=== %s ===\n' "$1"; }
need() { [ -n "${!1:-}" ] || { echo "Variable manquante: $1"; exit 1; }; }

say "1/7 Validation locale et environnement (aucun secret affiché)"
need DATABASE_ADMIN_URL
need DATABASE_URL
need DATABASE_RUNTIME_ROLE
npm run validate:release

say "2/7 État actuel des migrations"
npm run db:status

say "3/7 Confirmation"
if [ "${DEPLOY_ENV:-preview}" = "production" ]; then
  read -r -p "Taper PRODUCTION pour appliquer 0001 -> 0006 : " ok
  [ "$ok" = "PRODUCTION" ] || { echo "Abandon."; exit 0; }
else
  read -r -p "Confirmer l'application sur la base Preview ? [oui/non] " ok
  [ "$ok" = "oui" ] || { echo "Abandon."; exit 0; }
fi
npm run db:migrate

say "4/7 Association et contrôle du rôle runtime"
npm run runtime:grant
npm run runtime:check

say "5/7 Création/actualisation de l'administrateur"
need ADMIN_EMAIL
need ADMIN_PASSWORD
npm run admin:create

say "6/7 Seed idempotent — draft_only tant que le médiateur manque"
npm run seed:neon

say "7/7 État final"
npm run db:status
echo "Préparation Neon terminée."
