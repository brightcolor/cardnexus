import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageUsers } from "@/lib/utils";
import { sendInvitationEmail } from "@/lib/email";
import { z } from "zod";
import { nanoid } from "nanoid";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["company_admin", "team_leader", "member"]),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  const orgId = (session.user as { organizationId?: string }).organizationId;

  if (!canManageUsers(role) || !orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invitations = await db.invitation.findMany({
    where: { organizationId: orgId, acceptedAt: null },
    include: { sender: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: invitations });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  const orgId = (session.user as { organizationId?: string }).organizationId;

  if (!canManageUsers(role) || !orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.invitation.findFirst({
    where: { email: parsed.data.email, organizationId: orgId, acceptedAt: null },
  });
  if (existing) {
    return NextResponse.json({ error: "Einladung bereits gesendet" }, { status: 409 });
  }

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await db.invitation.create({
    data: {
      email: parsed.data.email,
      role: parsed.data.role,
      token,
      expiresAt,
      organizationId: orgId,
      senderId: session.user.id,
    },
    include: { sender: { select: { name: true } }, organization: { select: { name: true } } },
  });

  // Derive base URL from request so it works on any host
  const reqHeaders = await headers();
  const host  = reqHeaders.get("x-forwarded-host") ?? reqHeaders.get("host") ?? "localhost:3000";
  const proto = reqHeaders.get("x-forwarded-proto") ?? "http";
  const inviteUrl = `${proto}://${host}/register?invite=${token}`;

  // Send email (fire-and-forget — don't block the response)
  sendInvitationEmail({
    to:         invitation.email,
    senderName: invitation.sender.name,
    orgName:    invitation.organization.name,
    role:       invitation.role,
    inviteUrl,
  }).catch((e) => console.error("[invite email]", e));

  return NextResponse.json({ data: invitation, inviteUrl }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  if (!canManageUsers(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await request.json();
  await db.invitation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
