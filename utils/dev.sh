#!/usr/bin/env bash
# Installs deps, starts the dockerized db, runs migrations, and boots both dev servers.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v pnpm >/dev/null || { echo "pnpm is required: https://pnpm.io/installation"; exit 1; }
command -v docker >/dev/null || { echo "docker is required: https://docs.docker.com/get-docker/"; exit 1; }

echo "==> Starting postgres (docker compose)"
docker compose up -d

echo "==> Waiting for postgres to accept connections"
until docker compose exec -T db pg_isready -U website >/dev/null 2>&1; do
  sleep 1
done

echo "==> Installing backend dependencies"
(cd backend && pnpm install)
create_env() { [ -f "$2" ] || { cp "$1" "$2"; echo "==> Created $2 (fill in any blank values)"; }; }
create_env backend/.env.example backend/.env
create_env backend/.env.local.example backend/.env.local

echo "==> Running database migrations"
(cd backend && pnpm run migrate)

echo "==> Installing frontend dependencies"
(cd frontend && pnpm install)
create_env frontend/.env.local.example frontend/.env.local

cleanup() {
  echo
  echo "==> Stopping dev servers"
  kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "==> Starting backend (http://localhost:3000)"
(cd backend && pnpm dev) &
backend_pid=$!

echo "==> Starting frontend (http://localhost:5173)"
(cd frontend && pnpm dev) &
frontend_pid=$!

wait "$backend_pid" "$frontend_pid"
