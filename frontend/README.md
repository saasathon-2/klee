# Klee web app

The web app uses React, Vite, Tailwind CSS, and HeroUI. Run the full stack from the repository root:

```sh
./utils/dev.sh
```

Open http://localhost:5173 after the dev server starts. Vite forwards `/api` requests to `VITE_API_URL`, which defaults to `http://localhost:3000`.

## Run this app

Install dependencies and start Vite when you work on the frontend without the helper script:

```sh
pnpm install
pnpm dev
```

Start Postgres and the API first when your change calls the API.

## Environment

Copy `.env.local.example` to `.env.local`. Set `VITE_API_URL` when your API runs on another URL. Add Google Picker values when you work on Docs or Sheets context.

Vite puts `VITE_*` values in the browser bundle. Do not put secrets in them.

## Check your work

```sh
pnpm lint
pnpm build
```

## Build UI

Use HeroUI before you add custom components. Reuse the templates in `src/artefacts/templates` for artefact content. Add new block templates to `src/artefacts/templates/catalogue.ts`, then update the `ArtefactNode` template union in `src/artefacts/model.ts`.

Read [the repository README](../README.md) for API setup, migrations, deployment, and contribution guidance.
