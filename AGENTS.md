# Repository Guidelines

## Project Structure

This repository contains a TypeScript application split into two services. `backend/src` holds the Node.js API, database access, and timestamped SQL migrations; backend tests sit beside their modules as `*.test.ts`. `frontend/src` contains the React and Vite application, with static assets in `frontend/public`. `utils/dev.sh` starts the local stack, and `design_inspiration/` contains visual references. Deployment and environment setup are documented in `README.md`.

## Build, Test, and Development

- `./utils/dev.sh` installs dependencies, starts Postgres with Docker Compose, applies migrations, and runs both development servers (API on port 3000, web on 5173).
- `pnpm --dir backend test` runs the backend Node test suite.
- `pnpm --dir backend typecheck` checks backend TypeScript types; this is also the API build command used for deployment.
- `pnpm --dir frontend lint` runs ESLint; `pnpm --dir frontend build` type-checks and builds the Vite app.
- `MIGRATIONS_BASE_REF=origin/main pnpm --dir backend migrations:check` verifies migration naming and immutability against `main`.

Run `./utils/dev.sh` for full-stack work. It creates missing local environment files from examples; keep secrets in those ignored files, never in commits.

## Style and Changes

Use TypeScript for application code and follow the surrounding code’s formatting and naming. React components and pages use PascalCase filenames; backend modules and tests use kebab-case or the existing module naming pattern. Keep tests next to the code they cover. Frontend linting is enforced through ESLint; there is no separate formatter command configured.

Use the repository’s established imperative commit subjects, commonly `feat:`, `fix:`, `docs:`, and `chore:` (for example, `fix: handle missing installation`). Keep each commit focused.

## Tests and Pull Requests

Add or update a nearby `*.test.ts` when changing backend behavior, then run the backend test and typecheck commands above. For frontend changes, run lint and build. Pull requests should explain the user-visible change and verification performed; include screenshots for visual changes and link related issues when applicable. PR checks include a migration guard. Never edit, rename, or delete a migration already present on `main`; add a new uniquely timestamped migration instead.

## Configuration and Security

Use `.env` and `.env.local` files generated from the example templates for local settings. Production configuration is supplied through Railway variables. Treat API keys, auth secrets, and GitHub credentials as secrets; do not commit them. Keep `CORS_ORIGIN` and `VITE_API_URL` aligned with the actual service URLs.
