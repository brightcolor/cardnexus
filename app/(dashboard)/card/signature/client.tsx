"use client";

import { translator } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/LocaleProvider";
import de from "@/messages/de/pages/signature.json";
import it from "@/messages/it/pages/signature.json";
import en from "@/messages/en/pages/signature.json";
import { useEffect, useState } from "react";
import type { CardData } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildHtml, buildPlainText, type SigStyle } from "./build-html";

interface SignatureSettings {
  footerText: string;
  showAvatar: boolean | null;
  showLogo: boolean;
}

export type SignatureCard = CardData & { emailSignature: SignatureSettings | null };

interface Props {
  card: SignatureCard;
  allCards: SignatureCard[];
  baseUrl: string;
}

const defaultSettings: SignatureSettings = { footerText: "", showAvatar: null, showLogo: false };

export function SignatureClient({ card: initialCard, allCards: cards, baseUrl }: Props) {
  const locale = useLocale();
  const t = translator(locale, de, it, en);

  const STYLES: { id: SigStyle; label: string; desc: string }[] = [
    { id: "standard", label: t("standardStyle"), desc: t("standardStyleDescription") },
    { id: "compact",  label: t("compactStyle"),   desc: t("compactStyleDescription") },
    { id: "rich",     label: "Rich",      desc: t("richStyleDescription") },
    { id: "modern",   label: "Modern",    desc: t("modernStyleDescription") },
    { id: "minimal",  label: "Minimal",   desc: t("minimalStyleDescription") },
    { id: "dark",     label: "Dark",      desc: t("darkStyleDescription") },
  ];

  const GUIDES: Record<string, { title: string; steps: string[] }> = {
    gmail: {
      title: "Gmail",
      steps: [
        t("gmailStep1"),

        t("gmailStep2"),

        t("gmailStep3"),

        t("gmailStep4"),

        t("gmailStep5"),
      ],
    },
    outlook: {
      title: "Outlook",
      steps: [
        t("outlookStep1"),

        t("outlookStep2"),

        t("outlookStep3"),

        t("outlookStep4"),

        t("outlookStep5"),
      ],
    },
    apple: {
      title: "Apple Mail",
      steps: [
        t("appleStep1"),

        t("appleStep2"),

        t("appleStep3"),

        t("appleStep4"),
      ],
    },
  };

  const [activeCardId, setActiveCardId] = useState(initialCard.id);
  const [style,       setStyle]        = useState<SigStyle>("standard");
  const [color,       setColor]        = useState(initialCard.primaryColor ?? "#0F172A");
  const [showSocials, setShowSocials]  = useState(true);
  const [showCardLink,setShowCardLink] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, SignatureSettings>>({});
  const [saved, setSaved] = useState<Record<string, SignatureSettings>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ id: string; success: boolean } | null>(null);
  const [copied,      setCopied]       = useState(false);
  const [copiedTxt,   setCopiedTxt]    = useState(false);
  const [guide,       setGuide]        = useState<string | null>(null);

  const card = cards.find((c) => c.id === activeCardId) ?? initialCard;
  const persisted = saved[card.id] ?? card.emailSignature ?? defaultSettings;
  const settings = drafts[card.id] ?? persisted;
  const { footerText, showLogo } = settings;
  const showAvatar = settings.showAvatar ?? (style !== "compact" && style !== "minimal");
  const dirty = settings.footerText !== persisted.footerText
    || settings.showAvatar !== persisted.showAvatar || settings.showLogo !== persisted.showLogo;

  useEffect(() => {
    setColor(card.primaryColor ?? "#0F172A");
  }, [card.primaryColor]);

  const opts    = { color, showAvatar, showLogo, showSocials, showCardLink, footerText };
  const html    = buildHtml(card, style, baseUrl, opts, locale);

  function updateSettings(changes: Partial<SignatureSettings>) {
    setDrafts((current) => ({ ...current, [card.id]: { ...(current[card.id] ?? persisted), ...changes } }));
    setFeedback(null);
  }

  async function saveSettings() {
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/cards/${encodeURIComponent(card.id)}/signature`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error();
      setSaved((current) => ({ ...current, [card.id]: settings }));
      setFeedback({ id: card.id, success: true });
    } catch {
      setFeedback({ id: card.id, success: false });
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function copyPlain() {
    await navigator.clipboard.writeText(buildPlainText(card, locale, footerText));
    setCopiedTxt(true);
    setTimeout(() => setCopiedTxt(false), 2500);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* ── Controls ── */}
      <div className="space-y-6">

        {/* Card selector */}
        {cards.length > 1 && (
          <div className="space-y-1.5">
            <Label>{t("card")}</Label>
            <select
              value={activeCardId}
              onChange={(e) => setActiveCardId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Style picker */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("chooseStyle")}</p>
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={cn(
                  "text-left rounded-xl border p-3 transition-colors",
                  style === s.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <p className="font-medium text-sm">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
          <p className="text-sm font-medium">{t("options")}</p>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-normal">{t("accent")}</Label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-16 cursor-pointer rounded border border-border p-0.5"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="signature-photo" className="text-sm font-normal">
              {t("photo")}{!card.avatarUrl && <span className="text-xs text-muted-foreground ml-1">{t("noPhoto")}</span>}
            </Label>
            <Switch id="signature-photo" checked={showAvatar && !!card.avatarUrl} onCheckedChange={(checked) => updateSettings({ showAvatar: checked })} disabled={!card.avatarUrl} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="signature-logo" className="text-sm font-normal">
              {t("companyLogo")}{!card.logoUrl && <span className="text-xs text-muted-foreground ml-1">{t("noCompanyLogo")}</span>}
            </Label>
            <Switch id="signature-logo" checked={showLogo && !!card.logoUrl} onCheckedChange={(checked) => updateSettings({ showLogo: checked })} disabled={!card.logoUrl} />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-normal">{t("social")}</Label>
            <Switch checked={showSocials} onCheckedChange={setShowSocials} />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-normal">{t("cardButton")}</Label>
            <Switch checked={showCardLink} onCheckedChange={setShowCardLink} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="signature-footer" className="text-sm font-normal">
              {t("footer")} <span className="text-xs text-muted-foreground">{t("footerHint")}</span>
            </Label>
            <Textarea
              id="signature-footer"
              value={footerText}
              onChange={(e) => updateSettings({ footerText: e.target.value })}
              placeholder={t("footerPlaceholder")}
              rows={2}
              maxLength={5000}
              className="text-xs resize-y"
            />
          </div>
          <Button size="sm" variant="outline" onClick={saveSettings} disabled={!dirty || saving}>
            {saving ? t("savingSettings") : t("saveSettings")}
          </Button>
          <p role="status" className="text-xs text-muted-foreground">
            {feedback?.id === card.id && t(feedback.success ? "settingsSaved" : "settingsSaveFailed")}
          </p>
        </div>

        {/* Copy buttons */}
        <div className="space-y-2">
          <Button onClick={copy} className="w-full" size="lg">
            {copied
              ? <><Check className="h-4 w-4" /> {t("htmlCopied")}</>
              : <><Copy className="h-4 w-4" /> {t("copyHtml")}</>}
          </Button>
          <Button onClick={copyPlain} variant="outline" className="w-full">
            {copiedTxt
              ? <><Check className="h-4 w-4" /> {t("textCopied")}</>
              : <><Copy className="h-4 w-4" /> {t("copyText")}</>}
          </Button>
        </div>

        {/* Client guides */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("instructions")}</p>
          {Object.entries(GUIDES).map(([key, g]) => (
            <div key={key} className="border border-border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
                onClick={() => setGuide(guide === key ? null : key)}
              >
                {g.title}
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {guide === key && (
                <ol className="px-4 pb-4 space-y-1.5 list-decimal list-inside">
                  {g.steps.map((step, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed">{step}</li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Preview ── */}
      <div className="space-y-3">
        <p className="text-sm font-medium">{t("preview")}</p>
        <div className="border border-border rounded-xl bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 bg-gray-50 space-y-1">
            {[
              { label: t("from"),  val: card.email ?? "sender@example.com" },
              { label: t("to"),   val: "recipient@example.com" },
              { label: t("subject"),val: t("exampleSubject") },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium w-10">{label}</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-4">
            <p className="text-sm text-gray-400 mb-6">{t("greeting")}<br /><br />…<br /><br />{t("regards")}</p>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>

        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
            {t("showHtml")}
          </summary>
          <pre className="mt-2 p-3 rounded-lg bg-muted text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed text-muted-foreground">
            {html}
          </pre>
        </details>
      </div>
    </div>
  );
}
