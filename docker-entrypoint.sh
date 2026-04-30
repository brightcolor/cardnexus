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

  log "Seeding default admin (admin@example.com / admin123)..."
  su-exec nextjs node -e "
const { PrismaClient } = require('/app/node_modules/@prisma/client');
const { hashPassword } = require('/app/node_modules/@better-auth/utils/dist/password.node.cjs');
async function seed() {
  const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
  try {
    const id = require('crypto').randomUUID();
    const hashed = await hashPassword('admin123');
    await db.user.create({ data: { id, name: 'Admin', email: 'admin@example.com',
      emailVerified: true, createdAt: new Date(), updatedAt: new Date(), role: 'super_admin' } });
    await db.account.create({ data: { id: require('crypto').randomUUID(), userId: id, accountId: id,
      providerId: 'credential', password: hashed, createdAt: new Date(), updatedAt: new Date() } });
    console.log('[cardnexus] ' + new Date().toISOString() + ' Admin seeded: admin@example.com / admin123');
  } finally { await db.\$disconnect(); }
}
seed().catch(e => console.error('[cardnexus] ' + new Date().toISOString() + ' Seed error: ' + e.message));
"
else
  log "Existing database found — skipping init"
fi

log "Applying database migrations (prisma db push)..."
su-exec nextjs node /app/node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss 2>&1 | while IFS= read -r line; do log "$line"; done

log "Starting application..."
exec su-exec nextjs "$@"
