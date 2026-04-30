"use client";

import { useState } from "react";
import type { CardData } from "@/types";
import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { card: CardData }

type Style = "standard" | "compact" | "rich";

const STYLES: { id: Style; label: string; desc: string }[] = [
  { id: "standard", label: "Standard",  desc: "Farbbalken + Name, Titel, Kontakt" },
  { id: "compact",  label: "Kompakt",   desc: "Minimalistisch ohne Foto" },
  { id: "rich",     label: "Rich",      desc: "Mit Profilfoto und Social-Links" },
];

function buildHtml(card: CardData, style: Style, baseUrl: string): string {
  const color  = card.primaryColor ?? "#0F172A";
  const name   = `${card.firstName ?? ""} ${card.lastName ?? ""}`.trim();
  const avatar = card.avatarUrl ? absoluteUrl(card.avatarUrl, baseUrl) : null;
  const cardUrl = `${baseUrl}/c/${card.slug}`;

  const socials: { label: string; url: string }[] = [
    card.linkedin  ? { label: "LinkedIn",  url: card.linkedin }  : null,
    card.xing      ? { label: "Xing",      url: card.xing }      : null,
    card.twitter   ? { label: "X/Twitter", url: card.twitter }   : null,
    card.instagram ? { label: "Instagram", url: card.instagram } : null,
    card.github    ? { label: "GitHub",    url: card.github }    : null,
  ].filter(Boolean) as { label: string; url: string }[];

  if (style === "compact") {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#333333;">
  <tr>
    <td style="padding-right:12px;border-right:2px solid ${color};vertical-align:top;">
      <strong style="font-size:15px;color:#111111;">${name}</strong><br>
      ${card.title ? `<span style="color:${color};font-size:12px;">${card.title}</span><br>` : ""}
      ${card.company ? `<span style="color:#666666;font-size:12px;">${card.company}</span>` : ""}
    </td>
    <td style="padding-left:12px;vertical-align:top;font-size:12px;color:#555555;">
      ${card.phone ? `<span>📞 <a href="tel:${card.phone}" style="color:#555555;text-decoration:none;">${card.phone}</a></span><br>` : ""}
      ${card.email ? `<span>✉ <a href="mailto:${card.email}" style="color:#555555;text-decoration:none;">${card.email}</a></span><br>` : ""}
      ${card.website ? `<span>🌐 <a href="${card.website}" style="color:${color};text-decoration:none;">${card.website.replace(/^https?:\/\//, "")}</a></span>` : ""}
    </td>
  </tr>
</table>`;
  }

  if (style === "rich") {
    const socialHtml = socials.length > 0
      ? `<tr><td colspan="2" style="padding-top:10px;">
    ${socials.map(s => `<a href="${s.url}" style="font-family:Arial,sans-serif;font-size:11px;color:${color};text-decoration:none;margin-right:10px;">${s.label}</a>`).join("")}
  </td></tr>` : "";

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#333333;">
  <tr>
    ${avatar ? `<td style="padding-right:16px;vertical-align:top;">
      <a href="${cardUrl}"><img src="${avatar}" alt="${name}" width="72" height="72" style="border-radius:50%;display:block;object-fit:cover;" /></a>
    </td>` : ""}
    <td style="vertical-align:top;border-left:3px solid ${color};padding-left:14px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <strong style="font-size:16px;color:#111111;">${name}</strong><br>
            ${card.title ? `<span style="color:${color};font-size:13px;font-weight:600;">${card.title}</span><br>` : ""}
            ${card.company ? `<span style="color:#666666;font-size:13px;">${card.company}</span><br>` : ""}
          </td>
        </tr>
        <tr><td style="padding-top:8px;font-size:12px;color:#555555;line-height:1.8;">
          ${card.phone  ? `📞 <a href="tel:${card.phone}" style="color:#555555;text-decoration:none;">${card.phone}</a><br>` : ""}
          ${card.mobile ? `📱 <a href="tel:${card.mobile}" style="color:#555555;text-decoration:none;">${card.mobile}</a><br>` : ""}
          ${card.email  ? `✉ <a href="mailto:${card.email}" style="color:#555555;text-decoration:none;">${card.email}</a><br>` : ""}
          ${card.website ? `🌐 <a href="${card.website}" style="color:${color};text-decoration:none;">${card.website.replace(/^https?:\/\//, "")}</a><br>` : ""}
          ${card.address ? `📍 ${card.address}<br>` : ""}
        </td></tr>
        ${socialHtml}
        <tr><td style="padding-top:10px;">
          <a href="${cardUrl}" style="font-family:Arial,sans-serif;font-size:11px;background-color:${color};color:#ffffff;text-decoration:none;padding:5px 12px;border-radius:4px;display:inline-block;">Digitale Visitenkarte</a>
        </td></tr>
      </table>
    </td>
  </tr>
</table>`;
  }

  // standard
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#333333;">
  <tr>
    <td style="border-left:3px solid ${color};padding-left:14px;vertical-align:top;">
      <strong style="font-size:16px;color:#111111;">${name}</strong><br>
      ${card.title ? `<span style="color:${color};font-size:13px;font-weight:600;">${card.title}</span><br>` : ""}
      ${card.company ? `<span style="color:#666666;font-size:13px;">${card.company}</span><br>` : ""}
      <br>
      <span style="font-size:12px;color:#555555;line-height:1.8;">
        ${card.phone  ? `📞 <a href="tel:${card.phone}" style="color:#555555;text-decoration:none;">${card.phone}</a><br>` : ""}
        ${card.mobile ? `📱 <a href="tel:${card.mobile}" style="color:#555555;text-decoration:none;">${card.mobile}</a><br>` : ""}
        ${card.email  ? `✉ <a href="mailto:${card.email}" style="color:#555555;text-decoration:none;">${card.email}</a><br>` : ""}
        ${card.website ? `🌐 <a href="${card.website}" style="color:${color};text-decoration:none;">${card.website.replace(/^https?:\/\//, "")}</a>` : ""}
      </span>
    </td>
  </tr>
</table>`;
}

function absoluteUrl(url: string, base: string) {
  if (url.startsWith("http")) return url;
  return base + url;
}

const INSTRUCTIONS: Record<string, { title: string; steps: string[] }> = {
  gmail: {
    title: "Gmail",
    steps: [
      "Oeffne Gmail -> Einstellungen -> Alle Einstellungen anzeigen",
      'Scrolle zu "Signatur" und klicke auf "Neue Signatur erstellen"',
      "Gib einen Namen ein, klicke in das Textfeld",
      "Fuge den kopierten Code ein (Strg+V / Cmd+V)",
      "Speichere die Einstellungen ganz unten",
    ],
  },
  outlook: {
    title: "Outlook",
    steps: [
      "Oeffne Outlook -> Datei -> Optionen -> E-Mail -> Signaturen",
      'Klicke auf "Neu" und gib einen Namen ein',
      "Oeffne den HTML-Editor, fuge den Code ein",
      "Fuge den Code in das Signaturfeld ein",
      "Waehle die Signatur fuer neue Nachrichten und Antworten",
    ],
  },
  apple: {
    title: "Apple Mail",
    steps: [
      "Oeffne Mail -> Einstellungen -> Signaturen",
      'Klicke auf "+" und gib einen Namen ein',
      'Deaktiviere "Immer klassisches Design"',
      "Fuge den HTML-Code ein (Terminal -> .html-Datei erstellen -> in Signaturfeld ziehen)",
    ],
  },
};

export function SignatureClient({ card }: Props) {
  const [style, setStyle] = useState<Style>("standard");
  const [copied, setCopied] = useState(false);
  const [activeGuide, setActiveGuide] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const html = buildHtml(card, style, baseUrl);

  async function copy() {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left: Controls */}
      <div className="space-y-6">
        {/* Style picker */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Stil wählen</p>
          <div className="space-y-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-colors",
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

        {/* Copy button */}
        <Button onClick={copy} className="w-full" size="lg">
          {copied ? <><Check className="h-4 w-4" /> Kopiert!</> : <><Copy className="h-4 w-4" /> HTML-Code kopieren</>}
        </Button>

        {/* Installation guides */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Anleitung für deinen E-Mail-Client</p>
          {Object.entries(INSTRUCTIONS).map(([key, guide]) => (
            <div key={key} className="border border-border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
                onClick={() => setActiveGuide(activeGuide === key ? null : key)}
              >
                {guide.title}
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {activeGuide === key && (
                <ol className="px-4 pb-4 space-y-1.5 list-decimal list-inside">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Preview */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Vorschau</p>
        <div className="border border-border rounded-xl bg-white overflow-hidden">
          {/* Mock email header */}
          <div className="border-b border-border px-4 py-3 bg-gray-50 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium w-8">Von:</span>
              <span>{card.email ?? "deine@email.de"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium w-8">An:</span>
              <span>empfaenger@beispiel.de</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium w-8">Betr.:</span>
              <span>Meine Nachricht</span>
            </div>
          </div>

          {/* Mock email body */}
          <div className="px-4 py-4">
            <p className="text-sm text-gray-400 mb-6">Hallo,<br /><br />…<br /><br />Mit freundlichen Grüßen</p>
            <div
              dangerouslySetInnerHTML={{ __html: html }}
              className="text-sm"
            />
          </div>
        </div>

        {/* Raw HTML */}
        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
            HTML-Code anzeigen
          </summary>
          <pre className="mt-2 p-3 rounded-lg bg-muted text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed text-muted-foreground">
            {html}
          </pre>
        </details>
      </div>
    </div>
  );
}
