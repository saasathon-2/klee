FROM node:22-alpine AS build

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_URL
ARG VITE_GOOGLE_PICKER_API_KEY
ARG VITE_GOOGLE_CLOUD_PROJECT_NUMBER
ARG RAILWAY_GIT_COMMIT_SHA
RUN pnpm build

FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 3000
