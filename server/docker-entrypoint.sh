#!/bin/sh
# Container startup: derive a PostgreSQL schema from the canonical SQLite schema
# (only the datasource provider differs — JSON-as-string columns work on both),
# push it, seed demo data, then start the API.
set -e

SCHEMA=prisma/schema.docker.prisma
sed 's|provider = "sqlite"|provider = "postgresql"|' prisma/schema.prisma > "$SCHEMA"

echo "[entrypoint] generating Prisma client (postgresql)…"
npx prisma generate --schema="$SCHEMA" >/dev/null

echo "[entrypoint] pushing schema to database…"
npx prisma db push --schema="$SCHEMA" --skip-generate

echo "[entrypoint] seeding demo data…"
npx tsx prisma/seed.ts || echo "[entrypoint] seed skipped"

echo "[entrypoint] starting API…"
exec npm start
