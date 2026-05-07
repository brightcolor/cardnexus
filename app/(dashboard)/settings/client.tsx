"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getRoleLabel, canManageOrganization } from "@/lib/utils";
import { Save, Wallet } from "lucide-react";
import type { DeptPolicyOverride } from "@/types";
import {
  OrgInfoCard, DesignDefaultsCard, BrandColorsCard,
  PermissionsCard, DeptPoliciesCard, TemplateCardSection,
} from "./OrgSettingsCards";
import { SecurityCard } from "@/components/settings/SecurityCard";
import { AccountActions } from "@/components/settings/AccountActions";
import { WebhooksCard, ApiKeysCard, ReferralsCard } from "@/components/settings/IntegrationsCards";

interface OrgSettings {
  defaultTemplate: string; defaultFontFamily: string; defaultLayoutStyle: string;
  defaultAccentColor?: string | null; allowMemberTemplateChange: boolean;
  allowMemberColorChange: boolean; allowMemberFontChange: boolean;
  allowMemberLayoutChange: boolean; analyticsEnabled: boolean;
  cardFooterText?: string | null; brandColors?: string | null;
  departmentPolicies?: string | null; templateCardData?: string | null;
}

interface Props {
  user: {
    id: string; name: string; email: string; role: string;
    organizationId?: string | null; twoFactorEnabled: boolean;
  };
  org: { id: string; name: string; slug: string; primaryColor: string; settings?: OrgSettings | null } | null;
}

interface DeptRow { name: string; policy: DeptPolicyOverride }

