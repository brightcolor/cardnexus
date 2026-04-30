/**
 * Runtime migration script — runs at container startup.
 * Uses only @prisma/client ($executeRawUnsafe) so no prisma CLI is needed.
 * Safe to run multiple times (fully idempotent).
 */

const { PrismaClient } = require("@prisma/client");

async function columnExists(db, table, column) {
  const rows = await db.$queryRawUnsafe(`PRAGMA table_info("${table}")`);
  return rows.some((r) => r.name === column);
}

async function tableExists(db, table) {
  const rows = await db.$queryRawUnsafe(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, table
  );
  return rows.length > 0;
}

async function migrate() {
  const db = new PrismaClient();
  let ok = 0;
  let skip = 0;

  async function addColumn(table, column, def) {
    try {
      const exists = await columnExists(db, table, column);
      if (!exists) {
        await db.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${def}`);
        console.log(`[migrate] + ${table}.${column}`);
        ok++;
      } else {
        skip++;
      }
    } catch (e) {
      console.error(`[migrate] ! ${table}.${column}: ${e.message}`);
    }
  }

  async function createIndex(name, table, column) {
    try {
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "${name}" ON "${table}"("${column}")`);
    } catch (e) { /* already exists */ }
  }

  // ── user table ───────────────────────────────────────────────────────────
  await addColumn("user", "plan",          'TEXT NOT NULL DEFAULT "free"');
  await addColumn("user", "planExpiresAt", "DATETIME");

  // ── Organization table ───────────────────────────────────────────────────
  await addColumn("Organization", "plan",         'TEXT NOT NULL DEFAULT "free"');
  await addColumn("Organization", "customDomain", "TEXT");

  // ── OrganizationSettings new columns ────────────────────────────────────
  try {
    const settingsExists = await tableExists(db, "OrganizationSettings");
    if (settingsExists) {
      await addColumn("OrganizationSettings", "teamDirectoryEnabled", "INTEGER NOT NULL DEFAULT 1");
      await addColumn("OrganizationSettings", "templateCardData",     "TEXT");
    }
  } catch (e) {
    console.error(`[migrate] ! OrganizationSettings: ${e.message}`);
  }

  // ── Card table new columns ───────────────────────────────────────────────
  await addColumn("Card", "shadowStyle",          'TEXT NOT NULL DEFAULT "md"');
  await addColumn("Card", "socialStyle",          'TEXT NOT NULL DEFAULT "icons"');
  await addColumn("Card", "avatarBorder",         'TEXT NOT NULL DEFAULT "none"');
  await addColumn("Card", "cardBackground",       'TEXT NOT NULL DEFAULT "white"');
  await addColumn("Card", "logoUrl",              "TEXT");
  await addColumn("Card", "showInTeamDirectory",  "INTEGER NOT NULL DEFAULT 1");
  await addColumn("Card", "bookingUrl",           "TEXT");

  // ── Lead table ───────────────────────────────────────────────────────────
  try {
    const leadExists = await tableExists(db, "Lead");
    if (!leadExists) {
      await db.$executeRawUnsafe(`
        CREATE TABLE "Lead" (
          "id"        TEXT     NOT NULL PRIMARY KEY,
          "cardId"    TEXT     NOT NULL,
          "name"      TEXT     NOT NULL,
          "email"     TEXT,
          "phone"     TEXT,
          "message"   TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Lead_cardId_fkey" FOREIGN KEY ("cardId")
            REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await createIndex("Lead_cardId_idx", "Lead", "cardId");
      console.log("[migrate] + table Lead");
      ok++;
    } else {
      skip++;
    }
  } catch (e) {
    console.error(`[migrate] ! Lead table: ${e.message}`);
  }

  // ── Campaign table ───────────────────────────────────────────────────────
  try {
    const campExists = await tableExists(db, "Campaign");
    if (!campExists) {
      await db.$executeRawUnsafe(`
        CREATE TABLE "Campaign" (
          "id"        TEXT     NOT NULL PRIMARY KEY,
          "cardId"    TEXT     NOT NULL,
          "name"      TEXT     NOT NULL,
          "urlSlug"   TEXT     NOT NULL UNIQUE,
          "views"     INTEGER  NOT NULL DEFAULT 0,
          "expiresAt" DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Campaign_cardId_fkey" FOREIGN KEY ("cardId")
            REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await createIndex("Campaign_cardId_idx", "Campaign", "cardId");
      console.log("[migrate] + table Campaign");
      ok++;
    } else {
      await addColumn("Campaign", "expiresAt", "DATETIME");
    }
  } catch (e) {
    console.error(`[migrate] ! Campaign table: ${e.message}`);
  }

  // ── Notification table ───────────────────────────────────────────────────
  try {
    const notifExists = await tableExists(db, "Notification");
    if (!notifExists) {
      await db.$executeRawUnsafe(`
        CREATE TABLE "Notification" (
          "id"        TEXT     NOT NULL PRIMARY KEY,
          "userId"    TEXT     NOT NULL,
          "type"      TEXT     NOT NULL,
          "value"     TEXT     NOT NULL,
          "message"   TEXT     NOT NULL,
          "readAt"    DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId")
            REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "Notification_userId_type_value_key" UNIQUE ("userId", "type", "value")
        )
      `);
      await createIndex("Notification_userId_idx", "Notification", "userId");
      console.log("[migrate] + table Notification");
      ok++;
    } else {
      skip++;
    }
  } catch (e) {
    console.error(`[migrate] ! Notification table: ${e.message}`);
  }

  await db.$disconnect();
  console.log(`[migrate] Done — ${ok} applied, ${skip} already up-to-date`);
}

migrate().catch((e) => {
  console.error("[migrate] Fatal:", e.message);
});
