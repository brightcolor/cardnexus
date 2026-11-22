import { apiValidation } from "@/lib/i18n/api";
import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/api/invitations.json";
import it from "@/messages/it/api/invitations.json";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageUsers } from "@/lib/utils";
import { sendInvitationEmail } from "@/lib/email";
import { z } from "zod";
import { nanoid } from "nanoid";

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["company_admin", "team_leader", "member"]),
});

export async function GET() {
  const locale = await getLocale();
  const t = translator(locale, de, it);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  const orgId = (session.user as { organizationId?: string }).organizationId;

  if (!canManageUsers(role) || !orgId) {
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  const invitations = await db.invitation.findMany({
    where: { organizationId: orgId, acceptedAt: null, organization: { isActive: true } },
    select: { id: true, email: true, role: true, expiresAt: true, createdAt: true, sender: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: invitations });
}

export async function POST(request: NextRequest) {
  const locale = await getLocale();
  const t = translator(locale, de, it);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  const orgId = (session.user as { organizationId?: string }).organizationId;

  if (!canManageUsers(role) || !orgId) {
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: await apiValidation(parsed.error) }, { status: 400 });
  }

  // SECURITY: a team_leader (canManageUsers=true) must NOT be able to grant
  // company_admin or team_leader roles — only company_admin/super_admin may.
  if (role === "team_leader" && parsed.data.role !== "member") {
    return NextResponse.json(
      { error: t("leaderRestriction") },
      { status: 403 }
    );
  }
  if (parsed.data.role === "company_admin" && role !== "super_admin") {
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  if (!await db.organization.findFirst({ where: { id: orgId, isActive: true }, select: { id: true } })) {
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  const existing = await db.invitation.findFirst({
    where: { email: parsed.data.email, organizationId: orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existing) {
    return NextResponse.json({ error: t("alreadyInvited") }, { status: 409 });
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

  const base = process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const inviteUrl = new URL(`/invite?${new URLSearchParams({ invite: token })}`, base).toString();

  // Send email (fire-and-forget — don't block the response)
  sendInvitationEmail({
    to:         invitation.email,
    senderName: invitation.sender.name,
    orgName:    invitation.organization.name,
    role:       invitation.role,
    inviteUrl,
  }).catch((e) => console.error("[invite email]", e));

  const { token: _token, ...data } = invitation;
  return NextResponse.json({ data, inviteUrl }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const locale = await getLocale();
  const t = translator(locale, de, it);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  const orgId = (session.user as { organizationId?: string }).organizationId;
  if (!canManageUsers(role) || !orgId) {
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  const body = z.object({ id: z.string().min(1) }).safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: await apiValidation(body.error) }, { status: 400 });
  const { id } = body.data;
  // SECURITY: scope deletion to the caller's org so admins can't tear down
  // invitations from other organizations they happen to know the ID of.
  const result = await db.invitation.deleteMany({
    where: { id, organizationId: orgId, acceptedAt: null, organization: { isActive: true } },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: t("notFound") }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
