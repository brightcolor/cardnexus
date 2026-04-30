import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageUsers } from "@/lib/utils";
import { TeamClientPage } from "./client";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string; role?: string; organizationId?: string };
  const role = user.role ?? "member";

  const orgId = user.organizationId;

  const [users, invitations, org] = await Promise.all([
    db.user.findMany({
      where: orgId ? { organizationId: orgId } : {},
      include: {
        card: { select: { slug: true, isPublic: true, showInTeamDirectory: true } },
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
  ]);

  return (
    <TeamClientPage
      users={users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        card: u.card ?? null,
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
    />
  );
}
