#!/bin/sh
set -e

# This script runs as root so it can fix bind-mount ownership,
# then drops privileges to the nextjs user before starting Node.

log() { printf '[cardnexus] %s %s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$*"; }

# Ensure data dirs exist and belong to the app user (handles bind mounts
# created by root on the host, and named volumes with wrong ownership).
mkdir -p /app/data /app/public/uploads
chown nextjs:nodejs /app/data /app/public/uploads

export DATABASE_URL="${DATABASE_URL:-file:/app/data/app.db}"
DB_FILE="${DATABASE_URL#file:}"

if [ ! -f "$DB_FILE" ]; then
  log "First run — copying pre-initialised database..."
  cp /app/prisma/base.db "$DB_FILE"
  chown nextjs:nodejs "$DB_FILE"
else
  log "Existing database found — skipping init"
fi

log "Applying database migrations..."
su-exec nextjs node /app/prisma/migrate-runtime.js

log "Checking administrator bootstrap..."
su-exec nextjs node /app/prisma/bootstrap-runtime.js

unset BOOTSTRAP_ADMIN_PASSWORD
log "Starting application..."
exec su-exec nextjs "$@"
