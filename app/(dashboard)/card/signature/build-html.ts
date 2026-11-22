import type { Locale } from "@/lib/i18n/locales";
import de from "@/messages/de/components/signature-export.json";
import it from "@/messages/it/components/signature-export.json";
import en from "@/messages/en/components/signature-export.json";
import type { CardData } from "@/types";

export type SigStyle = "standard" | "compact" | "rich" | "modern" | "minimal" | "dark";

export interface SigOptions {
  color: string;
  showAvatar: boolean;
  showLogo: boolean;
  showSocials: boolean;
  showCardLink: boolean;
  footerText: string;
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function multilineHtml(text: string) {
  return escapeHtml(text).replace(/\r\n?|\n/g, "<br>");
}

function imageUrl(value: string | null | undefined, base: string) {
  if (!value) return "";
  try {
    const url = new URL(value, base);
    return url.protocol === "http:" || url.protocol === "https:" ? escapeHtml(url.href) : "";
  } catch {
    return "";
  }
}

function getSocials(card: CardData): { label: string; url: string }[] {
  const items: { label: string; url: string }[] = [];
  if (card.linkedin)  items.push({ label: "LinkedIn",  url: card.linkedin });
  if (card.xing)      items.push({ label: "Xing",      url: card.xing });
  if (card.twitter)   items.push({ label: "X/Twitter", url: card.twitter });
  if (card.instagram) items.push({ label: "Instagram", url: card.instagram });
  if (card.github)    items.push({ label: "GitHub",    url: card.github });
  return items;
}

function socialLinks(socials: { label: string; url: string }[], color: string) {
  return socials
    .map(s => `<a href="${s.url}" style="font-family:Arial,sans-serif;font-size:11px;color:${color};text-decoration:none;margin-right:10px;">${s.label}</a>`)
    .join("");
}

function footerRow(text: string, cols = 1, dark = false) {
  if (!text.trim()) return "";
  const color = dark ? "#cbd5e1" : "#666666";
  const border = dark ? "#334155" : "#eeeeee";
  return `<tr><td colspan="${cols}" style="padding-top:10px;font-size:10px;color:${color};border-top:1px solid ${border};">${multilineHtml(text)}</td></tr>`;
}

function addressHtml(address?: string | null) {
  if (!address) return "";
  return "📍 " + multilineHtml(address);
}

export function buildPlainText(card: CardData, locale: Locale = "de", footerText = ""): string {
  const labels = { de: de, it: it, en: en }[locale];
  const name = `${card.firstName ?? ""} ${card.lastName ?? ""}`.trim();
  const header = [name, [card.title, card.company].filter(Boolean).join(" | ")].filter(Boolean);
  const contact = [
    card.phone   && `${labels.phone.padEnd(8)}${card.phone}`,
    card.mobile  && `${labels.mobile.padEnd(8)}${card.mobile}`,
    card.email   && `${labels.email.padEnd(8)}${card.email}`,
    card.website && `${labels.website.padEnd(8)}${card.website}`,
    card.address && `${labels.address.padEnd(8)}${card.address.replace(/\r\n?/g, "\n")}`,
  ].filter(Boolean) as string[];
  const signature = [...header, "", ...contact].join("\n");
  return footerText.trim() ? `${signature.trimEnd()}\n\n${footerText.replace(/\r\n?/g, "\n")}` : signature;
}

export function buildHtml(card: CardData, style: SigStyle, baseUrl: string, opts: SigOptions, locale: Locale = "de"): string {
  const labels = { de: de, it: it, en: en }[locale];
  const { color, showAvatar, showLogo, showSocials, showCardLink, footerText } = opts;
  const name    = `${card.firstName ?? ""} ${card.lastName ?? ""}`.trim();
  const avatar = showAvatar ? imageUrl(card.avatarUrl, baseUrl) : "";
  const logo = showLogo ? imageUrl(card.logoUrl, baseUrl) : "";
  const cardUrl = `${baseUrl}/c/${encodeURIComponent(card.slug)}`;
  const hasImages = !!(avatar || logo);
  const imageSize = { standard: 64, compact: 36, rich: 72, modern: 60, minimal: 44, dark: 60 }[style];
  const logoSize = { standard: 72, compact: 48, rich: 80, modern: 68, minimal: 56, dark: 68 }[style];
  const avatarStyle = style === "modern" ? "border-radius:8px;" : "border-radius:50%;";
  const photo = avatar
    ? `<img src="${avatar}" alt="${escapeHtml(name)}" width="${imageSize}" height="${imageSize}" style="display:block;object-fit:cover;${avatarStyle}" />`
    : "";
  const logoImage = logo
    ? `<img src="${logo}" alt="${escapeHtml(card.company || labels.logo)}" width="${logoSize}" style="display:block;height:auto;${style === "dark" ? "background-color:#ffffff;padding:4px;border-radius:4px;" : ""}" />`
    : "";
  const images = hasImages
    ? `<table cellpadding="0" cellspacing="0" border="0" role="presentation">
        ${photo ? `<tr><td align="center">${style === "rich" ? `<a href="${cardUrl}">${photo}</a>` : photo}</td></tr>` : ""}
        ${logoImage ? `<tr><td align="center"${photo ? ' style="padding-top:6px;"' : ""}>${logoImage}</td></tr>` : ""}
      </table>`
    : "";
  const socials = showSocials ? getSocials(card) : [];
  const address = addressHtml(card.address);
  const btn     = showCardLink
    ? `<a href="${cardUrl}" style="font-family:Arial,sans-serif;font-size:11px;background-color:${color};color:#ffffff;text-decoration:none;padding:5px 12px;border-radius:4px;display:inline-block;">${labels.card}</a>`
    : "";

  const contact555 = [
    card.phone  ? `📞 <a href="tel:${card.phone}" style="color:#555555;text-decoration:none;">${card.phone}</a>`    : "",
    card.mobile ? `📱 <a href="tel:${card.mobile}" style="color:#555555;text-decoration:none;">${card.mobile}</a>`  : "",
    card.email  ? `✉ <a href="mailto:${card.email}" style="color:#555555;text-decoration:none;">${card.email}</a>` : "",
    card.website ? `🌐 <a href="${card.website}" style="color:${color};text-decoration:none;">${card.website.replace(/^https?:\/\//, "")}</a>` : "",
    address,
  ].filter(Boolean).join("<br>");

  if (style === "compact") {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#333333;">
  <tr>
    <td style="padding-right:12px;border-right:2px solid ${color};vertical-align:top;">
      ${images ? `<div style="padding-bottom:5px;">${images}</div>` : ""}
      <strong style="font-size:15px;color:#111111;">${name}</strong><br>
      ${card.title   ? `<span style="color:${color};font-size:12px;">${card.title}</span><br>` : ""}
      ${card.company ? `<span style="color:#666666;font-size:12px;">${card.company}</span>`    : ""}
    </td>
    <td style="padding-left:12px;vertical-align:top;font-size:12px;color:#555555;">
      ${card.phone   ? `📞 <a href="tel:${card.phone}" style="color:#555555;text-decoration:none;">${card.phone}</a><br>` : ""}
      ${card.email   ? `✉ <a href="mailto:${card.email}" style="color:#555555;text-decoration:none;">${card.email}</a><br>` : ""}
      ${card.website ? `🌐 <a href="${card.website}" style="color:${color};text-decoration:none;">${card.website.replace(/^https?:\/\//, "")}</a><br>` : ""}
      ${address ? `${address}<br>` : ""}
      ${socials.length > 0 ? `<div style="margin-top:5px;">${socialLinks(socials, color)}</div>` : ""}
      ${btn ? `<div style="margin-top:8px;">${btn}</div>` : ""}
    </td>
  </tr>
  ${footerRow(footerText, 2)}
</table>`;
  }

  if (style === "rich") {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#333333;">
  <tr>
    ${images ? `<td style="padding-right:16px;vertical-align:top;">${images}</td>` : ""}
    <td style="vertical-align:top;border-left:3px solid ${color};padding-left:14px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr><td>
          <strong style="font-size:16px;color:#111111;">${name}</strong><br>
          ${card.title   ? `<span style="color:${color};font-size:13px;font-weight:600;">${card.title}</span><br>` : ""}
          ${card.company ? `<span style="color:#666666;font-size:13px;">${card.company}</span><br>` : ""}
        </td></tr>
        <tr><td style="padding-top:8px;font-size:12px;color:#555555;line-height:1.8;">${contact555}</td></tr>
        ${socials.length > 0 ? `<tr><td style="padding-top:8px;">${socialLinks(socials, color)}</td></tr>` : ""}
        ${btn ? `<tr><td style="padding-top:10px;">${btn}</td></tr>` : ""}
        ${footerRow(footerText)}
      </table>
    </td>
  </tr>
</table>`;
  }

  if (style === "modern") {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#333333;">
  <tr><td colspan="${hasImages ? 2 : 1}" style="background-color:${color};height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr>
    ${images ? `<td style="padding:12px 14px 12px 0;vertical-align:top;">${images}</td>` : ""}
    <td style="padding-top:12px;vertical-align:top;">
      <strong style="font-size:16px;color:#111111;">${name}</strong>${card.title ? `<span style="color:${color};font-size:13px;"> · ${card.title}</span>` : ""}
      ${card.company ? `<br><span style="color:#666666;font-size:12px;">${card.company}${card.department ? ` · ${card.department}` : ""}</span>` : ""}
      <table cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
        <tr>
          <td style="font-size:11px;color:#555555;padding-right:16px;vertical-align:top;">
            ${card.phone  ? `<a href="tel:${card.phone}" style="color:#555555;text-decoration:none;display:block;">📞 ${card.phone}</a>` : ""}
            ${card.mobile ? `<a href="tel:${card.mobile}" style="color:#555555;text-decoration:none;display:block;">📱 ${card.mobile}</a>` : ""}
          </td>
          <td style="font-size:11px;color:#555555;vertical-align:top;">
            ${card.email   ? `<a href="mailto:${card.email}" style="color:#555555;text-decoration:none;display:block;">✉ ${card.email}</a>` : ""}
            ${card.website ? `<a href="${card.website}" style="color:${color};text-decoration:none;display:block;">🌐 ${card.website.replace(/^https?:\/\//, "")}</a>` : ""}
          </td>
        </tr>
      </table>
      ${address ? `<div style="margin-top:6px;font-size:11px;color:#555555;">${address}</div>` : ""}
      ${socials.length > 0 ? `<div style="margin-top:8px;">${socialLinks(socials, color)}</div>` : ""}
      ${btn ? `<div style="margin-top:8px;">${btn}</div>` : ""}
    </td>
  </tr>
  ${footerRow(footerText, hasImages ? 2 : 1)}
</table>`;
  }

  if (style === "minimal") {
    const parts = [name, card.title, card.company].filter(Boolean).join(" — ");
    const contacts = [
      card.phone  ? `<a href="tel:${card.phone}" style="color:#888888;text-decoration:none;">${card.phone}</a>`              : "",
      card.mobile ? `<a href="tel:${card.mobile}" style="color:#888888;text-decoration:none;">${card.mobile}</a>`            : "",
      card.email  ? `<a href="mailto:${card.email}" style="color:#888888;text-decoration:none;">${card.email}</a>`           : "",
      card.website ? `<a href="${card.website}" style="color:${color};text-decoration:none;">${card.website.replace(/^https?:\/\//, "")}</a>` : "",
    ].filter(Boolean).join("&nbsp;&nbsp;·&nbsp;&nbsp;");
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#444444;">
  <tr>
    <td>
      <span style="font-size:14px;color:#111111;font-weight:600;">${parts}</span><br>
      <span style="font-size:12px;color:#888888;">${contacts}</span>
      ${address ? `<br><span style="font-size:12px;color:#888888;">${address}</span>` : ""}
      ${images ? `<div style="padding-top:5px;">${images}</div>` : ""}
      ${socials.length > 0 ? `<br><span style="font-size:11px;">${socialLinks(socials, color)}</span>` : ""}
      ${btn ? `<br><span style="font-size:11px;display:inline-block;margin-top:6px;">${btn}</span>` : ""}
    </td>
  </tr>
  ${footerRow(footerText)}
</table>`;
  }

  if (style === "dark") {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;background-color:#1e293b;border-radius:8px;">
  <tr>
    <td style="padding:16px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${images ? `<td style="padding-right:14px;vertical-align:top;">${images}</td>` : ""}
          <td style="vertical-align:top;border-left:3px solid ${color};padding-left:14px;">
            <strong style="font-size:16px;color:#f8fafc;">${name}</strong><br>
            ${card.title   ? `<span style="color:${color};font-size:13px;font-weight:600;">${card.title}</span><br>` : ""}
            ${card.company ? `<span style="color:#94a3b8;font-size:13px;">${card.company}</span><br>` : ""}
            <span style="font-size:12px;color:#94a3b8;line-height:1.8;display:block;margin-top:6px;">
              ${card.phone  ? `📞 <a href="tel:${card.phone}" style="color:#94a3b8;text-decoration:none;">${card.phone}</a><br>` : ""}
              ${card.mobile ? `📱 <a href="tel:${card.mobile}" style="color:#94a3b8;text-decoration:none;">${card.mobile}</a><br>` : ""}
              ${card.email  ? `✉ <a href="mailto:${card.email}" style="color:#94a3b8;text-decoration:none;">${card.email}</a><br>` : ""}
              ${card.website ? `🌐 <a href="${card.website}" style="color:${color};text-decoration:none;">${card.website.replace(/^https?:\/\//, "")}</a><br>` : ""}
              ${address}
            </span>
            ${socials.length > 0 ? `<div style="margin-top:8px;">${socialLinks(socials, color)}</div>` : ""}
            ${btn ? `<div style="margin-top:10px;">${btn}</div>` : ""}
          </td>
        </tr>
        ${footerRow(footerText, hasImages ? 2 : 1, true)}
      </table>
    </td>
  </tr>
</table>`;
  }

  // standard (default) — with optional avatar
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#333333;">
  <tr>
    ${images ? `<td style="padding-right:16px;vertical-align:top;">${images}</td>` : ""}
    <td style="border-left:3px solid ${color};padding-left:14px;vertical-align:top;">
      <strong style="font-size:16px;color:#111111;">${name}</strong><br>
      ${card.title   ? `<span style="color:${color};font-size:13px;font-weight:600;">${card.title}</span><br>` : ""}
      ${card.company ? `<span style="color:#666666;font-size:13px;">${card.company}</span><br>` : ""}
      <br>
      <span style="font-size:12px;color:#555555;line-height:1.8;">${contact555}</span>
      ${socials.length > 0 ? `<div style="margin-top:8px;">${socialLinks(socials, color)}</div>` : ""}
      ${btn ? `<div style="margin-top:10px;">${btn}</div>` : ""}
    </td>
  </tr>
  ${footerRow(footerText, hasImages ? 2 : 1)}
</table>`;
}
