#!/bin/sh
set -e

echo "[entrypoint] Application des migrations Prisma (avec attente de la base de données)..."
attempt=0
max_attempts=30
until npx prisma migrate deploy; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "[entrypoint] Échec: base de données injoignable après $max_attempts tentatives."
    exit 1
  fi
  echo "[entrypoint] Base de données pas encore prête (tentative $attempt/$max_attempts), nouvel essai dans 2s..."
  sleep 2
done
echo "[entrypoint] Migrations appliquées."

if [ "$RUN_SEED_ON_START" = "true" ]; then
  echo "[entrypoint] Exécution du seed..."
  node prisma/seed.js || echo "[entrypoint] Seed déjà appliqué ou en erreur, on continue."
fi

echo "[entrypoint] Démarrage: $*"
exec "$@"
