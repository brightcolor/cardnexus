"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInitials, getRoleLabel, formatDate } from "@/lib/utils";
import { Search, Pencil } from "lucide-react";
import Link from "next/link";
import type { Role } from "@/types";

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline" | "warning"> = {
  super_admin: "default",
  company_admin: "warning",
  team_leader: "secondary",
  member: "outline",
};

interface AdminUser {
  id: string; name: string; email: string; image?: string | null;
  role: string; createdAt: string;
  card?: { slug: string; isPublic: boolean } | null;
  organization?: { name: string } | null;
}

export function AdminUsersClient({ users: initial, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function changeRole(userId: string, role: string) {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Suchen…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Benutzer</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Organisation</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rolle</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Karte</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Seit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image ?? undefined} />
                      <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name} {user.id === currentUserId && <span className="text-muted-foreground text-xs">(Ich)</span>}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {user.organization?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {user.id !== currentUserId ? (
                    <Select value={user.role} onValueChange={(v) => changeRole(user.id, v)}>
                      <SelectTrigger className="h-7 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="company_admin">Admin</SelectItem>
                        <SelectItem value="team_leader">Team Leader</SelectItem>
                        <SelectItem value="member">Mitglied</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={ROLE_VARIANT[user.role] ?? "outline"}>{getRoleLabel(user.role)}</Badge>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {user.card ? (
                    <div className="flex items-center gap-2">
                      <a href={`/c/${user.card.slug}`} target="_blank" className="text-xs text-primary hover:underline">
                        {user.card.slug}
                      </a>
                      <Link
                        href={`/admin/cards/${user.card.slug}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        title="Karte bearbeiten"
                      >
                        <Pencil className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : <span className="text-muted-foreground text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                  {formatDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
