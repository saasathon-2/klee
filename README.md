# Klee

Klee turns a prompt, a pull request, or pasted context into an artefact: a shareable page built from blocks such as code diffs, git graphs, flowcharts, check lists, and timelines. Artefacts are private until shared, can be edited by hand or revised with a follow-up prompt, and keep a version history and comments.

The GitHub, Slack, and Jira apps live in [saasathon-2/integrations](https://github.com/saasathon-2/integrations).

## Structure

| Path | What's there |
| --- | --- |
| `backend/` | Express API, Postgres access, the artefact agent (`src/artefact-agent.ts` and its instructions in `src/artefact-agent-instructions.md`), and migrations in `src/migrations` |
| `frontend/` | React and Vite app using HeroUI. Blocks live in `src/artefacts/templates/blocks` and are registered in `src/artefacts/templates/catalogue.ts` |
| `utils/dev.sh` | Starts the local stack |
| `design_inspiration/` | Visual references |

## How an artefact is made

1. The API sends the prompt, the block schemas, and the agent instructions to the model with structured output.
2. The model returns a title, a category page, and a list of blocks with their data. It never returns HTML.
3. The API validates and repairs the result (`toDocument`), then stores it as a tree of nodes.
4. The frontend renders each node with the component named by its `template`.

Revisions, manual edits, and GitHub refreshes each save a new version as a JSON patch.

### Adding a block

1. Add the component in `frontend/src/artefacts/templates/blocks`, with its `template`, `info`, and `children` statics, and register it in `catalogue.ts` and the `ArtefactNode` template union in `model.ts`.
2. Allow it on `developer-page` or `generic-page` in `categories/CategoryPage.tsx`.
3. Add its schema to `blockSchemas` and the allowed sets in `backend/src/artefact-agent.ts`.
4. Describe when to use it in `backend/src/artefact-agent-instructions.md`.

## Development

Run `./utils/dev.sh`. It installs dependencies, starts Postgres with Docker Compose, applies migrations, and runs the API on port 3000 and the web app on 5173.

```sh
pnpm --dir backend test        # backend tests
pnpm --dir backend typecheck   # backend types (also the API build)
pnpm --dir frontend lint       # frontend lint
pnpm --dir frontend build      # frontend types and build
MIGRATIONS_BASE_REF=origin/main pnpm --dir backend migrations:check
```

Create a migration with `pnpm --dir backend migrate:create -- <name>`. Never edit, rename, or delete a migration already on `main`.

## Deployment

This repository deploys as three Railway services:

| Service    | Source root              | Build / start                                                            |
| ---------- | ------------------------ | ------------------------------------------------------------------------ |
| `api`      | `/backend`               | Dockerfile; pre-deploy: `pnpm migrate` |
| `web`      | `/frontend`              | uses the included Dockerfile (builds Vite and serves it with Caddy)      |
| `Postgres` | Railway Postgres service | no source repository                                                     |

### Set up

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
    VITE_GOOGLE_PICKER_API_KEY=<restricted-google-picker-api-key>
    VITE_GOOGLE_CLOUD_PROJECT_NUMBER=<google-cloud-project-number>
    ```

    `VITE_API_URL` is compiled into the browser bundle, so redeploy `web` whenever it changes.

5. Deploy. The API migration runs before each API release; if it fails, the release does not go live.

`PORT` is supplied by Railway. Do not set it manually. `CORS_ORIGIN` should be the exact web origin (no trailing slash). The API Dockerfile installs the Chromium runtime libraries needed for artefact screenshots.

### Google Docs and Sheets context

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the API service. The Google OAuth client's callback URL is `https://<api-domain>/api/auth/callback/google` (local: `http://localhost:3000/api/auth/callback/google`). Enable the Google Docs API, Google Sheets API, Drive API, and Google Picker API in the same Google Cloud project as the OAuth client. Restrict the Picker API key to the web origins (including `https://docs.google.com/*`) and the Picker/Drive APIs. Users connect their existing Google account with the `drive.file` scope, then select up to five Docs or Sheets for one artefact request. Klee fetches those files only while generating that artefact and does not persist the selection or document text; the resulting rationale links to its source. Google consent-screen verification may be required before general release.

### Migrations

Create migrations with `pnpm --dir backend migrate:create -- <name>`. Migration files already present on `main` are immutable: never rename, edit, or delete them; add a new migration instead. Pull requests run a guard that enforces timestamp-style unique prefixes and rejects changes to existing migrations. Run it locally with `MIGRATIONS_BASE_REF=origin/main pnpm --dir backend migrations:check`.

### GitHub App

Set the GitHub App's setup URL and webhook URL to `https://<api-domain>/api/integrations/github/setup` and `https://<api-domain>/api/integrations/github/webhook`. The API service needs `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, and `GITHUB_WEBHOOK_SECRET` as Railway variables. A signed-in user connects GitHub from their profile; the API stores the resulting installation and verifies every webhook before processing it.

#### GitHub login and project access

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
    # List every test, lint, and build job from this workflow here.
    needs: [test, lint]
    if: always()
    uses: saasathon-2/integrations/.github/workflows/klee.yml@main
    with:
      api-url: https://<api-domain>
      pull-request: ${{ github.event.pull_request.number }}
```

`api-url` must exactly match `BETTER_AUTH_URL` (without a trailing slash), which is how the API verifies the Action's OIDC audience. The GitHub App needs `Issues: Read and write` permission to post the pull request comment.

### Local environment files

Use `./utils/dev.sh`. Local settings are split into two files per app; production uses Railway variables and never reads them.

| File                  | Holds                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `backend/.env`        | Shared secrets: auth secret, Google and OpenAI keys                                                                                                                            |
| `backend/.env.local`  | Local only: port, local database, `localhost` URLs, and a local GitHub OAuth app (callback `http://localhost:3000/api/auth/callback/github`). Loaded after `.env`, so it wins. |
| `frontend/.env.local` | Local only: API URL and Google Picker key/project number                                                                                                                      |

`dev.sh` creates any missing file from its `.example` template. Both `.env.local` files are git-ignored.
