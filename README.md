# Klee

Klee turns a prompt, pull request, or pasted context into a private, shareable artefact. Each artefact combines blocks such as code diffs, Git graphs, flowcharts, checklists, and timelines. You can edit an artefact, refine it with a follow-up prompt, review its version history, and comment on it.

The GitHub, Slack, and Jira integrations live in [saasathon-2/integrations](https://github.com/saasathon-2/integrations).

## Stack

| Directory | Purpose |
| --- | --- |
| `backend/` | Express API, Postgres access, migrations, and the artefact-generation agent |
| `frontend/` | React, Vite, Tailwind, and HeroUI application |
| `utils/dev.sh` | Local development launcher |
| `design_inspiration/` | Product design references |

## Run locally

Install [Node.js 22.6+](https://nodejs.org/), [pnpm](https://pnpm.io/installation), and [Docker](https://docs.docker.com/get-docker/). Then start the stack:

```sh
./utils/dev.sh
```

The script starts Postgres, installs dependencies, applies migrations, creates missing local environment files from their example files, and runs:

| Service | URL |
| --- | --- |
| API | http://localhost:3000 |
| Web app | http://localhost:5173 |

Add credentials to the generated environment files when you need the related features. Keep these files out of version control.

| File | Configuration |
| --- | --- |
| `backend/.env` | Authentication secret, OpenAI API key, and Google OAuth credentials |
| `backend/.env.local` | Local database and server settings, GitHub OAuth credentials, and R2 preview storage |
| `frontend/.env.local` | API URL and Google Picker credentials |

## Verify changes

```sh
pnpm --dir backend test
pnpm --dir backend typecheck
pnpm --dir frontend lint
pnpm --dir frontend build
MIGRATIONS_BASE_REF=origin/main pnpm --dir backend migrations:check
```

## Architecture

The API sends the prompt, block schemas, and generation instructions to the model through structured output. The model returns a title, category page, and block data. The API validates the result, stores it as a node tree, and the frontend renders each node through its named template. Klee stores prompt revisions, manual edits, and GitHub refreshes as JSON patches.

### Add a block

1. Create the component in `frontend/src/artefacts/templates/blocks` and register it in `frontend/src/artefacts/templates/catalogue.ts` and `frontend/src/artefacts/model.ts`.
2. Allow the template in `frontend/src/artefacts/templates/categories/CategoryPage.tsx`.
3. Add its schema and allowed sets in `backend/src/artefact-agent.ts`.
4. Describe its use in `backend/src/artefact-agent-instructions.md`.

## Database migrations

Create a migration with:

```sh
pnpm --dir backend migrate:create -- <name>
```

Treat migrations on `main` as immutable. Add a new migration instead of changing an existing one. Run the migration check before you open a pull request.

## Deploy

Deploy the API, web app, and a PostgreSQL database as separate services. The included Dockerfiles build both applications. Set production environment variables in your hosting provider, point the API's CORS origin at the web app, and set `VITE_API_URL` to the API's public URL before building the frontend.

For optional integrations, configure their provider credentials on the API service:

- Google Docs and Sheets: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- GitHub sign-in: `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- GitHub App: `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, and `GITHUB_WEBHOOK_SECRET`
- R2 preview storage: `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`

Use secret storage for API credentials. Treat `VITE_*` variables as public because Vite includes them in the browser bundle.

## Contribute

Keep TypeScript changes close to the existing patterns. Add backend tests beside the module you change, run the checks above, and use focused imperative commit subjects such as `fix: handle missing installation`.
