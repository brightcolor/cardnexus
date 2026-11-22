const { randomUUID } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const { hashPassword, verifyPassword } = require("@better-auth/utils/password");

const db = new PrismaClient();

async function bootstrap() {
  const legacyAccounts = new Map([
    ["admin@example.com", "admin123"],
    ["demo@cardnexus.app", "demo1234"],
  ]);
  const legacyEmails = [...legacyAccounts.keys()];
  const credentials = await db.account.findMany({
    where: {
      providerId: "credential",
      OR: [{ accountId: { in: legacyEmails } }, { user: { email: { in: legacyEmails } } }],
    },
    select: { accountId: true, password: true, user: { select: { email: true } } },
  });
  for (const { accountId, password, user } of credentials) {
    const legacyPassword = legacyAccounts.get(accountId) ?? legacyAccounts.get(user.email);
    if (password && legacyPassword && await verifyPassword(password, legacyPassword)) {
      throw new Error("Legacy default credentials detected. Rotate the affected credentials or remove the demo account before upgrading.");
    }
  }

  if (await db.user.findFirst({ where: { role: "super_admin", bannedAt: null }, select: { id: true } })) return;

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || legacyAccounts.has(email)) {
    throw new Error("Set BOOTSTRAP_ADMIN_EMAIL to a dedicated administrator email.");
  }
  if (!password || password.trim().length < 16 || password.length > 128) {
    throw new Error("Set BOOTSTRAP_ADMIN_PASSWORD to a unique password of 16 to 128 characters.");
  }

  const hash = await hashPassword(password);
  await db.$transaction(async (tx) => {
    if (await tx.user.findFirst({ where: { role: "super_admin", bannedAt: null }, select: { id: true } })) return;
    if (await tx.user.findUnique({ where: { email }, select: { id: true } })) {
      throw new Error("Bootstrap administrator email is already assigned. Use a dedicated unused email.");
    }
    const userId = randomUUID();
    const now = new Date();
    await tx.user.create({
      data: { id: userId, name: "Admin", email, emailVerified: true, role: "super_admin", createdAt: now, updatedAt: now },
    });
    await tx.account.create({
      data: { id: randomUUID(), userId, accountId: userId, providerId: "credential", password: hash, createdAt: now, updatedAt: now },
    });
    console.log("[bootstrap] Administrator created.");
  });
}

bootstrap()
  .catch((error) => {
    console.error("[bootstrap]", error.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
