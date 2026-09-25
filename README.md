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

## GitHub App

Set the GitHub App's setup URL and webhook URL to `https://<api-domain>/api/integrations/github/setup` and `https://<api-domain>/api/integrations/github/webhook`. The API service needs `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, and `GITHUB_WEBHOOK_SECRET` as Railway variables. A signed-in user connects GitHub from their profile; the API stores the resulting installation and verifies every webhook before processing it.

To create an artefact and comment its link on every pull request, add this to a repository where the App is installed:

```yaml
on: pull_request

permissions:
  id-token: write

jobs:
  orcastrate:
    runs-on: ubuntu-latest
    steps:
      - uses: saasathon-2/integrations/github@main
        with:
          api-url: https://<api-domain>
          pull-request: ${{ github.event.pull_request.number }}
```

`api-url` must exactly match `BETTER_AUTH_URL` (without a trailing slash), which is how the API verifies the Action's OIDC audience. The GitHub App needs `Issues: Read and write` permission to post the pull request comment.

## Local development

Use `./utils/dev.sh`. It continues to load `backend/.env` and `frontend/.env`; production uses Railway variables instead.
