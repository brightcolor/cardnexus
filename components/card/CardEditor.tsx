"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/image-upload";
import { CardPreview } from "./CardPreview";
import { TEMPLATES } from "@/types";
import type { CardData, CustomLink, TemplateId, DesignPolicy } from "@/types";
import { Plus, Trash2, Save, Eye, Lock } from "lucide-react";

interface CardEditorProps {
  initialCard?: Partial<CardData>;
  isNew?: boolean;
  policy?: DesignPolicy;
  /** When set, PATCH requests go here instead of /api/cards */
  saveEndpoint?: string;
}

const FONT_OPTIONS = [
  { value: "inter",   label: "Inter",   preview: "Aa", className: "font-sans" },
  { value: "serif",   label: "Serif",   preview: "Aa", className: "font-serif" },
  { value: "mono",    label: "Mono",    preview: "Aa", className: "font-mono" },
  { value: "display", label: "Display", preview: "Aa", className: "font-sans tracking-tight" },
];

const LAYOUT_OPTIONS = [
  { value: "standard", label: "Standard", description: "Avatar links, Name rechts" },
  { value: "centered", label: "Zentriert", description: "Avatar und Name mittig" },
  { value: "compact",  label: "Kompakt",  description: "Platzsparend, kleiner Avatar" },
];

const ROUNDED_OPTIONS = [
  { value: "default", label: "Abgerundet" },
  { value: "sharp",   label: "Eckig" },
  { value: "pill",    label: "Rund (Pill)" },
];

const SHADOW_OPTIONS = [
  { value: "none", label: "Kein" },
  { value: "sm",   label: "Leicht" },
  { value: "md",   label: "Mittel" },
  { value: "lg",   label: "Stark" },
  { value: "xl",   label: "Sehr stark" },
];

const SOCIAL_STYLE_OPTIONS = [
  { value: "icons",   label: "Icons",         description: "Farbige Symbol-Buttons" },
  { value: "outline", label: "Icons + Label",  description: "Umrandete Pills mit Text" },
  { value: "minimal", label: "Minimal",        description: "Nur Textlinks" },
];

const AVATAR_BORDER_OPTIONS = [
  { value: "none", label: "Kein" },
  { value: "ring", label: "Ring" },
  { value: "glow", label: "Glow" },
];

const BG_OPTIONS = [
  { value: "white",    label: "Weiß",    description: "Klassisch sauber" },
  { value: "tinted",   label: "Getönt",  description: "Hauch der Primärfarbe" },
  { value: "gradient", label: "Verlauf", description: "Sanfter Farbverlauf" },
];

const OPEN_POLICY: DesignPolicy = {
  allowTemplateChange: true,
  allowColorChange: true,
  allowFontChange: true,
  allowLayoutChange: true,
  canEditLogo: true,
  brandColors: [],
  defaults: { template: "classic", fontFamily: "inter", layoutStyle: "standard" },
};

function LockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
      <Lock className="h-3 w-3" /> Vom Admin gesperrt
    </span>
  );
}

