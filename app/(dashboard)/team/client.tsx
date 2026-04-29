"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserTable } from "@/components/team/UserTable";
import { InviteModal } from "@/components/team/InviteModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { Role } from "@/types";
import { Search, X, Users } from "lucide-react";

interface Props {
  users: Array<{
    id: string; name: string; email: string; image?: string | null;
    role: string; createdAt: string;
    card?: { slug: string; isPublic: boolean } | null;
  }>;
  invitations: Array<{
    id: string; email: string; role: string;
    createdAt: string; expiresAt: string;
    sender: { name: string };
  }>;
  currentUserId: string;
  currentUserRole: string;
  orgName?: string;
  memberCount: number;
  canManage: boolean;
}

export function TeamClientPage({
  users: initialUsers, invitations: initialInvitations,
  currentUserId, currentUserRole, orgName, memberCount, canManage,
}: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = useCallback(async (userId: string, role: Role) => {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }, []);

  const handleDelete = useCallback(async (userId: string) => {
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const handleRevokeInvitation = useCallback(async (id: string) => {
    await fetch("/api/invitations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground mt-1">
            {orgName ? `${orgName} · ` : ""}{memberCount} Mitglieder
          </p>
        </div>
        {canManage && <InviteModal onInvited={() => router.refresh()} />}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* User table */}
      <UserTable
        users={filtered}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onRoleChange={handleRoleChange}
        onDelete={handleDelete}
      />

      {/* Pending invitations */}
      {canManage && invitations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Offene Einladungen</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-Mail</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rolle</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Eingeladen</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Läuft ab</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{inv.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{inv.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {formatDate(inv.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvitation(inv.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
