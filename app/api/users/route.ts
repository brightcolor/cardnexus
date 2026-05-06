import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageOrganization, isSuperAdmin } from "@/lib/utils";
import { z } from "zod";

const updateSchema = z.object({
  userId: z.string(),
  role: z.enum(["super_admin", "company_admin", "team_leader", "member"]).optional(),
  organizationId: z.string().nullable().optional(),
  name: z.string().optional(),
  plan: z.enum(["free", "pro", "business"]).optional(),
  planExpiresAt: z.string().datetime().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  const orgId = (session.user as { organizationId?: string }).organizationId;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);
  const search = url.searchParams.get("search") ?? "";

  const where = isSuperAdmin(role)
    ? search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] } : {}
    : { organizationId: orgId ?? undefined };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: { card: { select: { slug: true, isPublic: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({ data: users, total, page, limit });
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  if (!canManageOrganization(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { userId, ...data } = parsed.data;

  // Only super_admins can change plans or assign super_admin role
  if (!isSuperAdmin(role)) {
    if (data.role === "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (data.plan !== undefined) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      ...data,
      planExpiresAt: data.planExpiresAt ? new Date(data.planExpiresAt) : data.planExpiresAt,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  if (!canManageOrganization(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await request.json();
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await db.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
