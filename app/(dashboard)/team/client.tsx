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
import {
  Search, X, Globe, Eye, EyeOff, ExternalLink, ToggleLeft, ToggleRight,
} from "lucide-react";

interface Member {
  id: string; name: string; email: string; image?: string | null;
  role: string; createdAt: string;
  card?: { slug: string; isPublic: boolean; showInTeamDirectory: boolean } | null;
}

interface Props {
  users: Member[];
  invitations: Array<{
    id: string; email: string; role: string;
    createdAt: string; expiresAt: string;
    sender: { name: string };
  }>;
  currentUserId: string;
  currentUserRole: string;
  orgName?: string;
  orgSlug?: string;
  memberCount: number;
  canManage: boolean;
  teamDirectoryEnabled: boolean;
}

export function TeamClientPage({
  users: initialUsers, invitations: initialInvitations,
  currentUserId, currentUserRole, orgName, orgSlug,
  memberCount, canManage, teamDirectoryEnabled: initialDirEnabled,
}: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [search, setSearch] = useState("");
  const [dirEnabled, setDirEnabled] = useState(initialDirEnabled);
  const [togglingDir, setTogglingDir] = useState(false);
  const [togglingMember, setTogglingMember] = useState<string | null>(null);

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

  async function toggleDirectory() {
    setTogglingDir(true);
    try {
      const res = await fetch("/api/organizations/directory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !dirEnabled }),
      });
      if (res.ok) setDirEnabled((v) => !v);
    } finally {
      setTogglingDir(false);
    }
  }

  async function toggleMemberVisibility(userId: string, cardSlug: string, current: boolean) {
    setTogglingMember(userId);
    try {
      const res = await fetch("/api/organizations/directory/member", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardSlug, showInTeamDirectory: !current }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId && u.card
              ? { ...u, card: { ...u.card, showInTeamDirectory: !current } }
              : u
          )
        );
      }
    } finally {
      setTogglingMember(null);
    }
  }

  const dirUrl = orgSlug ? `/team/${orgSlug}` : null;

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

      {/* Team Directory Panel (only for orgs) */}
      {orgSlug && (
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Öffentliches Team-Verzeichnis</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dirEnabled
                  ? "Aktiv — alle Mitglieder mit öffentlicher Karte sind sichtbar"
                  : "Deaktiviert — das Verzeichnis ist nicht öffentlich erreichbar"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {dirUrl && dirEnabled && (
              <a
                href={dirUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ansehen
              </a>
            )}
            {canManage && (
              <button
                onClick={toggleDirectory}
                disabled={togglingDir}
                className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: dirEnabled ? "var(--primary)" : "var(--muted-foreground)" }}
              >
                {dirEnabled
                  ? <ToggleRight className="h-6 w-6" />
                  : <ToggleLeft className="h-6 w-6" />}
                {dirEnabled ? "Aktiv" : "Inaktiv"}
              </button>
            )}
          </div>
        </div>
      )}

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

      {/* User table with directory visibility */}
      {orgSlug && canManage ? (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mitglied</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Rolle</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Karte</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Im Verzeichnis</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant="secondary">{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.card ? (
                      <a href={`/c/${u.card.slug}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ExternalLink className="h-3 w-3" />
                        {u.card.slug}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">Keine Karte</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.card ? (
                      <button
                        onClick={() => toggleMemberVisibility(u.id, u.card!.slug, u.card!.showInTeamDirectory)}
                        disabled={togglingMember === u.id}
                        className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-70"
                        style={{ color: u.card.showInTeamDirectory ? "var(--primary)" : "var(--muted-foreground)" }}
                        title={u.card.showInTeamDirectory ? "Aus Verzeichnis entfernen" : "Im Verzeichnis anzeigen"}
                      >
                        {u.card.showInTeamDirectory
                          ? <><Eye className="h-4 w-4" /> Sichtbar</>
                          : <><EyeOff className="h-4 w-4" /> Versteckt</>}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {/* existing role/delete actions via UserTable aren't shown here;
                        for simplicity show delete only */}
                    {currentUserRole === "super_admin" || (canManage && u.id !== currentUserId) ? (
                      <Button
                        variant="ghost" size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(u.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <UserTable
          users={filtered}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onRoleChange={handleRoleChange}
          onDelete={handleDelete}
        />
      )}

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
                        variant="ghost" size="sm"
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
