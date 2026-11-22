"use client";

import { translator } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/LocaleProvider";
import de from "@/messages/de/pages/admin-organizations.json";
import it from "@/messages/it/pages/admin-organizations.json";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate, slugify } from "@/lib/utils";
import { Building2, Plus, Users, Pencil, Trash2 } from "lucide-react";

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

interface Member { id: string; name: string; role: string }

export function OrgAdminClient({ orgs: initial }: { orgs: Org[] }) {
  const locale = useLocale();
  const t = translator(locale, de, it);
  const router = useRouter();
  const [orgs, setOrgs] = useState(initial);
  const [open, setOpen] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [slug, setSlugVal] = useState("");
  const [color, setColor] = useState("#0F172A");
  const [domain, setDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Edit state
  const [editOrg, setEditOrg] = useState<Org | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#0F172A");
  const [editDomain, setEditDomain] = useState("");
  const [editAdmin, setEditAdmin] = useState("__none__");
  const [editMembers, setEditMembers] = useState<Member[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Load members when edit dialog opens
  useEffect(() => {
    if (!editOrg) { setEditMembers([]); return; }
    fetch(`/api/users?organizationId=${editOrg.id}&limit=100`)
      .then((r) => r.json())
      .then((j) => {
        const members: Member[] = (j.data ?? []).map((u: { id: string; name: string; role: string }) => ({
          id: u.id, name: u.name, role: u.role,
        }));
        setEditMembers(members);
        const admin = members.find((m) => m.role === "company_admin");
        setEditAdmin(admin?.id ?? "__none__");
      });
  }, [editOrg?.id]);

  function openEdit(org: Org) {
    setEditOrg(org);
    setEditName(org.name);
    setEditColor(org.primaryColor);
    setEditDomain(org.domain ?? "");
    setEditError("");
  }

  async function handleEdit() {
    if (!editOrg) return;
    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch("/api/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editOrg.id, name: editName.trim(), primaryColor: editColor, domain: editDomain.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : t("failure"));

      // Assign admin if changed
      if (editAdmin !== "__none__") {
        const currentAdmin = editMembers.find((m) => m.role === "company_admin");
        if (currentAdmin?.id !== editAdmin) {
          await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: editAdmin, role: "company_admin", organizationId: editOrg.id }),
          });
        }
      }

      setOrgs((prev) => prev.map((o) => o.id === editOrg.id
        ? { ...o, name: editName.trim(), primaryColor: editColor, domain: editDomain.trim() || null }
        : o));
      setEditOrg(null);
      router.refresh();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : t("failure"));
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(org: Org) {
    if (!window.confirm(t("confirmDelete", { name: org.name }))) return;
    const res = await fetch("/api/organizations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: org.id }),
    });
    if (res.ok) {
      setOrgs((prev) => prev.filter((o) => o.id !== org.id));
      router.refresh();
    }
  }

  function handleNameChange(v: string) {
    setName(v);
    setSlugVal(slugify(v));
  }

  async function handleCreate() {
    if (!name.trim()) { setError(t("nameRequired")); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() || slugify(name.trim()), primaryColor: color, domain: domain.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : t("failure"));
      setOrgs((prev) => [{ ...json.data, createdAt: json.data.createdAt, _count: { users: 0 } }, ...prev]);
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failure"));
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
          <h1 className="text-2xl font-bold">{t("organizations")}</h1>
          <p className="text-muted-foreground mt-1">{orgs.length} {t("organizations")}</p>
        </div>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />{t("new")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("create")}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>{t("name")}</Label>
                <Input placeholder="ACME GmbH" value={name} onChange={(e) => handleNameChange(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>{t("slug")}</Label>
                <Input placeholder="acme-gmbh" value={slug} onChange={(e) => setSlugVal(e.target.value)} />
                <p className="text-xs text-muted-foreground">{t("slugHint")}</p>
              </div>
              <div className="space-y-1.5">
                <Label>{t("primaryColor")}</Label>
                <div className="flex items-center gap-3">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 rounded-md border border-input cursor-pointer" />
                  <Input value={color} onChange={(e) => setColor(e.target.value)} className="font-mono w-32" maxLength={7} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("domain")}</Label>
                <Input placeholder="acme.de" value={domain} onChange={(e) => setDomain(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2">{error}</p>}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreate} disabled={saving} className="flex-1">{saving ? t("creating") : t("submitCreate")}</Button>
                <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editOrg} onOpenChange={(v) => { if (!v) setEditOrg(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("editOrganization")}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>{t("name")}</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleEdit()} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>{t("primaryColor")}</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="h-10 w-16 rounded-md border border-input cursor-pointer" />
                <Input value={editColor} onChange={(e) => setEditColor(e.target.value)} className="font-mono w-32" maxLength={7} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("domain")}</Label>
              <Input placeholder="acme.de" value={editDomain} onChange={(e) => setEditDomain(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("administrator")}</Label>
              {editMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("noMembers")}</p>
              ) : (
                <Select value={editAdmin} onValueChange={setEditAdmin}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={t("noAdmin")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("noAdmin")}</SelectItem>
                    {editMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}{m.role === "company_admin" ? " (aktuell)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {editError && <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2">{editError}</p>}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleEdit} disabled={editSaving} className="flex-1">{editSaving ? t("saving") : t("save")}</Button>
              <Button variant="outline" onClick={() => setEditOrg(null)}>{t("cancel")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grid */}
      {orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-border">
          <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">{t("empty")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("start")}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <div key={org.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6 hover:shadow-md transition-shadow">
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
                  {org.domain && <p className="text-xs text-muted-foreground">{org.domain}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {org._count.users} {t("members")}
                  </span>
                  <span>·</span>
                  <span>{formatDate(org.createdAt, locale)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(org)} className="p-1 rounded hover:bg-muted transition-colors hover:text-foreground" title={t("edit")}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(org)} className="p-1 rounded hover:bg-destructive/10 transition-colors hover:text-destructive" title={t("delete")}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {org.settings?.walletEnabled && (
                <Badge variant="success" className="mt-3 text-xs">{t("walletActive")}</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
