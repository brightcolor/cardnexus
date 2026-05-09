import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageUsers } from "@/lib/utils";
import { canUseFeature, effectivePlan } from "@/lib/plans";
import { TeamClientPage } from "./client";
import Link from "next/link";
import { Users, Zap } from "lucide-react";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string; role?: string; organizationId?: string };
  const role = user.role ?? "member";
  const orgId = user.organizationId;

  // super_admin bypasses plan check (platform-level access)
  if (role !== "super_admin") {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { plan: true, planExpiresAt: true },
    });
    const plan = effectivePlan(dbUser?.plan ?? "free", dbUser?.planExpiresAt);
    if (!canUseFeature("teamDirectory", plan)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Team-Verzeichnis</h1>
            <p className="text-muted-foreground max-w-sm">
              Das Team-Verzeichnis ist ab dem <strong>Business-Plan</strong> verfügbar.
              Verwalte Mitglieder, versende Einladungen und behalte den Überblick über dein Team.
            </p>
          </div>
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Zap className="h-4 w-4" />
            Auf Business upgraden
          </Link>
        </div>
      );
    }
  }

  const isApprover = role === "super_admin" || role === "company_admin" || role === "team_leader";

  const [users, invitations, org, pendingCards] = await Promise.all([
    db.user.findMany({
      where: orgId ? { organizationId: orgId } : {},
      include: {
        cards: { orderBy: [{ isDefault: "desc" }], take: 1, select: { slug: true, isPublic: true, showInTeamDirectory: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    canManageUsers(role) && orgId
      ? db.invitation.findMany({
          where: { organizationId: orgId, acceptedAt: null },
          include: { sender: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [],
    orgId
      ? db.organization.findUnique({
          where: { id: orgId },
          select: {
            name: true, slug: true,
            _count: { select: { users: true } },
            settings: { select: { teamDirectoryEnabled: true } },
          },
        })
      : null,
    isApprover && orgId
      ? db.card.findMany({
          where: { approvalStatus: "pending", user: { organizationId: orgId } },
          select: {
            id: true, slug: true, name: true, approvalNote: true, updatedAt: true,
            user: { select: { name: true, email: true } },
          },
          orderBy: { updatedAt: "desc" },
        })
      : [],
  ]);

  return (
    <TeamClientPage
      users={users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        card: u.cards[0] ?? null,
      }))}
      invitations={invitations.map((i) => ({
        ...i,
        expiresAt: i.expiresAt.toISOString(),
        createdAt: i.createdAt.toISOString(),
      }))}
      currentUserId={user.id}
      currentUserRole={role}
      orgName={org?.name}
      orgSlug={org?.slug}
      memberCount={org?._count.users ?? users.length}
      canManage={canManageUsers(role)}
      teamDirectoryEnabled={org?.settings?.teamDirectoryEnabled ?? true}
      pendingCards={(pendingCards as typeof pendingCards).map((c) => ({
        ...c,
        updatedAt: c.updatedAt.toISOString(),
      }))}
    />
  );
}
