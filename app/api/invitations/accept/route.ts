import { apiMessage } from "@/lib/i18n/api";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({ token: z.string().regex(/^[\w-]{32}$/) });
const inviteRole = z.enum(["member", "team_leader", "company_admin"]);
class MembershipChanged extends Error {}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: await apiMessage("unauthorized") }, { status: 401 });

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: await apiMessage("invalidForm") }, { status: 400 });

  const invitation = await db.invitation.findUnique({
    where: { token: body.data.token },
    select: { id: true, email: true, role: true, expiresAt: true, acceptedAt: true, organizationId: true,
      organization: { select: { isActive: true } } },
  });
  const now = new Date();
  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= now ||
      !invitation.organization.isActive || !inviteRole.safeParse(invitation.role).success) {
    return NextResponse.json({ error: await apiMessage("invalidInvitation") }, { status: 410 });
  }
  if (invitation.email.trim().toLowerCase() !== session.user.email.toLowerCase()) {
    return NextResponse.json({ error: await apiMessage("invitationEmailMismatch") }, { status: 403 });
  }
  if (!session.user.emailVerified) {
    return NextResponse.json({ error: await apiMessage("invitationEmailUnverified") }, { status: 403 });
  }
  const senderRoles = invitation.role === "company_admin" ? ["super_admin"]
    : invitation.role === "team_leader" ? ["super_admin", "company_admin"]
    : ["super_admin", "company_admin", "team_leader"];

  try {
    const consumed = await db.$transaction(async (tx) => {
      const claim = await tx.invitation.updateMany({
        where: {
          id: invitation.id, email: invitation.email, role: invitation.role,
          acceptedAt: null, expiresAt: { gt: new Date() }, organization: { isActive: true },
          sender: { organizationId: invitation.organizationId, bannedAt: null, role: { in: senderRoles } },
        },
        data: { acceptedAt: new Date() },
      });
      if (!claim.count) return false;

      const joined = await tx.user.updateMany({
        where: {
          id: session.user.id, email: session.user.email, emailVerified: true,
          bannedAt: null, organizationId: null, role: "member",
        },
        data: { organizationId: invitation.organizationId, role: invitation.role },
      });
      if (!joined.count) throw new MembershipChanged();
      return true;
    });
    if (!consumed) return NextResponse.json({ error: await apiMessage("invalidInvitation") }, { status: 410 });
  } catch (error) {
    if (!(error instanceof MembershipChanged)) throw error;
    return NextResponse.json({ error: await apiMessage("invitationMembershipConflict") }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
