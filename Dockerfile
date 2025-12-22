FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock turbo.json ./
COPY packages/api/package.json ./packages/api/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/functions/package.json ./packages/functions/package.json
COPY packages/marketing/package.json ./packages/marketing/package.json
COPY packages/pipeline/package.json ./packages/pipeline/package.json
COPY packages/scripts/package.json ./packages/scripts/package.json
COPY packages/web/package.json ./packages/web/package.json
RUN bun install --frozen-lockfile

FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/package.json ./package.json
COPY --from=install /app/bun.lock ./bun.lock
COPY packages/api ./packages/api
COPY packages/core ./packages/core

EXPOSE 3001
ENV NODE_ENV=production
CMD ["bun", "run", "/app/packages/api/src/index.ts"]
