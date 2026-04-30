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

  // ── Card table new columns ───────────────────────────────────────────────
  await addColumn("Card", "shadowStyle",          'TEXT NOT NULL DEFAULT "md"');
  await addColumn("Card", "socialStyle",          'TEXT NOT NULL DEFAULT "icons"');
  await addColumn("Card", "avatarBorder",         'TEXT NOT NULL DEFAULT "none"');
  await addColumn("Card", "cardBackground",       'TEXT NOT NULL DEFAULT "white"');
  await addColumn("Card", "logoUrl",              "TEXT");
  await addColumn("Card", "showInTeamDirectory",  "INTEGER NOT NULL DEFAULT 1");

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
      await db.$executeRawUnsafe(`CREATE INDEX "Lead_cardId_idx" ON "Lead"("cardId")`);
      console.log("[migrate] + table Lead");
      ok++;
    } else {
      skip++;
    }
  } catch (e) {
    console.error(`[migrate] ! Lead table: ${e.message}`);
  }

  // ── OrganizationSettings new columns ────────────────────────────────────
  try {
    const settingsExists = await tableExists(db, "OrganizationSettings");
    if (settingsExists) {
      await addColumn("OrganizationSettings", "teamDirectoryEnabled", "INTEGER NOT NULL DEFAULT 1");
    }
  } catch (e) {
    console.error(`[migrate] ! OrganizationSettings: ${e.message}`);
  }

  await db.$disconnect();
  console.log(`[migrate] Done — ${ok} applied, ${skip} already up-to-date`);
}

migrate().catch((e) => {
  // Never crash the container on migration errors — app may still work
  console.error("[migrate] Fatal:", e.message);
});
