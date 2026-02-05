FROM oven/bun:1

WORKDIR /app

COPY backend/package.json backend/bun.lockb* ./
RUN bun install

COPY backend/migrations ./migrations

CMD ["bun", "run", "migrations/run.ts"]
