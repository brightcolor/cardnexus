import { db } from "@/lib/db";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    await Promise.all([
      db.user.findFirst({ select: { id: true, locale: true, bannedAt: true } }),
      db.card.findFirst({ select: { slug: true, approvalStatus: true, passwordHash: true } }),
      db.invitation.findFirst({ select: { id: true, acceptedAt: true } }),
      db.twoFactor.findFirst({ select: { id: true, failedVerificationCount: true, lockedUntil: true } }),
    ]);
    return Response.json({ ready: true }, { headers });
  } catch {
    return Response.json({ ready: false }, { status: 503, headers });
  }
}
