"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInitials, getRoleLabel, formatDate } from "@/lib/utils";
import { Search, Pencil, CalendarDays, X } from "lucide-react";
import Link from "next/link";

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline" | "warning"> = {
  super_admin: "default",
  company_admin: "warning",
  team_leader: "secondary",
  member: "outline",
};

const PLAN_VARIANT: Record<string, string> = {
  free:     "bg-gray-100 text-gray-600",
  pro:      "bg-blue-100 text-blue-700",
  business: "bg-amber-100 text-amber-700",
};

interface AdminUser {
  id: string; name: string; email: string; image?: string | null;
  role: string; plan: string; planExpiresAt?: string | null; createdAt: string;
  cards?: { slug: string; isPublic: boolean }[] | null;
  organization?: { id: string; name: string } | null;
}

interface OrgOption { id: string; name: string }

export function AdminUsersClient({ users: initial, orgs, currentUserId }: { users: AdminUser[]; orgs: OrgOption[]; currentUserId: string }) {
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState("");
  const [expiryEdit, setExpiryEdit] = useState<string | null>(null); // userId being edited

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function patch(userId: string, data: Record<string, unknown>) {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...data }),
    });
    return res.ok;
  }

  async function changeRole(userId: string, role: string) {
    if (!await patch(userId, { role })) return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }

  async function changePlan(userId: string, plan: string) {
    if (!await patch(userId, { plan, planExpiresAt: null })) return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, plan, planExpiresAt: null } : u)));
  }

  async function changeOrg(userId: string, orgId: string) {
    const organizationId = orgId === "__none__" ? null : orgId;
    if (!await patch(userId, { organizationId })) return;
    const org = orgs.find((o) => o.id === orgId) ?? null;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, organization: org } : u)));
  }

  async function setExpiry(userId: string, dateStr: string) {
    const planExpiresAt = dateStr ? new Date(dateStr).toISOString() : null;
    if (!await patch(userId, { planExpiresAt })) return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, planExpiresAt } : u)));
    setExpiryEdit(null);
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Suchen…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-xl border border-border overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border !bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Benutzer</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Organisation</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rolle</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Karte</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Seit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:!bg-muted/20">
                {/* User */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image ?? undefined} />
                      <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.name}{" "}
                        {user.id === currentUserId && <span className="text-muted-foreground text-xs">(Ich)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>

                {/* Org */}
                <td className="px-4 py-3 hidden md:table-cell">
                  <Select value={user.organization?.id ?? "__none__"} onValueChange={(v) => changeOrg(user.id, v)}>
                    <SelectTrigger className="h-7 w-40 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Keine —</SelectItem>
                      {orgs.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>

                {/* Role */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <Select value={user.role} onValueChange={(v) => changeRole(user.id, v)}>
                    <SelectTrigger className="h-7 w-auto min-w-[7rem] max-w-[10rem] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="company_admin">Admin</SelectItem>
                      <SelectItem value="team_leader">Team Leader</SelectItem>
                      <SelectItem value="member">Mitglied</SelectItem>
                    </SelectContent>
                  </Select>
                </td>

                {/* Plan */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Select value={user.plan} onValueChange={(v) => changePlan(user.id, v)}>
                      <SelectTrigger className="h-7 w-24 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${PLAN_VARIANT[user.plan]?.split(" ")[0] ?? "bg-gray-400"}`} />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Expiry */}
                    {user.plan !== "free" && (
                      expiryEdit === user.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            className="h-7 text-xs border border-border rounded px-1.5 bg-background"
                            defaultValue={user.planExpiresAt ? user.planExpiresAt.split("T")[0] : ""}
                            onBlur={(e) => setExpiry(user.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setExpiry(user.id, (e.target as HTMLInputElement).value);
                              if (e.key === "Escape") setExpiryEdit(null);
                            }}
                            autoFocus
                          />
                          <button onClick={() => setExpiryEdit(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setExpiryEdit(user.id)}
                          className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          title="Ablaufdatum setzen"
                        >
                          <CalendarDays className="h-3 w-3" />
                          {user.planExpiresAt
                            ? new Date(user.planExpiresAt).toLocaleDateString("de-DE")
                            : <span className="opacity-50">&#8734;</span>}
                        </button>
                      )
                    )}
                  </div>
                </td>

                {/* Card */}
                <td className="px-4 py-3 hidden lg:table-cell">
                  {user.cards?.[0] ? (
                    <div className="flex items-center gap-2">
                      <a href={`/c/${user.cards[0].slug}`} target="_blank" className="text-xs text-primary hover:underline">
                        {user.cards[0].slug}
                      </a>
                      <Link href={`/admin/cards/${user.cards[0].slug}`} className="text-muted-foreground hover:text-foreground" title="Karte bearbeiten">
                        <Pencil className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : <span className="text-muted-foreground text-xs">—</span>}
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell whitespace-nowrap">
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
