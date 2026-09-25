# Railway deployment

This repository deploys as three Railway services:

| Service    | Source root              | Build / start                                                            |
| ---------- | ------------------------ | ------------------------------------------------------------------------ |
| `api`      | `/backend`               | build: `pnpm typecheck`; start: `pnpm start`; pre-deploy: `pnpm migrate` |
| `web`      | `/frontend`              | uses the included Dockerfile (builds Vite and serves it with Caddy)      |
| `Postgres` | Railway Postgres service | no source repository                                                     |

## Set up

1. Create an empty Railway project and add a Postgres service.
2. Add two GitHub services from this repository. Set their root directories to `/backend` and `/frontend`, then name them `api` and `web`.
3. For `api`, set a public domain, healthcheck path to `/health`, and these variables:

    ```text
    DATABASE_URL=${{Postgres.DATABASE_URL}}
    JWT_SECRET=<a-long-random-secret>
    CORS_ORIGIN=https://${{web.RAILWAY_PUBLIC_DOMAIN}}
    ```

4. For `web`, set a public domain and add:

    ```text
    VITE_API_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}
    ```

    `VITE_API_URL` is compiled into the browser bundle, so redeploy `web` whenever it changes.

5. Deploy. The API migration runs before each API release; if it fails, the release does not go live.

`PORT` is supplied by Railway. Do not set it manually. `CORS_ORIGIN` should be the exact web origin (no trailing slash).

## Local development

Use `./utils/dev.sh`. It continues to load `backend/.env` and `frontend/.env`; production uses Railway variables instead.
