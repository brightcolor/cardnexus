"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getRoleLabel, canManageOrganization } from "@/lib/utils";
import { Save, Wallet, Plus, Trash2, Palette, LayoutTemplate, Type, Users } from "lucide-react";
import type { DeptPolicyOverride } from "@/types";

interface OrgSettings {
  defaultTemplate: string;
  defaultFontFamily: string;
  defaultLayoutStyle: string;
  defaultAccentColor?: string | null;
  allowMemberTemplateChange: boolean;
  allowMemberColorChange: boolean;
  allowMemberFontChange: boolean;
  allowMemberLayoutChange: boolean;
  analyticsEnabled: boolean;
  cardFooterText?: string | null;
  brandColors?: string | null;
  departmentPolicies?: string | null;
}

interface Props {
  user: { id: string; name: string; email: string; role: string; organizationId?: string | null };
  org: {
    id: string; name: string; slug: string; primaryColor: string;
    settings?: OrgSettings | null;
  } | null;
}

interface DeptRow {
  name: string;
  policy: DeptPolicyOverride;
}

export function SettingsClientPage({ user, org }: Props) {
  const [orgName, setOrgName] = useState(org?.name ?? "");
  const [orgColor, setOrgColor] = useState(org?.primaryColor ?? "#0F172A");

  // Design defaults
  const [defaultTemplate, setDefaultTemplate] = useState(org?.settings?.defaultTemplate ?? "classic");
  const [defaultFont, setDefaultFont] = useState(org?.settings?.defaultFontFamily ?? "inter");
  const [defaultLayout, setDefaultLayout] = useState(org?.settings?.defaultLayoutStyle ?? "standard");
  const [defaultAccent, setDefaultAccent] = useState(org?.settings?.defaultAccentColor ?? "");

  // Permissions
  const [allowTemplateChange, setAllowTemplateChange] = useState(org?.settings?.allowMemberTemplateChange ?? true);
  const [allowColorChange, setAllowColorChange] = useState(org?.settings?.allowMemberColorChange ?? false);
  const [allowFontChange, setAllowFontChange] = useState(org?.settings?.allowMemberFontChange ?? true);
  const [allowLayoutChange, setAllowLayoutChange] = useState(org?.settings?.allowMemberLayoutChange ?? true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(org?.settings?.analyticsEnabled ?? true);

  // Brand colors palette
  const [brandColors, setBrandColors] = useState<string[]>(() => {
    try { return org?.settings?.brandColors ? JSON.parse(org.settings.brandColors) : []; }
    catch { return []; }
  });
  const [newColor, setNewColor] = useState("#0F172A");

  // Department policies
  const [deptRows, setDeptRows] = useState<DeptRow[]>(() => {
    try {
      const raw: Record<string, DeptPolicyOverride> = org?.settings?.departmentPolicies
        ? JSON.parse(org.settings.departmentPolicies)
        : {};
      return Object.entries(raw).map(([name, policy]) => ({ name, policy }));
    } catch { return []; }
  });
  const [newDeptName, setNewDeptName] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const canManageOrg = canManageOrganization(user.role);

  function addBrandColor() {
    if (!brandColors.includes(newColor)) setBrandColors([...brandColors, newColor]);
  }

  function removeBrandColor(c: string) {
    setBrandColors(brandColors.filter((x) => x !== c));
  }

  function addDeptRow() {
    const name = newDeptName.trim();
    if (!name || deptRows.find((r) => r.name === name)) return;
    setDeptRows([...deptRows, {
      name,
      policy: {
        allowTemplateChange: allowTemplateChange,
        allowColorChange: allowColorChange,
        allowFontChange: allowFontChange,
        allowLayoutChange: allowLayoutChange,
      },
    }]);
    setNewDeptName("");
  }

  function removeDeptRow(name: string) {
    setDeptRows(deptRows.filter((r) => r.name !== name));
  }

  function updateDeptPolicy(name: string, key: keyof DeptPolicyOverride, value: boolean) {
    setDeptRows(deptRows.map((r) =>
      r.name === name ? { ...r, policy: { ...r.policy, [key]: value } } : r
    ));
  }

  async function saveOrgSettings() {
    setSaving(true);
    const deptPolicies: Record<string, DeptPolicyOverride> = {};
    deptRows.forEach(({ name, policy }) => { deptPolicies[name] = policy; });

    await fetch("/api/organizations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: orgName,
        primaryColor: orgColor,
        settings: {
          defaultTemplate,
          defaultFontFamily: defaultFont,
          defaultLayoutStyle: defaultLayout,
          defaultAccentColor: defaultAccent || null,
          allowMemberTemplateChange: allowTemplateChange,
          allowMemberColorChange: allowColorChange,
          allowMemberFontChange: allowFontChange,
          allowMemberLayoutChange: allowLayoutChange,
          analyticsEnabled,
          brandColors: brandColors.length > 0 ? JSON.stringify(brandColors) : null,
          departmentPolicies: deptRows.length > 0 ? JSON.stringify(deptPolicies) : null,
        },
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">Account und Organisations-Einstellungen</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Deine persönlichen Informationen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge className="ml-auto" variant="secondary">{getRoleLabel(user.role)}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Organization settings */}
      {org && canManageOrg && (
        <>
          {/* Basic org info */}
          <Card>
            <CardHeader>
              <CardTitle>Organisation</CardTitle>
              <CardDescription>Grundlegende Informationen zu {org.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Organisationsname</Label>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Primärfarbe</Label>
                <div className="flex items-center gap-3">
                  <input type="color" value={orgColor} onChange={(e) => setOrgColor(e.target.value)}
                    className="h-10 w-16 rounded-md border border-input cursor-pointer" />
                  <Input value={orgColor} onChange={(e) => setOrgColor(e.target.value)} className="font-mono w-32" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Design defaults */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Design-Vorgaben</CardTitle>
              </div>
              <CardDescription>
                Diese Werte werden für neue Mitglieder-Karten als Standard gesetzt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Standard-Template</Label>
                  <Select value={defaultTemplate} onValueChange={setDefaultTemplate}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Standard-Schrift</Label>
                  <Select value={defaultFont} onValueChange={setDefaultFont}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inter">Inter (Sans-serif)</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="mono">Mono</SelectItem>
                      <SelectItem value="display">Display</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Standard-Layout</Label>
                  <Select value={defaultLayout} onValueChange={setDefaultLayout}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="centered">Zentriert</SelectItem>
                      <SelectItem value="compact">Kompakt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Standard-Akzentfarbe <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={defaultAccent || orgColor}
                      onChange={(e) => setDefaultAccent(e.target.value)}
                      className="h-9 w-12 rounded border border-input cursor-pointer" />
                    <Input value={defaultAccent} onChange={(e) => setDefaultAccent(e.target.value)}
                      placeholder="wie Primär" className="font-mono" maxLength={7} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brand color palette */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Markenfarben-Palette</CardTitle>
              </div>
              <CardDescription>
                Diese Farben stehen Mitgliedern zur schnellen Auswahl bereit. Leer = freie Farbwahl.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {brandColors.map((c) => (
                  <div key={c} className="group relative">
                    <div
                      className="h-10 w-10 rounded-lg border-2 border-border cursor-pointer"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                    <button
                      type="button"
                      onClick={() => removeBrandColor(c)}
                      className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
                  className="h-9 w-12 rounded border border-input cursor-pointer" />
                <Input value={newColor} onChange={(e) => setNewColor(e.target.value)}
                  className="font-mono w-28" maxLength={7} />
                <Button type="button" variant="outline" size="sm" onClick={addBrandColor}>
                  <Plus className="h-4 w-4" /> Hinzufügen
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Global permissions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Globale Berechtigungen</CardTitle>
              </div>
              <CardDescription>
                Legen Sie fest, was Mitglieder standardmäßig anpassen dürfen.
                Abteilungsregeln unten können diese Werte überschreiben.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Template-Wahl", sub: "Mitglieder können ihr eigenes Template wählen", val: allowTemplateChange, set: setAllowTemplateChange },
                { label: "Farbwahl", sub: "Mitglieder können Primärfarbe anpassen", val: allowColorChange, set: setAllowColorChange },
                { label: "Schriftwahl", sub: "Mitglieder können die Schriftart wählen", val: allowFontChange, set: setAllowFontChange },
                { label: "Layout-Wahl", sub: "Mitglieder können das Layout wählen", val: allowLayoutChange, set: setAllowLayoutChange },
                { label: "Analytics", sub: "Aufrufe und Klicks erfassen", val: analyticsEnabled, set: setAnalyticsEnabled },
              ].map(({ label, sub, val, set }) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                  <Switch checked={val} onCheckedChange={set} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Department policies */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Abteilungsregeln</CardTitle>
              </div>
              <CardDescription>
                Überschreiben Sie die globalen Berechtigungen für einzelne Abteilungen.
                Der Abteilungsname muss exakt mit dem Feld "Abteilung" der Mitgliedskarte übereinstimmen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deptRows.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-3 py-2">Abteilung</th>
                        <th className="text-center px-2 py-2">Template</th>
                        <th className="text-center px-2 py-2">Farbe</th>
                        <th className="text-center px-2 py-2">Schrift</th>
                        <th className="text-center px-2 py-2">Layout</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {deptRows.map(({ name, policy }) => (
                        <tr key={name} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium">{name}</td>
                          {(["allowTemplateChange", "allowColorChange", "allowFontChange", "allowLayoutChange"] as const).map((k) => (
                            <td key={k} className="text-center px-2 py-2">
                              <Switch
                                checked={policy[k] ?? true}
                                onCheckedChange={(v) => updateDeptPolicy(name, k, v)}
                              />
                            </td>
                          ))}
                          <td className="px-2 py-2">
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeDeptRow(name)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add department */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Abteilungsname z.B. Marketing"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addDeptRow()}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addDeptRow}>
                  <Plus className="h-4 w-4" /> Hinzufügen
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Neue Abteilungen erben die globalen Berechtigungen oben als Startwert.
              </p>
            </CardContent>
          </Card>

          <Button onClick={saveOrgSettings} disabled={saving}>
            <Save className="h-4 w-4" />
            {saved ? "Gespeichert!" : saving ? "Wird gespeichert…" : "Einstellungen speichern"}
          </Button>
        </>
      )}

      {/* Wallet (disabled) */}
      <Card className="border-dashed opacity-60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Apple & Google Wallet</CardTitle>
            <Badge variant="outline" className="ml-auto">Demnächst</Badge>
          </div>
          <CardDescription>
            Karten direkt in Apple Wallet oder Google Wallet speichern.
            Diese Funktion wird bald verfügbar sein.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