export function CardEditor({ initialCard, isNew = false, policy = OPEN_POLICY, saveEndpoint }: CardEditorProps) {
  const router = useRouter();

  const defaultCard: Partial<CardData> = {
    firstName: "",
    lastName: "",
    templateId:     (policy.defaults.template as TemplateId) ?? "classic",
    primaryColor:   "#0F172A",
    accentColor:    policy.defaults.accentColor,
    fontFamily:     policy.defaults.fontFamily ?? "inter",
    layoutStyle:    policy.defaults.layoutStyle ?? "standard",
    roundedStyle:   "default",
    shadowStyle:    "md",
    socialStyle:    "icons",
    avatarBorder:   "none",
    cardBackground: "white",
    showQrOnCard:         false,
    showInTeamDirectory:  true,
    isPublic:             true,
    customLinks:    [],
  };

  const [card, setCard] = useState<Partial<CardData>>(initialCard ?? defaultCard);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  function update<K extends keyof CardData>(key: K, value: CardData[K] | null) {
    setCard((prev) => ({ ...prev, [key]: value }));
  }

  function addCustomLink() {
    update("customLinks", [...(card.customLinks ?? []), { label: "", url: "" }] as CustomLink[]);
  }
  function updateCustomLink(i: number, field: keyof CustomLink, value: string) {
    const links = [...(card.customLinks ?? [])];
    links[i] = { ...links[i], [field]: value };
    update("customLinks", links);
  }
  function removeCustomLink(i: number) {
    update("customLinks", (card.customLinks ?? []).filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const method   = isNew ? "POST" : "PATCH";
      const endpoint = saveEndpoint ?? "/api/cards";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(card),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Fehler beim Speichern");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
      if (isNew) router.push("/card");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setSaving(false);
    }
  }

  const hasBrandColors = policy.brandColors.length > 0;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* ── Editor ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <Tabs defaultValue="profile">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="media">Bilder</TabsTrigger>
            <TabsTrigger value="contact">Kontakt</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
          </TabsList>

          {/* ── Profile ── */}
          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Vorname</Label>
                <Input value={card.firstName ?? ""} onChange={(e) => update("firstName", e.target.value || null)} placeholder="Max" />
              </div>
              <div className="space-y-1.5">
                <Label>Nachname</Label>
                <Input value={card.lastName ?? ""} onChange={(e) => update("lastName", e.target.value || null)} placeholder="Mustermann" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Berufsbezeichnung</Label>
              <Input value={card.title ?? ""} onChange={(e) => update("title", e.target.value || null)} placeholder="Senior Developer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Unternehmen</Label>
                <Input value={card.company ?? ""} onChange={(e) => update("company", e.target.value || null)} placeholder="ACME GmbH" />
              </div>
              <div className="space-y-1.5">
                <Label>Abteilung</Label>
                <Input value={card.department ?? ""} onChange={(e) => update("department", e.target.value || null)} placeholder="Engineering" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Kurzbeschreibung</Label>
              <Textarea
                value={card.bio ?? ""}
                onChange={(e) => update("bio", e.target.value || null)}
                placeholder="Kurze Beschreibung über dich…"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{(card.bio ?? "").length}/500</p>
            </div>
          </TabsContent>

          {/* ── Media ── */}
          <TabsContent value="media" className="space-y-6">
            <div className="space-y-2">
              <Label>Avatar</Label>
              <p className="text-xs text-muted-foreground">Profilbild. Empfohlen: quadratisch, mind. 200×200 px.</p>
              <ImageUpload value={card.avatarUrl} onChange={(url) => update("avatarUrl", url)} label="Avatar hochladen" shape="circle" />
            </div>
            <div className="space-y-2">
              <Label>Cover-Bild</Label>
              <p className="text-xs text-muted-foreground">Hintergrundbild für das Modern-Template. Empfohlen: 800×300 px.</p>
              <ImageUpload value={card.coverUrl} onChange={(url) => update("coverUrl", url)} label="Cover hochladen" shape="wide" className="h-28" />
            </div>
          </TabsContent>

          {/* ── Contact ── */}
          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Telefon (Büro)</Label>
                <Input value={card.phone ?? ""} onChange={(e) => update("phone", e.target.value || null)} placeholder="+49 89 1234567" type="tel" />
              </div>
              <div className="space-y-1.5">
                <Label>Mobil</Label>
                <Input value={card.mobile ?? ""} onChange={(e) => update("mobile", e.target.value || null)} placeholder="+49 170 1234567" type="tel" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>E-Mail</Label>
              <Input value={card.email ?? ""} onChange={(e) => update("email", e.target.value || null)} placeholder="max@example.com" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input value={card.website ?? ""} onChange={(e) => update("website", e.target.value || null)} placeholder="https://example.com" type="url" />
            </div>
            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input value={card.address ?? ""} onChange={(e) => update("address", e.target.value || null)} placeholder="Musterstraße 1, 80331 München" />
            </div>
          </TabsContent>

          {/* ── Social ── */}
          <TabsContent value="social" className="space-y-4">
            {[
              { key: "linkedin",  label: "LinkedIn",    ph: "https://linkedin.com/in/..." },
              { key: "xing",      label: "Xing",        ph: "https://xing.com/profile/..." },
              { key: "twitter",   label: "Twitter / X", ph: "https://twitter.com/..." },
              { key: "instagram", label: "Instagram",   ph: "https://instagram.com/..." },
              { key: "github",    label: "GitHub",      ph: "https://github.com/..." },
              { key: "youtube",   label: "YouTube",     ph: "https://youtube.com/@..." },
            ].map(({ key, label, ph }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  value={(card[key as keyof CardData] as string) ?? ""}
                  onChange={(e) => update(key as keyof CardData, (e.target.value || null) as never)}
                  placeholder={ph}
                  type="url"
                />
              </div>
            ))}
          </TabsContent>

          {/* ── Design ── */}
          <TabsContent value="design" className="space-y-8">

            {/* Template */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Template</Label>
                {!policy.allowTemplateChange && <LockedBadge />}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((t) => {
                  const locked = !policy.allowTemplateChange;
                  return (
                    <button key={t.id} type="button" disabled={locked}
                      onClick={() => !locked && update("templateId", t.id as TemplateId)}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        card.templateId === t.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                      } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <div className="h-8 w-8 rounded-lg mb-2" style={{ backgroundColor: t.preview }} />
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Primary color */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base">Primärfarbe</Label>
                {!policy.allowColorChange && <LockedBadge />}
              </div>
              {policy.allowColorChange ? (
                <>
                  {hasBrandColors && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Markenfarben der Organisation</p>
                      <div className="flex flex-wrap gap-2">
                        {policy.brandColors.map((c) => (
                          <button key={c} type="button" title={c} onClick={() => update("primaryColor", c)}
                            className={`h-8 w-8 rounded-lg border-2 transition-all ${
                              card.primaryColor === c ? "border-foreground scale-110" : "border-transparent hover:border-muted-foreground"
                            }`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input type="color" value={card.primaryColor ?? "#0F172A"}
                      onChange={(e) => update("primaryColor", e.target.value)}
                      className="h-10 w-16 rounded-md border border-input cursor-pointer" />
                    <Input value={card.primaryColor ?? "#0F172A"}
                      onChange={(e) => update("primaryColor", e.target.value)}
                      className="font-mono w-32" maxLength={7} />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 opacity-50">
                  <div className="h-10 w-16 rounded-md border border-input" style={{ backgroundColor: card.primaryColor ?? "#0F172A" }} />
                  <span className="font-mono text-sm">{card.primaryColor ?? "#0F172A"}</span>
                </div>
              )}
            </section>

            {/* Accent color */}
            <section className="space-y-2">
              <Label className="text-base">Akzentfarbe <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
              <p className="text-xs text-muted-foreground">Zweite Farbe für Icons, Links und Buttons</p>
              <div className="flex items-center gap-3">
                <input type="color" value={card.accentColor ?? card.primaryColor ?? "#0F172A"}
                  onChange={(e) => update("accentColor", e.target.value)}
                  className="h-10 w-16 rounded-md border border-input cursor-pointer" />
                <Input value={card.accentColor ?? ""} onChange={(e) => update("accentColor", e.target.value || null)}
                  className="font-mono w-32" placeholder="wie Primär" maxLength={7} />
                {card.accentColor && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => update("accentColor", null)}
                    className="text-muted-foreground">Zurücksetzen</Button>
                )}
              </div>
            </section>

            {/* Hintergrund */}
            <section className="space-y-3">
              <Label className="text-base">Hintergrund</Label>
              <div className="grid grid-cols-3 gap-2">
                {BG_OPTIONS.map((b) => (
                  <button key={b.value} type="button"
                    onClick={() => update("cardBackground", b.value as never)}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${
                      (card.cardBackground ?? "white") === b.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                    }`}>
                    <p className="text-sm font-medium">{b.label}</p>
                    <p className="text-xs text-muted-foreground">{b.description}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Kartenrahmen (shadow) */}
            <section className="space-y-3">
              <Label className="text-base">Kartenscatten</Label>
              <div className="flex gap-2 flex-wrap">
                {SHADOW_OPTIONS.map((s) => (
                  <button key={s.value} type="button"
                    onClick={() => update("shadowStyle", s.value as never)}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                      (card.shadowStyle ?? "md") === s.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Font */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Schriftart</Label>
                {!policy.allowFontChange && <LockedBadge />}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FONT_OPTIONS.map((f) => {
                  const locked = !policy.allowFontChange;
                  return (
                    <button key={f.value} type="button" disabled={locked}
                      onClick={() => !locked && update("fontFamily", f.value as never)}
                      className={`rounded-lg border-2 p-3 text-left transition-all ${
                        (card.fontFamily ?? "inter") === f.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                      } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <p className={`text-2xl mb-1 ${f.className}`}>{f.preview}</p>
                      <p className="text-xs font-medium">{f.label}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Layout */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Layout</Label>
                {!policy.allowLayoutChange && <LockedBadge />}
              </div>
              <div className="space-y-2">
                {LAYOUT_OPTIONS.map((l) => {
                  const locked = !policy.allowLayoutChange;
                  return (
                    <button key={l.value} type="button" disabled={locked}
                      onClick={() => !locked && update("layoutStyle", l.value as never)}
                      className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                        (card.layoutStyle ?? "standard") === l.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                      } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <p className="text-sm font-medium">{l.label}</p>
                      <p className="text-xs text-muted-foreground">{l.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Eckenradius */}
            <section className="space-y-3">
              <Label className="text-base">Eckenradius</Label>
              <div className="flex gap-2">
                {ROUNDED_OPTIONS.map((r) => (
                  <button key={r.value} type="button"
                    onClick={() => update("roundedStyle", r.value as never)}
                    className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all ${
                      (card.roundedStyle ?? "default") === r.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Avatar-Rahmen */}
            <section className="space-y-3">
              <Label className="text-base">Avatar-Rahmen</Label>
              <div className="flex gap-2">
                {AVATAR_BORDER_OPTIONS.map((a) => (
                  <button key={a.value} type="button"
                    onClick={() => update("avatarBorder", a.value as never)}
                    className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all ${
                      (card.avatarBorder ?? "none") === a.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                    }`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Social-Stil */}
            <section className="space-y-3">
              <Label className="text-base">Social-Stil</Label>
              <div className="space-y-2">
                {SOCIAL_STYLE_OPTIONS.map((s) => (
                  <button key={s.value} type="button"
                    onClick={() => update("socialStyle", s.value as never)}
                    className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                      (card.socialStyle ?? "icons") === s.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                    }`}>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Firmenlogo */}
            <section className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Firmenlogo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Erscheint klein auf der Karte (oben rechts)
                  </p>
                </div>
                {!policy.canEditLogo && <LockedBadge />}
              </div>
              {policy.canEditLogo ? (
                <ImageUpload
                  value={card.logoUrl}
                  onChange={(url) => update("logoUrl", url)}
                  label="Logo hochladen"
                  shape="wide"
                  className="h-20"
                />
              ) : (
                card.logoUrl
                  ? <img src={card.logoUrl} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain opacity-60" />
                  : <p className="text-xs text-muted-foreground">Kein Logo gesetzt</p>
              )}
            </section>

            {/* QR on card */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium">QR-Code auf Karte zeigen</p>
                <p className="text-xs text-muted-foreground">Kleiner QR-Code direkt auf der Visitenkarte</p>
              </div>
              <Switch checked={card.showQrOnCard ?? false} onCheckedChange={(v) => update("showQrOnCard", v)} />
            </div>

            {/* Public toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium">Karte öffentlich</p>
                <p className="text-xs text-muted-foreground">Karte für alle sichtbar</p>
              </div>
              <Switch checked={card.isPublic ?? true} onCheckedChange={(v) => update("isPublic", v)} />
            </div>

            {/* Team directory toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium">Im Team-Verzeichnis anzeigen</p>
                <p className="text-xs text-muted-foreground">Profil im öffentlichen Verzeichnis deiner Organisation sichtbar</p>
              </div>
              <Switch checked={card.showInTeamDirectory ?? true} onCheckedChange={(v) => update("showInTeamDirectory", v)} />
            </div>
          </TabsContent>

          {/* ── Custom Links ── */}
          <TabsContent value="links" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Eigene Links werden als Buttons auf der Karte angezeigt (max. 5).
            </p>
            {(card.customLinks ?? []).map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input placeholder="Label" value={link.label} onChange={(e) => updateCustomLink(i, "label", e.target.value)} className="w-32" />
                <Input placeholder="https://…" value={link.url} onChange={(e) => updateCustomLink(i, "url", e.target.value)} type="url" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomLink(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {(card.customLinks ?? []).length < 5 && (
              <Button type="button" variant="outline" size="sm" onClick={addCustomLink}>
                <Plus className="h-4 w-4" /> Link hinzufügen
              </Button>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive border border-destructive/20">{error}</p>
        )}
        {success && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 border border-emerald-200">Gespeichert ✓</p>
        )}

        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
          <Button type="button" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Wird gespeichert…" : "Speichern"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowPreview(!showPreview)} className="lg:hidden">
            <Eye className="h-4 w-4" />
            Vorschau
          </Button>
        </div>
      </div>

      {/* ── Preview — sticky so it stays visible while scrolling ────── */}
      <div className={`lg:w-80 lg:sticky lg:top-4 lg:self-start ${showPreview ? "" : "hidden lg:block"}`}>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-4">
          Live-Vorschau
        </p>
        <CardPreview card={card} scale={0.85} />
      </div>
    </div>
  );
}
