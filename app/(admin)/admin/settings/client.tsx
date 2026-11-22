"use client";

import { translator } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/LocaleProvider";
import de from "@/messages/de/pages/admin-settings.json";
import it from "@/messages/it/pages/admin-settings.json";
import en from "@/messages/en/pages/admin-settings.json";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { Save, Check, Globe, Type, Image, Palette, X, Plus } from "lucide-react";
import type { PlatformSettings } from "@/lib/platform";

function parseAllowedDomains(val: string | null): string[] {
  try { return val ? JSON.parse(val) : []; } catch { return []; }
}

export function AdminSettingsClient({ settings: initial }: { settings: PlatformSettings }) {
  const locale = useLocale();
  const t = translator(locale, de, it, en);
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [domains, setDomains] = useState<string[]>(() => parseAllowedDomains(initial.allowedDomains));
  const [newDomain, setNewDomain] = useState("");

  function update<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }

  function addDomain() {
    const d = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!d || domains.includes(d)) return;
    setDomains([...domains, d]);
    setNewDomain("");
  }

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const payload = { ...s, allowedDomains: domains.length > 0 ? JSON.stringify(domains) : null };
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : t("saveFailed"));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("description")}
        </p>
      </div>

      {/* App Identity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{t("appName")}</CardTitle>
          </div>
          <CardDescription>
            {t("appNameHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="appName">{t("name")}</Label>
            <Input
              id="appName"
              value={s.appName}
              onChange={(e) => update("appName", e.target.value)}
              placeholder="CardNexus"
              maxLength={64}
            />
            <p className="text-xs text-muted-foreground">
              {t("tabPreview")} <span className="font-mono">{s.appName} {t("tabSubtitle")}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* App URL */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{t("appUrl")}</CardTitle>
          </div>
          <CardDescription>
            {t("appUrlHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="appUrl">URL</Label>
            <Input
              id="appUrl"
              value={s.appUrl}
              onChange={(e) => update("appUrl", e.target.value)}
              placeholder="https://meinedomain.de"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              {t("cardExample")} <span className="font-mono">{s.appUrl.replace(/\/$/, "")}/c/max-mustermann</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Favicon & Logo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{t("faviconAndLogo")}</CardTitle>
          </div>
          <CardDescription>
            {t("faviconHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Favicon</Label>
            <p className="text-xs text-muted-foreground">
              {t("faviconSize")}
            </p>
            <div className="flex items-start gap-4">
              <ImageUpload
                value={s.faviconUrl}
                onChange={(url) => update("faviconUrl", url)}
                label={t("uploadFavicon")}
                shape="square"
              />
              {s.faviconUrl && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">{t("preview")}</p>
                    <div className="flex items-center gap-2">
                      <img src={s.faviconUrl} alt="Favicon" className="h-4 w-4 object-cover" />
                      <span className="font-mono">{s.appName}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("sidebarLogo")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("sidebarLogoHint")}
            </p>
            <ImageUpload
              value={s.logoUrl}
              onChange={(url) => update("logoUrl", url)}
              label={t("uploadLogo")}
              shape="square"
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{t("other")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="supportEmail">{t("supportEmail")}</Label>
            <Input
              id="supportEmail"
              value={s.supportEmail ?? ""}
              onChange={(e) => update("supportEmail", e.target.value || null)}
              placeholder="support@meinedomain.de"
              type="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="footerText">{t("footer")}</Label>
            <Input
              id="footerText"
              value={s.footerText ?? ""}
              onChange={(e) => update("footerText", e.target.value || null)}
              placeholder={t("footerExample")}
              maxLength={200}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Domains */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{t("domains")}</CardTitle>
          </div>
          <CardDescription>
            {t("domainsHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {domains.map((d) => (
              <span key={d} className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full text-sm">
                {d}
                <button type="button" onClick={() => setDomains(domains.filter((x) => x !== d))}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {domains.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("noDomains")}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDomain()}
              placeholder="karte.meinefirma.de"
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addDomain}>
              <Plus className="h-4 w-4" /> {t("addDomain")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive border border-destructive/20">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saved ? (
            <><Check className="h-4 w-4" /> {t("saved")}</>
          ) : (
            <><Save className="h-4 w-4" /> {saving ? t("saving") : t("saveSettings")}</>
          )}
        </Button>
        {saved && (
          <p className="text-sm text-muted-foreground">
            {t("reloadHint")}
          </p>
        )}
      </div>
    </div>
  );
}
