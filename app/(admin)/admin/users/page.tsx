import { db } from "@/lib/db";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminUsersClient } from "./client";

export const metadata = { title: "Benutzer verwalten" };

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUser = session!.user as { id: string; role?: string };

  const users = await db.user.findMany({
    include: {
      card: { select: { slug: true, isPublic: true } },
      organization: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

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
          card: u.card ?? null,
          organization: u.organization ?? null,
        }))}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
