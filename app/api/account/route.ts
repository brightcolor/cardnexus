import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const emailSchema = z.object({ email: z.string().email() });

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = emailSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Ungültige E-Mail" }, { status: 400 });

  const { email } = body.data;
  if (email === session.user.email) {
    return NextResponse.json({ success: true });
  }

  // Don't reveal whether the email is already taken — return success either way
  // and only update if the address is free. This prevents email enumeration.
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json({ success: true });
  }

  await db.user.update({ where: { id: session.user.id }, data: { email } });
  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/account
 * Permanently removes the current user, all their cards, organizations
 * memberships, leads etc. (cascade). DSGVO Art. 17 (Right to erasure).
 */
export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // super_admin must remove role first to delete (safety net).
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (me?.role === "super_admin") {
    return NextResponse.json(
      { error: "Super-Admin kann nicht gelöscht werden. Rolle vorher entfernen." },
      { status: 400 }
    );
  }

  // Cascade deletes via Prisma onDelete:Cascade on user relations.
  await db.user.delete({ where: { id: session.user.id } });
  return NextResponse.json({ success: true });
}
