"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate, slugify } from "@/lib/utils";
import { Building2, Plus, Users, Pencil } from "lucide-react";

interface Org {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  domain?: string | null;
  createdAt: string;
  _count: { users: number };
  settings?: { walletEnabled: boolean } | null;
}

export function OrgAdminClient({ orgs: initial }: { orgs: Org[] }) {
  const router = useRouter();
  const [orgs, setOrgs] = useState(initial);
  const [open, setOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlugVal] = useState("");
  const [color, setColor] = useState("#0F172A");
  const [domain, setDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(v: string) {
    setName(v);
    setSlugVal(slugify(v));
  }

  async function handleCreate() {
    if (!name.trim()) { setError("Name ist pflicht"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || slugify(name.trim()),
          primaryColor: color,
          domain: domain.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Fehler");

      setOrgs((prev) => [
        { ...json.data, createdAt: json.data.createdAt, _count: { users: 0 } },
        ...prev,
      ]);
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setName(""); setSlugVal(""); setColor("#0F172A"); setDomain(""); setError("");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organisationen</h1>
          <p className="text-muted-foreground mt-1">{orgs.length} Organisationen</p>
        </div>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Neue Organisation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Organisation erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  placeholder="ACME GmbH"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label>Slug (URL-Kürzel)</Label>
                <Input
                  placeholder="acme-gmbh"
                  value={slug}
                  onChange={(e) => setSlugVal(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Wird automatisch aus dem Namen generiert
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Primärfarbe</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-16 rounded-md border border-input cursor-pointer"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="font-mono w-32"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Domain (optional)</Label>
                <Input
                  placeholder="acme.de"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreate} disabled={saving} className="flex-1">
                  {saving ? "Wird erstellt…" : "Erstellen"}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid */}
      {orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-border">
          <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">Noch keine Organisationen</p>
          <p className="text-sm text-muted-foreground mt-1">Erstelle die erste Organisation</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <div
              key={org.id}
              className="bg-white rounded-2xl border border-border p-6 hover:shadow-md transition-shadow"
            >
              {/* Color stripe */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: org.primaryColor }}
                >
                  {org.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm truncate">{org.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">/{org.slug}</p>
                  {org.domain && (
                    <p className="text-xs text-muted-foreground">{org.domain}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {org._count.users} Mitglieder
                </span>
                <span>·</span>
                <span>{formatDate(org.createdAt)}</span>
              </div>

              {org.settings?.walletEnabled && (
                <Badge variant="success" className="mt-3 text-xs">Wallet aktiv</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
