import { apiMessage, apiValidation } from "@/lib/i18n/api";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageUsers } from "@/lib/utils";
import { sendInvitationEmail } from "@/lib/email";
import { nanoid } from "nanoid";
import { z } from "zod";

const bulkSchema = z.object({
  emails: z.array(z.string().trim().toLowerCase().email()).min(1).max(50),
  role: z.enum(["company_admin", "team_leader", "member"]).optional().default("member"),
});

async function createInvite(
  email: string,
  role: string,
  orgId: string,
  senderId: string,
  inviteUrlBase: string,
  orgName: string,
  senderName: string
) {
  const existing = await db.invitation.findFirst({
    where: { email, organizationId: orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existing) return { skipped: true };

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.invitation.create({
    data: { email, role, token, expiresAt, organizationId: orgId, senderId },
  });

  const inviteUrl = `${inviteUrlBase}?invite=${token}`;
  sendInvitationEmail({ to: email, senderName, orgName, role, inviteUrl }).catch(() => {});

  return { skipped: false };
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: await apiMessage("unauthorized") }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  const orgId = (session.user as { organizationId?: string }).organizationId;

  if (!canManageUsers(role) || !orgId) {
    return NextResponse.json({ error: await apiMessage("forbidden") }, { status: 403 });
  }

  const org = await db.organization.findUnique({
    where: { id: orgId, isActive: true },
    select: { name: true },
  });
  if (!org) return NextResponse.json({ error: await apiMessage("orgNotFound") }, { status: 404 });

  const base = process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const inviteUrlBase = new URL("/invite", base).toString();

  let emails: string[];
  let inviteRole = "member";
  const errors: string[] = [];

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: await apiMessage("noFileProvided") }, { status: 400 });

    const text = await file.text();
    emails = text
      .split("\n")
      .map((line) => {
        const parts = line.split(",");
        return parts[0].trim().toLowerCase();
      })
      .filter((e) => z.string().email().safeParse(e).success);

    if (emails.length > 50) {
      return NextResponse.json({ error: await apiMessage("invitationLimit") }, { status: 400 });
    }
  } else {
    const body = await request.json().catch(() => null);
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: await apiValidation(parsed.error) }, { status: 400 });
    }
    emails = parsed.data.emails;
    inviteRole = parsed.data.role;
  }

  // SECURITY: team_leader may only invite members.
  if (role === "team_leader" && inviteRole !== "member") {
    return NextResponse.json(
      { error: await apiMessage("leaderInvite") },
      { status: 403 }
    );
  }
  if (inviteRole === "company_admin" && role !== "super_admin") {
    return NextResponse.json({ error: await apiMessage("forbidden") }, { status: 403 });
  }

  let sent = 0;
  let skipped = 0;

  for (const email of new Set(emails)) {
    try {
      const result = await createInvite(
        email,
        inviteRole,
        orgId,
        session.user.id,
        inviteUrlBase,
        org.name,
        session.user.name
      );
      if (result.skipped) skipped++;
      else sent++;
    } catch (err) {
      errors.push(`${email}: ${err instanceof Error ? err.message : "Fehler"}`);
    }
  }

  return NextResponse.json({ sent, skipped, errors }, { status: 201 });
}
