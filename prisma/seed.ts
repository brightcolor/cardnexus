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

  // ── Demo card ────────────────────────────────────────────────────────────────
  console.log("\n🌱 Erstelle Demo-Karte...");

  const demoEmail = "demo@cardnexus.app";
  const demoExisting = await db.user.findUnique({ where: { email: demoEmail } });
  if (!demoExisting) {
    const demoUserId = nanoid();
    const demoAccountId = nanoid();
    const demoHashed = await hashPassword("demo1234");

    await db.user.create({
      data: {
        id: demoUserId,
        name: "Alex Demo",
        email: demoEmail,
        emailVerified: true,
        role: "member",
        createdAt: now,
        updatedAt: now,
      },
    });

    await db.account.create({
      data: {
        id: demoAccountId,
        userId: demoUserId,
        accountId: demoEmail,
        providerId: "credential",
        password: demoHashed,
        createdAt: now,
        updatedAt: now,
      },
    });

    await db.card.create({
      data: {
        userId: demoUserId,
        slug: "demo",
        isPublic: true,
        firstName: "Alex",
        lastName: "Demo",
        title: "Head of Innovation",
        company: "CardNexus GmbH",
        department: "Product & Design",
        bio: "Digitale Visitenkarten für die nächste Generation – teile deine Kontaktdaten mit einem Tap, Scan oder Link. Keine App nötig.",
        phone: "+49 30 1234567",
        mobile: "+49 170 9876543",
        email: demoEmail,
        website: "https://cardnexus.app",
        address: "Unter den Linden 1, 10117 Berlin",
        linkedin: "https://linkedin.com/in/alexdemo",
        twitter: "https://twitter.com/alexdemo",
        github: "https://github.com/alexdemo",
        instagram: "https://instagram.com/alexdemo",
        customLinks: JSON.stringify([
          { label: "📅 Meeting buchen", url: "https://cal.com/demo" },
          { label: "💼 Portfolio", url: "https://example.com/portfolio" },
          { label: "🎙️ Podcast", url: "https://example.com/podcast" },
        ]),
        templateId: "modern",
        primaryColor: "#0F172A",
        accentColor: "#14B8A6",
        fontFamily: "inter",
        layoutStyle: "centered",
        roundedStyle: "pill",
        showQrOnCard: true,
        totalViews: 1247,
        createdAt: now,
        updatedAt: now,
      },
    });

    console.log("✅ Demo-Karte erstellt:");
    console.log(`   E-Mail:   ${demoEmail}`);
    console.log(`   Passwort: demo1234`);
    console.log(`   URL:      /c/demo`);
  } else {
    console.log("   ℹ️  Demo-User existiert bereits – übersprungen");
  }

  console.log("\n🚀 http://localhost:3000/login");
}

main()
  .catch((e) => {
    console.error("❌ Fehler:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
