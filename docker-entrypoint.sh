#!/bin/sh
set -e

# Ensure the data directory exists and is writable
mkdir -p /app/data /app/public/uploads

# Default DATABASE_URL to the volume path if not set
export DATABASE_URL="${DATABASE_URL:-file:/app/data/app.db}"

echo "[cardnexus] Running database migrations..."
npx prisma db push

# Seed only when the database is freshly created (no users yet)
DB_FILE="${DATABASE_URL#file:}"

# Simple heuristic: if the db file is smaller than 64KB it was just created
if [ -f "$DB_FILE" ] && [ "$(stat -c%s "$DB_FILE" 2>/dev/null || stat -f%z "$DB_FILE" 2>/dev/null || echo 999999)" -lt 65536 ]; then
  echo "[cardnexus] Fresh database detected — seeding default admin..."
  cd /app && node -e "
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('@better-auth/utils/password');
async function seed() {
  const db = new PrismaClient();
  const existing = await db.user.findFirst();
  if (existing) { console.log('Already seeded.'); await db.\$disconnect(); return; }
  const id = Math.random().toString(36).slice(2);
  const hashed = await hashPassword('admin123');
  await db.user.create({ data: { id, name: 'Admin', email: 'admin@example.com', emailVerified: true, createdAt: new Date(), updatedAt: new Date(), role: 'super_admin' } });
  await db.account.create({ data: { id: Math.random().toString(36).slice(2), userId: id, accountId: id, providerId: 'credential', password: hashed, createdAt: new Date(), updatedAt: new Date() } });
  console.log('Seeded: admin@example.com / admin123');
  await db.\$disconnect();
}
seed().catch(e => { console.error(e); process.exit(1); });
"
fi

echo "[cardnexus] Starting application..."
exec "$@"
