import { db } from "@/lib/db";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminUsersClient } from "./client";

export const metadata = { title: "Benutzer verwalten" };

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUser = session!.user as { id: string; role?: string };

  const [users, orgs] = await Promise.all([
    db.user.findMany({
      include: {
        cards: { orderBy: [{ isDefault: "desc" }], take: 1, select: { slug: true, isPublic: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.organization.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alle Benutzer</h1>
        <p className="text-muted-foreground mt-1">{users.length} Benutzer auf der Plattform</p>
      </div>
      <AdminUsersClient
        users={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          planExpiresAt: u.planExpiresAt?.toISOString() ?? null,
          cards: u.cards ?? [],
          organization: u.organization ?? null,
        }))}
        orgs={orgs}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
