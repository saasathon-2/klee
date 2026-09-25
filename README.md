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
    BETTER_AUTH_SECRET=<a-long-random-secret>
    CORS_ORIGIN=https://${{web.RAILWAY_PUBLIC_DOMAIN}}
    OPENAI_API_KEY=<OpenAI-Platform-application-key>
    ```

   `OPENAI_MODEL` is optional; it defaults to `gpt-6-luna`.
   Set `OPENAI_SERVICE_TIER=fast` to use Fast mode for user-initiated artefacts. It is billed at a premium; GitHub Action artefacts remain on standard processing.

4. For `web`, set a public domain and add:

    ```text
    VITE_API_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}
    ```

    `VITE_API_URL` is compiled into the browser bundle, so redeploy `web` whenever it changes.

5. Deploy. The API migration runs before each API release; if it fails, the release does not go live.

`PORT` is supplied by Railway. Do not set it manually. `CORS_ORIGIN` should be the exact web origin (no trailing slash).

## Migrations

Create migrations with `pnpm --dir backend migrate:create -- <name>`. Migration files already present on `main` are immutable: never rename, edit, or delete them; add a new migration instead. Pull requests run a guard that enforces timestamp-style unique prefixes and rejects changes to existing migrations. Run it locally with `MIGRATIONS_BASE_REF=origin/main pnpm --dir backend migrations:check`.

## GitHub App

Set the GitHub App's setup URL and webhook URL to `https://<api-domain>/api/integrations/github/setup` and `https://<api-domain>/api/integrations/github/webhook`. The API service needs `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, and `GITHUB_WEBHOOK_SECRET` as Railway variables. A signed-in user connects GitHub from their profile; the API stores the resulting installation and verifies every webhook before processing it.

### GitHub login and project access

Artefacts that belong to a GitHub org (a "project") can be viewed and edited by every member of that org. Pull request artefacts join their installation's org automatically, and an owner can move any artefact into one of their orgs from the artefact header. Membership comes from each user's GitHub login, so the API also needs a GitHub OAuth app (separate from the GitHub App):

```text
GITHUB_CLIENT_ID=<oauth-app-client-id>
GITHUB_CLIENT_SECRET=<oauth-app-client-secret>
```

Set the OAuth app's callback URL to `https://<api-domain>/api/auth/callback/github`. Users can sign in with GitHub or link it from their profile; Klee asks for `read:org` so private org membership counts. Without these variables the app still runs, and artefacts stay owner-only.

To create an artefact and comment its link on every pull request, add this to a repository where the App is installed:

```yaml
on: pull_request

permissions:
  id-token: write

jobs:
  klee:
    runs-on: ubuntu-latest
    steps:
      - uses: saasathon-2/integrations/github@main
        with:
          api-url: https://<api-domain>
          pull-request: ${{ github.event.pull_request.number }}
```

`api-url` must exactly match `BETTER_AUTH_URL` (without a trailing slash), which is how the API verifies the Action's OIDC audience. The GitHub App needs `Issues: Read and write` permission to post the pull request comment.

## Local development

Use `./utils/dev.sh`. Local settings are split into two files per app; production uses Railway variables and never reads them.

| File | Holds |
| --- | --- |
| `backend/.env` | Shared secrets: auth secret, Google and OpenAI keys |
| `backend/.env.local` | Local only: port, local database, `localhost` URLs, and a local GitHub OAuth app (callback `http://localhost:3000/api/auth/callback/github`). Loaded after `.env`, so it wins. |
| `frontend/.env.local` | Local only: `VITE_API_URL`, which the Vite dev server also uses as its `/api` proxy target |

`dev.sh` creates any missing file from its `.example` template. Both `.env.local` files are git-ignored.
