#!/bin/sh
set -e

mkdir -p /app/data /app/public/uploads
export DATABASE_URL="${DATABASE_URL:-file:/app/data/app.db}"

echo "[cardnexus] Running database migrations..."
# prisma@6 is installed globally in the image (see Dockerfile)
prisma db push --schema /app/prisma/schema.prisma

DB_FILE="${DATABASE_URL#file:}"
if [ -f "$DB_FILE" ] && [ "$(stat -c%s "$DB_FILE" 2>/dev/null || stat -f%z "$DB_FILE" 2>/dev/null || echo 999999)" -lt 65536 ]; then
  echo "[cardnexus] Fresh database — seeding admin..."
  node /app/seed_run.js 2>/dev/null || echo "[cardnexus] Seed skipped (script not present yet)"
fi

echo "[cardnexus] Starting application..."
exec "$@"
