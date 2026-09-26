# Local development

Run the full Klee stack with:

```sh
./utils/dev.sh
```

Install [Node.js 22.6+](https://nodejs.org/), [pnpm](https://pnpm.io/installation), and [Docker Compose v2](https://docs.docker.com/compose/). Start Docker before you run the script.

| Step | Script action |
| --- | --- |
| 1 | Starts Postgres on port `5433` |
| 2 | Installs backend dependencies |
| 3 | Creates missing backend environment files and runs migrations |
| 4 | Installs frontend dependencies |
| 5 | Creates `frontend/.env.local` when needed |
| 6 | Starts the API on port `3000` and the web app on port `5173` |

The script preserves existing environment files. It keeps the database container running after you press `Ctrl+C`.

## Configure services

The script copies example files before it starts each app. Add credentials when you use the matching integration.

| File | Use |
| --- | --- |
| `backend/.env` | Authentication secret, OpenAI key, and Google OAuth credentials |
| `backend/.env.local` | Local database URL, server URLs, GitHub OAuth credentials, and R2 storage credentials |
| `frontend/.env.local` | API URL and Google Picker credentials |

Git ignores `.env` and `.env.local` files. Do not commit provider credentials.

## Stop services

Press `Ctrl+C` to stop the API and web app. Stop Postgres and remove its container with:

```sh
docker compose down
```

Docker retains the database volume. Remove the volume when you need a new database:

```sh
docker compose down --volumes
```
