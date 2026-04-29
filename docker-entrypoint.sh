#!/bin/sh
set -e

mkdir -p /app/data /app/public/uploads
export DATABASE_URL="${DATABASE_URL:-file:/app/data/app.db}"

echo "[cardnexus] Running database migrations..."
# Use the Prisma 6 CLI bundled in the image (see Dockerfile)
# Never rely on `npx prisma` which would pull Prisma 7 with breaking schema changes
prisma db push --schema /app/prisma/schema.prisma

DB_FILE="${DATABASE_URL#file:}"

if [ -f "$DB_FILE" ] && [ "$(stat -c%s "$DB_FILE" 2>/dev/null || stat -f%z "$DB_FILE" 2>/dev/null || echo 999999)" -lt 65536 ]; then
  echo "[cardnexus] Fresh database — seeding default admin..."
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
