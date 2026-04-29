#!/bin/sh
set -e

mkdir -p /app/data /app/public/uploads
export DATABASE_URL="${DATABASE_URL:-file:/app/data/app.db}"
DB_FILE="${DATABASE_URL#file:}"

if [ ! -f "$DB_FILE" ]; then
  echo "[cardnexus] First run — copying pre-initialised database..."
  cp /app/prisma/base.db "$DB_FILE"

  echo "[cardnexus] Seeding default admin (admin@example.com / admin123)..."
  node -e "
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
    console.log('[cardnexus] Admin seeded: admin@example.com / admin123');
  } finally { await db.\$disconnect(); }
}
seed().catch(e => console.error('[cardnexus] Seed error:', e.message));
"
else
  echo "[cardnexus] Existing database found — skipping init"
fi

echo "[cardnexus] Starting application..."
exec "$@"
