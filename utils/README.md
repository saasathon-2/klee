# utils

## dev.sh

One command to get the whole stack running locally.

```bash
./utils/dev.sh
```

What it does, in order:
1. Checks `pnpm` and `docker` are installed.
2. Starts Postgres via `docker compose up -d` (port `5433`, data persisted in a named volume).
3. Waits for Postgres to be ready.
4. Installs backend deps, creates `backend/.env` from `.env.example` if missing, runs migrations.
5. Installs frontend deps, creates `frontend/.env` from `.env.example` if missing.
6. Starts the backend (`localhost:3000`) and frontend (`localhost:5173`) dev servers.

Press `Ctrl+C` to stop both dev servers (the db container keeps running — stop it separately with `docker compose down`).

Safe to re-run any time; it won't overwrite an existing `.env` and `pnpm install` / migrations are idempotent.

### Requirements
- [pnpm](https://pnpm.io/installation)
- [Docker](https://docs.docker.com/get-docker/) with Compose v2 (`docker compose`, not `docker-compose`)
