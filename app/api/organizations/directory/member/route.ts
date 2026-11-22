import { apiMessage } from "@/lib/i18n/api";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageUsers } from "@/lib/utils";
import { z } from "zod";

const bodySchema = z.object({ cardSlug: z.string().min(1), showInTeamDirectory: z.boolean() });

// PATCH /api/organizations/directory/member — toggle showInTeamDirectory for a member's card
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: await apiMessage("unauthorized") }, { status: 401 });

  const admin = session.user as { id: string; role?: string; organizationId?: string };
  if (!canManageUsers(admin.role ?? "member") || (admin.role !== "super_admin" && !admin.organizationId)) {
    return NextResponse.json({ error: await apiMessage("noPermission") }, { status: 403 });
  }

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: await apiMessage("invalidForm") }, { status: 400 });
  const { cardSlug, showInTeamDirectory } = body.data;

  // Verify the card belongs to a member of the admin's org
  const card = await db.card.findUnique({
    where: { slug: cardSlug },
    include: { user: { select: { organizationId: true } } },
  });

  if (!card) return NextResponse.json({ error: await apiMessage("cardNotFound") }, { status: 404 });

  // Only allow if card owner is in same org (or super_admin)
  if (
    admin.role !== "super_admin" &&
    card.user.organizationId !== admin.organizationId
  ) {
    return NextResponse.json({ error: await apiMessage("noPermission") }, { status: 403 });
  }

  const updated = await db.card.updateMany({
    where: {
      slug: cardSlug,
      ...(admin.role !== "super_admin" && {
        user: { organizationId: admin.organizationId, organization: { isActive: true } },
      }),
    },
    data: { showInTeamDirectory },
  });
  if (!updated.count) return NextResponse.json({ error: await apiMessage("noPermission") }, { status: 403 });

  return NextResponse.json({ success: true, showInTeamDirectory });
}
