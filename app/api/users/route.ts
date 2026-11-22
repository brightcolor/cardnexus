import { apiMessage, apiProviderError, apiValidation } from "@/lib/i18n/api";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageOrganization, isSuperAdmin } from "@/lib/utils";
import { auditLog } from "@/lib/audit";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const listSchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000),
  limit: z.coerce.number().int().min(1).max(100),
});

const userFields = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  organizationId: true,
  createdAt: true,
} satisfies Prisma.userSelect;

const updateSchema = z.object({
  userId: z.string(),
  role: z.enum(["super_admin", "company_admin", "team_leader", "member"]).optional(),
  organizationId: z.string().nullable().optional(),
  name: z.string().optional(),
  plan: z.enum(["free", "pro", "business"]).optional(),
  planExpiresAt: z.string().datetime().nullable().optional(),
  bannedAt: z.string().datetime().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: await apiMessage("unauthorized") }, { status: 401 });

  const role = session.user.role ?? "member";
  const orgId = session.user.organizationId;
  const superAdmin = isSuperAdmin(role);
  if (!canManageOrganization(role) || (!superAdmin && !orgId)) {
    return NextResponse.json({ error: await apiMessage("forbidden") }, { status: 403 });
  }
  const url = new URL(request.url);
  const pagination = listSchema.safeParse({
    page: url.searchParams.get("page") ?? "1",
    limit: url.searchParams.get("limit") ?? "20",
  });
  if (!pagination.success) {
    return NextResponse.json({ error: await apiValidation(pagination.error) }, { status: 400 });
  }
  const { page, limit } = pagination.data;
  const search = url.searchParams.get("search") ?? "";
  const where = {
    organizationId: superAdmin ? url.searchParams.get("organizationId") || undefined : orgId,
    OR: search ? [{ name: { contains: search } }, { email: { contains: search } }] : undefined,
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        ...userFields,
        plan: superAdmin,
        planExpiresAt: superAdmin,
        bannedAt: superAdmin,
        cards: { orderBy: [{ isDefault: "desc" }], take: 1, select: { slug: true, isPublic: true } },
      },
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
  if (!session) return NextResponse.json({ error: await apiMessage("unauthorized") }, { status: 401 });

  const role = session.user.role ?? "member";
  const orgId = session.user.organizationId;
  if (!canManageOrganization(role) || (!isSuperAdmin(role) && !orgId)) {
    return NextResponse.json({ error: await apiMessage("forbidden") }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: await apiValidation(parsed.error) }, { status: 400 });
  }

  const { userId, ...data } = parsed.data;

  // Only super_admins can change plans, assign super_admin role, or ban users
  if (!isSuperAdmin(role)) {
    if (data.role === "super_admin") return NextResponse.json({ error: await apiMessage("forbidden") }, { status: 403 });
    if (data.plan !== undefined || data.planExpiresAt !== undefined) return NextResponse.json({ error: await apiMessage("forbidden") }, { status: 403 });
    if (data.bannedAt !== undefined) return NextResponse.json({ error: await apiMessage("forbidden") }, { status: 403 });
    // company_admin must not be able to grant company_admin to others (only super_admin can).
    if (data.role === "company_admin") return NextResponse.json({ error: await apiMessage("forbidden") }, { status: 403 });
    // company_admin cannot move users between orgs.
    if (data.organizationId !== undefined) {
      return NextResponse.json({ error: await apiMessage("forbidden") }, { status: 403 });
    }
  }

  // SECURITY: company_admin must only be able to mutate users from THEIR org.
  // Without this check, anybody with company_admin role could update arbitrary users.
  if (!isSuperAdmin(role)) {
    const target = await db.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });
    if (!target) return NextResponse.json({ error: await apiMessage("notFound") }, { status: 404 });
    if (target.organizationId !== orgId) {
      return NextResponse.json({ error: await apiMessage("forbidden") }, { status: 403 });
    }
    // Cannot demote/modify a super_admin.
    if (target.role === "super_admin") {
      return NextResponse.json({ error: await apiMessage("forbidden") }, { status: 403 });
    }
  }

  const updated = await db.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: isSuperAdmin(role) ? { id: userId } : { id: userId, organizationId: orgId, NOT: { role: "super_admin" } },
      data: {
        ...data,
        planExpiresAt: data.planExpiresAt ? new Date(data.planExpiresAt) : data.planExpiresAt,
        bannedAt: data.bannedAt ? new Date(data.bannedAt) : data.bannedAt,
      },
      select: { ...userFields, plan: isSuperAdmin(role), planExpiresAt: isSuperAdmin(role), bannedAt: isSuperAdmin(role) },
    });
    if (data.bannedAt) await tx.session.deleteMany({ where: { userId } });
    return user;
  }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null;
    throw error;
  });
  if (!updated) return NextResponse.json({ error: await apiMessage("notFound") }, { status: 404 });

  // Immediately kill all active sessions when banning a user
  if (data.bannedAt) {
    auditLog("user.ban", session.user.id, { targetId: userId });
  }
  if (data.bannedAt === null) {
    auditLog("user.unban", session.user.id, { targetId: userId });
  }
  if (data.role) {
    auditLog("user.role_change", session.user.id, { targetId: userId, newRole: data.role });
  }
  if (data.plan) {
    auditLog("user.plan_change", session.user.id, { targetId: userId, newPlan: data.plan });
  }
  if (data.organizationId !== undefined) {
    auditLog("user.org_change", session.user.id, { targetId: userId, newOrgId: data.organizationId });
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: await apiMessage("unauthorized") }, { status: 401 });

  const role = session.user.role ?? "member";
  const orgId = session.user.organizationId;
  if (!canManageOrganization(role) || (!isSuperAdmin(role) && !orgId)) {
    return NextResponse.json({ error: await apiMessage("forbidden") }, { status: 403 });
  }

  const body = z.object({ userId: z.string().min(1) }).safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: await apiValidation(body.error) }, { status: 400 });
  const { userId } = body.data;
  if (userId === session.user.id) {
    return NextResponse.json({ error: await apiMessage("cannotDeleteSelf") }, { status: 400 });
  }

  // SECURITY: company_admin only allowed to delete users from THEIR org.
  if (!isSuperAdmin(role)) {
    const target = await db.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });
    if (!target) return NextResponse.json({ error: await apiMessage("notFound") }, { status: 404 });
    if (target.organizationId !== orgId) {
      return NextResponse.json({ error: await apiMessage("forbidden") }, { status: 403 });
    }
    if (target.role === "super_admin") {
      return NextResponse.json({ error: await apiMessage("forbidden") }, { status: 403 });
    }
  }

  // Fetch name/email before delete for the audit record
  const target = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  try {
    await db.user.delete({
      where: isSuperAdmin(role) ? { id: userId } : { id: userId, organizationId: orgId, NOT: { role: "super_admin" } },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: await apiMessage("notFound") }, { status: 404 });
    }
    console.error("[DELETE /api/users] db.user.delete failed:", e);
    return NextResponse.json(
      { error: await apiProviderError(e instanceof Error ? e.message : String(e), "serverError") },
      { status: 500 }
    );
  }

  auditLog("user.delete", session.user.id, {
    targetId: userId,
    targetEmail: target?.email,
    targetName: target?.name,
  });

  return NextResponse.json({ ok: true });
}