function parseJson<T>(val: string | null | undefined, fallback: T): T {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

export function SettingsClientPage({ user, org }: Props) {
  const [orgName, setOrgName]   = useState(org?.name ?? "");
  const [orgColor, setOrgColor] = useState(org?.primaryColor ?? "#0F172A");

  const [defaultTemplate, setDefaultTemplate] = useState(org?.settings?.defaultTemplate ?? "classic");
  const [defaultFont, setDefaultFont]         = useState(org?.settings?.defaultFontFamily ?? "inter");
  const [defaultLayout, setDefaultLayout]     = useState(org?.settings?.defaultLayoutStyle ?? "standard");
  const [defaultAccent, setDefaultAccent]     = useState(org?.settings?.defaultAccentColor ?? "");

  const [allowTemplateChange, setAllowTemplateChange] = useState(org?.settings?.allowMemberTemplateChange ?? true);
  const [allowColorChange, setAllowColorChange]       = useState(org?.settings?.allowMemberColorChange ?? false);
  const [allowFontChange, setAllowFontChange]         = useState(org?.settings?.allowMemberFontChange ?? true);
  const [allowLayoutChange, setAllowLayoutChange]     = useState(org?.settings?.allowMemberLayoutChange ?? true);
  const [analyticsEnabled, setAnalyticsEnabled]       = useState(org?.settings?.analyticsEnabled ?? true);

  const [brandColors, setBrandColors] = useState<string[]>(() => parseJson(org?.settings?.brandColors, []));
  const [newColor, setNewColor]       = useState("#0F172A");

  const [deptRows, setDeptRows]     = useState<DeptRow[]>(() => {
    const raw: Record<string, DeptPolicyOverride> = parseJson(org?.settings?.departmentPolicies, {});
    return Object.entries(raw).map(([name, policy]) => ({ name, policy }));
  });
  const [newDeptName, setNewDeptName] = useState("");

  const templateData = parseJson(org?.settings?.templateCardData, {} as Record<string, string>);
  const [templateCompany, setTemplateCompany] = useState(templateData.company ?? "");
  const [templateColor, setTemplateColor]     = useState(templateData.primaryColor ?? "#0F172A");
  const [templateId, setTemplateId]           = useState(templateData.templateId ?? "classic");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const [newEmail, setNewEmail]     = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError]   = useState("");
  const [emailSaved, setEmailSaved]   = useState(false);

  const canManageOrg = canManageOrganization(user.role);

  async function saveEmail() {
    if (!newEmail || newEmail === user.email) return;
    setEmailSaving(true); setEmailError("");
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail }),
    });
    const data = await res.json();
    if (!res.ok) { setEmailError(data.error ?? "Fehler"); }
    else { setEmailSaved(true); setTimeout(() => setEmailSaved(false), 3000); setNewEmail(""); }
    setEmailSaving(false);
  }

  async function saveOrgSettings() {
    setSaving(true);
    const deptPolicies: Record<string, DeptPolicyOverride> = Object.fromEntries(
      deptRows.map(({ name, policy }) => [name, policy])
    );
    await fetch("/api/organizations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: orgName, primaryColor: orgColor,
        settings: {
          defaultTemplate, defaultFontFamily: defaultFont,
          defaultLayoutStyle: defaultLayout, defaultAccentColor: defaultAccent || null,
          allowMemberTemplateChange: allowTemplateChange, allowMemberColorChange: allowColorChange,
          allowMemberFontChange: allowFontChange, allowMemberLayoutChange: allowLayoutChange,
          analyticsEnabled,
          brandColors: brandColors.length > 0 ? JSON.stringify(brandColors) : null,
          departmentPolicies: deptRows.length > 0 ? JSON.stringify(deptPolicies) : null,
          templateCardData: JSON.stringify({ company: templateCompany || null, primaryColor: templateColor, templateId }),
        },
      }),
    });
    setSaving(false); setSaved(true);
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
        <CardContent>
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge className="ml-auto" variant="secondary">{getRoleLabel(user.role)}</Badge>
          </div>
          <div className="border-t border-border pt-4 mt-4 space-y-3">
            <p className="text-sm font-medium">E-Mail-Adresse ändern</p>
            <div className="flex gap-2">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={user.email}
                className="flex-1"
              />
              <Button size="sm" onClick={saveEmail} disabled={emailSaving || !newEmail}>
                {emailSaving ? "…" : emailSaved ? "✓" : "Speichern"}
              </Button>
            </div>
            {emailError && <p className="text-xs text-destructive">{emailError}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <SecurityCard twoFactorEnabled={user.twoFactorEnabled} />

      {/* Account actions (password, delete, export) */}
      <AccountActions />

      {/* Integrations */}
      <WebhooksCard />
      <ApiKeysCard />
      <ReferralsCard />

      {/* Organisation */}
      {org && canManageOrg && (
        <>
          <OrgInfoCard orgName={orgName} setOrgName={setOrgName} orgColor={orgColor} setOrgColor={setOrgColor} orgDisplayName={org.name} />
          <DesignDefaultsCard
            defaultTemplate={defaultTemplate} setDefaultTemplate={setDefaultTemplate}
            defaultFont={defaultFont} setDefaultFont={setDefaultFont}
            defaultLayout={defaultLayout} setDefaultLayout={setDefaultLayout}
            defaultAccent={defaultAccent} setDefaultAccent={setDefaultAccent}
            orgColor={orgColor}
          />
          <BrandColorsCard
            brandColors={brandColors} newColor={newColor} setNewColor={setNewColor}
            onAdd={() => { if (!brandColors.includes(newColor)) setBrandColors([...brandColors, newColor]); }}
            onRemove={(c) => setBrandColors(brandColors.filter((x) => x !== c))}
          />
          <PermissionsCard
            allowTemplateChange={allowTemplateChange} setAllowTemplateChange={setAllowTemplateChange}
            allowColorChange={allowColorChange} setAllowColorChange={setAllowColorChange}
            allowFontChange={allowFontChange} setAllowFontChange={setAllowFontChange}
            allowLayoutChange={allowLayoutChange} setAllowLayoutChange={setAllowLayoutChange}
            analyticsEnabled={analyticsEnabled} setAnalyticsEnabled={setAnalyticsEnabled}
          />
          <DeptPoliciesCard
            deptRows={deptRows} newDeptName={newDeptName} setNewDeptName={setNewDeptName}
            onAdd={() => {
              const name = newDeptName.trim();
              if (!name || deptRows.find((r) => r.name === name)) return;
              setDeptRows([...deptRows, { name, policy: { allowTemplateChange, allowColorChange, allowFontChange, allowLayoutChange } }]);
              setNewDeptName("");
            }}
            onRemove={(name) => setDeptRows(deptRows.filter((r) => r.name !== name))}
            onUpdatePolicy={(name, key, v) =>
              setDeptRows(deptRows.map((r) => r.name === name ? { ...r, policy: { ...r.policy, [key]: v } } : r))
            }
          />
          <TemplateCardSection
            templateCompany={templateCompany} setTemplateCompany={setTemplateCompany}
            templateColor={templateColor} setTemplateColor={setTemplateColor}
            templateId={templateId} setTemplateId={setTemplateId}
            orgName={orgName}
          />
          <Button onClick={saveOrgSettings} disabled={saving}>
            <Save className="h-4 w-4" />
            {saved ? "Gespeichert!" : saving ? "Wird gespeichert…" : "Einstellungen speichern"}
          </Button>
        </>
      )}

      {/* Wallet (coming soon) */}
      <Card className="border-dashed opacity-60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Apple & Google Wallet</CardTitle>
            <Badge variant="outline" className="ml-auto">Demnächst</Badge>
          </div>
          <CardDescription>Karten direkt in Apple Wallet oder Google Wallet speichern. Diese Funktion wird bald verfügbar sein.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
