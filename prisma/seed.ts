import { db } from "../lib/db";
import { hashPassword } from "@better-auth/utils/password";
import { nanoid } from "nanoid";

async function main() {
  console.log("🌱 Erstelle Admin-Account...");

  const email = "admin@example.com";
  const password = "admin123";
  const name = "Admin";
  const now = new Date();

  // Clean up existing user
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.cardAnalytic.deleteMany({ where: { userId: existing.id } });
    await db.card.deleteMany({ where: { userId: existing.id } });
    await db.invitation.deleteMany({ where: { senderId: existing.id } });
    await db.session.deleteMany({ where: { userId: existing.id } });
    await db.account.deleteMany({ where: { userId: existing.id } });
    await db.user.delete({ where: { id: existing.id } });
    console.log("  ♻️  Bestehenden Admin gelöscht");
  }

  // Hash password using the same function better-auth uses internally
  const hashed = await hashPassword(password);

  const userId = nanoid();
  const accountId = nanoid();

  // Create user record (matches better-auth's user table schema)
  await db.user.create({
    data: {
      id: userId,
      name,
      email,
      emailVerified: true,
      role: "super_admin",
      createdAt: now,
      updatedAt: now,
    },
  });

  // Create credential account (matches better-auth's account table schema)
  await db.account.create({
    data: {
      id: accountId,
      userId,
      accountId: email,
      providerId: "credential",
      password: hashed,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log("✅ Admin-Account erstellt:");
  console.log(`   E-Mail:   ${email}`);
  console.log(`   Passwort: ${password}`);
  console.log(`   Rolle:    super_admin`);
  console.log("\n🚀 http://localhost:3000/login");
}

main()
  .catch((e) => {
    console.error("❌ Fehler:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
