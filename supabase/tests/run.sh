#!/usr/bin/env bash
# Rejoue toutes les migrations sur un Postgres vide puis vérifie le cloisonnement entre entreprises.
# Usage : DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")"
: "${DATABASE_URL:?DATABASE_URL manquant}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f stub-supabase.sql
for f in $(ls ../migrations/*.sql | sort); do
  echo "migration $(basename "$f")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null
done
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f isolation.sql
