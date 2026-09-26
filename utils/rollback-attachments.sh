#!/usr/bin/env bash
# Rolls back the electrical branch's attachments migration on the local
# database, so branches without it (such as main) can migrate again. Drops the
# artefact_attachment table and its uploads, then re-runs migrations.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v docker >/dev/null || { echo "docker is required: https://docs.docker.com/get-docker/"; exit 1; }

psql() { docker compose exec -T db psql -U website -d website -v ON_ERROR_STOP=1 "$@"; }

# The migration was renamed when it moved onto main's history; match either.
applied="$(psql -Atc "select name from pgmigrations where name in ('1790365000000_artefact_attachments', '1790530000000_artefact_attachments')")"
if [ -z "$applied" ]; then
  echo "==> The attachments migration isn't applied; nothing to roll back"
  exit 0
fi

uploads="$(psql -Atc "select count(*) from artefact_attachment" 2>/dev/null || echo 0)"
echo "==> This drops artefact_attachment ($uploads uploaded PDFs) and removes: $applied"
read -r -p "Continue? [y/N] " answer
[[ "$answer" =~ ^[Yy]$ ]] || { echo "Cancelled"; exit 1; }

echo "==> Rolling back"
psql <<'SQL'
begin;
drop table if exists artefact_attachment;
delete from pgmigrations where name in ('1790365000000_artefact_attachments', '1790530000000_artefact_attachments');
commit;
SQL

echo "==> Running database migrations"
(cd backend && pnpm run migrate)
