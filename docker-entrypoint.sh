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

  log "Seeding default admin and demo user..."
  su-exec nextjs node -e "
const { PrismaClient } = require('/app/node_modules/@prisma/client');
const { hashPassword } = require('/app/node_modules/@better-auth/utils/dist/password.node.cjs');
const { randomUUID } = require('crypto');
async function seed() {
  const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
  const now = new Date();
  try {
    // Admin
    const adminId = randomUUID();
    const adminHash = await hashPassword('admin123');
    await db.user.create({ data: { id: adminId, name: 'Admin', email: 'admin@example.com',
      emailVerified: true, createdAt: now, updatedAt: now, role: 'super_admin' } });
    await db.account.create({ data: { id: randomUUID(), userId: adminId, accountId: 'admin@example.com',
      providerId: 'credential', password: adminHash, createdAt: now, updatedAt: now } });
    console.log('[cardnexus] ' + now.toISOString() + ' Admin seeded: admin@example.com / admin123');

    // Demo user
    const demoId = randomUUID();
    const demoHash = await hashPassword('demo1234');
    await db.user.create({ data: { id: demoId, name: 'Alex Demo', email: 'demo@cardnexus.app',
      emailVerified: true, createdAt: now, updatedAt: now, role: 'member' } });
    await db.account.create({ data: { id: randomUUID(), userId: demoId, accountId: 'demo@cardnexus.app',
      providerId: 'credential', password: demoHash, createdAt: now, updatedAt: now } });
    await db.card.create({ data: {
      userId: demoId, slug: 'demo', isPublic: true,
      firstName: 'Alex', lastName: 'Demo', title: 'Head of Innovation',
      company: 'CardNexus GmbH', department: 'Product & Design',
      bio: 'Digitale Visitenkarten für die nächste Generation – teile deine Kontaktdaten mit einem Tap, Scan oder Link. Keine App nötig.',
      phone: '+49 30 1234567', mobile: '+49 170 9876543',
      email: 'demo@cardnexus.app', website: 'https://cardnexus.app',
      address: 'Unter den Linden 1, 10117 Berlin',
      linkedin: 'https://linkedin.com/in/alexdemo', twitter: 'https://twitter.com/alexdemo',
      github: 'https://github.com/alexdemo', instagram: 'https://instagram.com/alexdemo',
      customLinks: JSON.stringify([
        { label: '📅 Meeting buchen', url: 'https://cal.com/demo' },
        { label: '💼 Portfolio', url: 'https://example.com/portfolio' },
        { label: '🎙️ Podcast', url: 'https://example.com/podcast' },
      ]),
      templateId: 'modern', primaryColor: '#0F172A', accentColor: '#14B8A6',
      fontFamily: 'inter', layoutStyle: 'centered', roundedStyle: 'pill',
      showQrOnCard: true, totalViews: 1247, createdAt: now, updatedAt: now,
    } });
    console.log('[cardnexus] ' + now.toISOString() + ' Demo seeded: demo@cardnexus.app / demo1234 → /c/demo');
  } finally { await db.\$disconnect(); }
}
seed().catch(e => console.error('[cardnexus] ' + new Date().toISOString() + ' Seed error: ' + e.message));
"
else
  log "Existing database found — skipping init"
fi

log "Applying database migrations..."
su-exec nextjs node /app/prisma/migrate-runtime.js

log "Starting application..."
exec su-exec nextjs "$@"
