FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
	libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libatspi2.0-0 \
	libcups2 libdrm2 libgbm1 libxkbcommon0 libxcomposite1 libxdamage1 \
	libxfixes3 libxrandr2 libasound2 libpango-1.0-0 libcairo2 libgtk-3-0 \
	fonts-liberation poppler-utils && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm typecheck

CMD ["pnpm", "start"]
