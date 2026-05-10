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
  await addColumn("user", "leadNotification",     'TEXT NOT NULL DEFAULT "off"');
  await addColumn("user", "plan",                 'TEXT NOT NULL DEFAULT "free"');
  await addColumn("user", "planExpiresAt",        "DATETIME");
  await addColumn("user", "stripeCustomerId",     "TEXT");
  await addColumn("user", "stripeSubscriptionId", "TEXT");
  await addColumn("user", "paypalSubscriptionId", "TEXT");
  await addColumn("user", "referralCode",         "TEXT");
  await addColumn("user", "referredById",         "TEXT");
  await addColumn("user", "twoFactorEnabled",     "INTEGER NOT NULL DEFAULT 0");

  // ── Organization table ───────────────────────────────────────────────────
  await addColumn("Organization", "plan",         'TEXT NOT NULL DEFAULT "free"');
  await addColumn("Organization", "customDomain", "TEXT");
  await addColumn("Organization", "isActive",     "INTEGER NOT NULL DEFAULT 1");  // v1.7.0 org-freeze
  await addColumn("Organization", "frozenAt",     "DATETIME");                    // v1.7.0 org-freeze

  // ── user account status (v1.8.0) ────────────────────────────────────────
  await addColumn("user", "bannedAt", "DATETIME");

  // ── OrganizationSettings new columns ────────────────────────────────────
  try {
    const settingsExists = await tableExists(db, "OrganizationSettings");
    if (settingsExists) {
      await addColumn("OrganizationSettings", "teamDirectoryEnabled", "INTEGER NOT NULL DEFAULT 1");
      await addColumn("OrganizationSettings", "templateCardData",     "TEXT");
      await addColumn("OrganizationSettings", "webhookUrl",           "TEXT");
      await addColumn("OrganizationSettings", "managerApproval",      "INTEGER NOT NULL DEFAULT 0");
    }
  } catch (e) {
    console.error(`[migrate] ! OrganizationSettings: ${e.message}`);
  }

  // ── PlatformSettings new columns ────────────────────────────────────────
  await addColumn("PlatformSettings", "allowedDomains", "TEXT");

  // ── Card table new columns ───────────────────────────────────────────────
  await addColumn("Card", "approvalStatus",       'TEXT NOT NULL DEFAULT "approved"');
  await addColumn("Card", "approvalNote",         "TEXT");
  await addColumn("Card", "cardDomain",           "TEXT");
  await addColumn("Card", "hideShareButton",      "INTEGER NOT NULL DEFAULT 0");
  await addColumn("Card", "shadowStyle",          'TEXT NOT NULL DEFAULT "md"');
  await addColumn("Card", "socialStyle",          'TEXT NOT NULL DEFAULT "icons"');
  await addColumn("Card", "avatarBorder",         'TEXT NOT NULL DEFAULT "none"');
  await addColumn("Card", "cardBackground",       'TEXT NOT NULL DEFAULT "white"');
  await addColumn("Card", "logoUrl",              "TEXT");
  await addColumn("Card", "showInTeamDirectory",  "INTEGER NOT NULL DEFAULT 1");
  await addColumn("Card", "bookingUrl",           "TEXT");
  await addColumn("Card", "name",                 'TEXT NOT NULL DEFAULT "Meine Karte"');
  await addColumn("Card", "isDefault",            "INTEGER NOT NULL DEFAULT 1");
  await addColumn("Card", "expiresAt",            "DATETIME");
  await addColumn("Card", "passwordHash",         "TEXT");
  // Drop the unique constraint on userId to allow multiple cards per user
  try {
    await db.$executeRawUnsafe(`DROP INDEX IF EXISTS "Card_userId_key"`);
  } catch (e) { /* already dropped */ }
  await createIndex("Card_userId_idx", "Card", "userId");

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

  // ── Webhook table ────────────────────────────────────────────────────────
  try {
    const webhookExists = await tableExists(db, "Webhook");
    if (!webhookExists) {
      await db.$executeRawUnsafe(`
        CREATE TABLE "Webhook" (
          "id"        TEXT     NOT NULL PRIMARY KEY,
          "userId"    TEXT     NOT NULL,
          "name"      TEXT     NOT NULL,
          "url"       TEXT     NOT NULL,
          "events"    TEXT     NOT NULL DEFAULT '["lead"]',
          "secret"    TEXT,
          "active"    INTEGER  NOT NULL DEFAULT 1,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Webhook_userId_fkey" FOREIGN KEY ("userId")
            REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await createIndex("Webhook_userId_idx", "Webhook", "userId");
      console.log("[migrate] + table Webhook");
      ok++;
    } else { skip++; }
  } catch (e) {
    console.error(`[migrate] ! Webhook table: ${e.message}`);
  }

  // ── ProcessedWebhookEvent (Stripe/PayPal idempotency) ───────────────────
  try {
    const exists = await tableExists(db, "ProcessedWebhookEvent");
    if (!exists) {
      await db.$executeRawUnsafe(`
        CREATE TABLE "ProcessedWebhookEvent" (
          "id"        TEXT     NOT NULL PRIMARY KEY,
          "provider"  TEXT     NOT NULL,
          "eventId"   TEXT     NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ProcessedWebhookEvent_provider_eventId_key" UNIQUE ("provider", "eventId")
        )
      `);
      await createIndex("ProcessedWebhookEvent_provider_idx", "ProcessedWebhookEvent", "provider");
      console.log("[migrate] + table ProcessedWebhookEvent");
      ok++;
    } else { skip++; }
  } catch (e) {
    console.error(`[migrate] ! ProcessedWebhookEvent: ${e.message}`);
  }

  // ── ApiKey table ─────────────────────────────────────────────────────────
  try {
    const apiKeyExists = await tableExists(db, "ApiKey");
    if (!apiKeyExists) {
      await db.$executeRawUnsafe(`
        CREATE TABLE "ApiKey" (
          "id"         TEXT     NOT NULL PRIMARY KEY,
          "userId"     TEXT     NOT NULL,
          "name"       TEXT     NOT NULL,
          "keyHash"    TEXT     NOT NULL UNIQUE,
          "prefix"     TEXT     NOT NULL,
          "lastUsedAt" DATETIME,
          "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId")
            REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await createIndex("ApiKey_userId_idx", "ApiKey", "userId");
      console.log("[migrate] + table ApiKey");
      ok++;
    } else { skip++; }
  } catch (e) {
    console.error(`[migrate] ! ApiKey table: ${e.message}`);
  }

  // ── Card vCard 4.0 fields (v2.0.0) ──────────────────────────────────────
  await addColumn("Card", "pronouns", "TEXT");
  await addColumn("Card", "gender",   "TEXT");
  await addColumn("Card", "birthday", "TEXT");
  await addColumn("Card", "fax",      "TEXT");

  // ── CardAnalytic UTM columns ────────────────────────────────────────────
  await addColumn("CardAnalytic", "utmSource",   "TEXT");
  await addColumn("CardAnalytic", "utmMedium",   "TEXT");
  await addColumn("CardAnalytic", "utmCampaign", "TEXT");
  await createIndex("CardAnalytic_utmCampaign_idx", "CardAnalytic", "utmCampaign");

  // ── CardSlugAlias table ───────────────────────────────────────────────────
  try {
    const aliasExists = await tableExists(db, "CardSlugAlias");
    if (!aliasExists) {
      await db.$executeRawUnsafe(`
        CREATE TABLE "CardSlugAlias" (
          "id"        TEXT     NOT NULL PRIMARY KEY,
          "oldSlug"   TEXT     NOT NULL UNIQUE,
          "cardSlug"  TEXT     NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "CardSlugAlias_cardSlug_fkey" FOREIGN KEY ("cardSlug")
            REFERENCES "Card" ("slug") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await createIndex("CardSlugAlias_oldSlug_idx", "CardSlugAlias", "oldSlug");
      console.log("[migrate] + table CardSlugAlias");
      ok++;
    } else { skip++; }
  } catch (e) {
    console.error(`[migrate] ! CardSlugAlias table: ${e.message}`);
  }

  // ── CardAnalytic extended metrics ────────────────────────────────────────
  await addColumn("CardAnalytic", "city",     "TEXT");
  await addColumn("CardAnalytic", "browser",  "TEXT");
  await addColumn("CardAnalytic", "os",       "TEXT");
  await addColumn("CardAnalytic", "referrer", "TEXT");
  await addColumn("CardAnalytic", "language", "TEXT");
  await createIndex("CardAnalytic_country_idx", "CardAnalytic", "country");

  // ── user.leadNotification & Card approval columns ────────────────────────
  await addColumn("user", "leadNotification", 'TEXT NOT NULL DEFAULT "off"');
  await addColumn("Card", "approvalStatus",   'TEXT NOT NULL DEFAULT "approved"');
  await addColumn("Card", "approvalNote",     "TEXT");

  // ── twoFactor table (better-auth twoFactor plugin) ───────────────────────
  try {
    const twoFactorExists = await tableExists(db, "twoFactor");
    if (!twoFactorExists) {
      await db.$executeRawUnsafe(`
        CREATE TABLE "twoFactor" (
          "id"          TEXT    NOT NULL PRIMARY KEY,
          "userId"      TEXT    NOT NULL,
          "secret"      TEXT    NOT NULL,
          "backupCodes" TEXT    NOT NULL,
          "verified"    INTEGER NOT NULL DEFAULT 1,
          CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId")
            REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await createIndex("twoFactor_userId_idx", "twoFactor", "userId");
      await createIndex("twoFactor_secret_idx", "twoFactor", "secret");
      console.log("[migrate] + table twoFactor");
      ok++;
    } else { skip++; }
  } catch (e) {
    console.error(`[migrate] ! twoFactor table: ${e.message}`);
  }

  await db.$disconnect();
  console.log(`[migrate] Done — ${ok} applied, ${skip} already up-to-date`);
}

migrate().catch((e) => {
  console.error("[migrate] Fatal:", e.message);
});
