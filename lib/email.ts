import orgRestoredDe from "@/messages/de/emails/organization-restored.json";
import orgRestoredIt from "@/messages/it/emails/organization-restored.json";
import orgFrozenDe from "@/messages/de/emails/organization-frozen.json";
import orgFrozenIt from "@/messages/it/emails/organization-frozen.json";
import nodemailer from "nodemailer";
import { db } from "./db";
import { defaultLocale, parseLocale, type Locale } from "./i18n/locales";
import { translator } from "./i18n/messages";
import layoutDe from "@/messages/de/emails/layout.json";
import layoutIt from "@/messages/it/emails/layout.json";
import invitationDe from "@/messages/de/emails/invitation.json";
import invitationIt from "@/messages/it/emails/invitation.json";
import passwordResetDe from "@/messages/de/emails/password-reset.json";
import passwordResetIt from "@/messages/it/emails/password-reset.json";
import welcomeDe from "@/messages/de/emails/welcome.json";
import welcomeIt from "@/messages/it/emails/welcome.json";
import leadNotificationDe from "@/messages/de/emails/lead-notification.json";
import leadNotificationIt from "@/messages/it/emails/lead-notification.json";
import emailChangeNotificationDe from "@/messages/de/emails/email-change.json";
import emailChangeNotificationIt from "@/messages/it/emails/email-change.json";
import verificationDe from "@/messages/de/emails/email-verification.json";
import verificationIt from "@/messages/it/emails/email-verification.json";


// ── Transport ──────────────────────────────────────────────────────────────
function createTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null; // Email disabled if not configured

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true", // true = TLS on port 465
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
      : undefined,
  });
}

const FROM = process.env.SMTP_FROM ?? "CardNexus <noreply@cardnexus.app>";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "CardNexus";

/**
 * HTML-escape user-supplied strings so they can't break out of attribute or
 * tag context in our email templates. Closes the XSS / HTML-injection vector
 * in invitation, welcome and similar templates.
 */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function recipientLocale(email: string, userId?: string): Promise<Locale> {
  const user = await db.user.findUnique({
    where: userId ? { id: userId } : { email },
    select: { locale: true },
  });
  return parseLocale(user?.locale) ?? defaultLocale();
}

function strong(value: string) {
  return "<strong>" + esc(value) + "</strong>";
}

// ── Base layout ────────────────────────────────────────────────────────────
function layout(locale: Locale, title: string, body: string) {
  const t = translator(locale, layoutDe, layoutIt);
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo / brand -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="display:inline-flex;align-items:center;gap:8px;">
                <div style="width:32px;height:32px;background:#0f172a;border-radius:8px;display:inline-block;text-align:center;line-height:32px;color:#fff;font-size:12px;font-weight:700;">${APP_NAME.slice(0, 2).toUpperCase()}</div>
                <span style="font-size:16px;font-weight:600;color:#0f172a;">${APP_NAME}</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,.08);">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
              &copy; ${new Date().getFullYear()} ${APP_NAME}. ${t("copyright")}<br />
              ${t("automatic")}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;margin:24px 0;">${text}</a>`;
}

function h1(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">${text}</h1>`;
}

function p(text: string) {
  return `<p style="margin:12px 0;font-size:15px;line-height:1.6;color:#374151;">${text}</p>`;
}

function muted(text: string) {
  return `<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">${text}</p>`;
}

// ── Send helper ────────────────────────────────────────────────────────────
async function send(to: string, subject: string, html: string) {
  const transport = createTransport();
  if (!transport) {
    console.warn(`[email] SMTP not configured — skipping email to ${to}: ${subject}`);
    return;
  }
  try {
    await transport.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
  }
}

// ── Invitation email ───────────────────────────────────────────────────────
export async function sendEmailVerification({ to, url }: { to: string; url: string }) {
  const transport = createTransport();
  if (!transport) throw new Error("SMTP unavailable");
  const locale = await recipientLocale(to);
  const t = translator(locale, verificationDe, verificationIt);
  const subject = t("subject");
  const html = layout(locale, esc(subject), h1(esc(subject)) + p(esc(t("body"))) + btn(esc(t("confirm")), esc(url)));
  await transport.sendMail({ from: FROM, to, subject, html });
}

export async function sendInvitationEmail({
  to, senderName, orgName, role, inviteUrl,
}: {
  to: string;
  senderName: string;
  orgName: string;
  role: string;
  inviteUrl: string;
}) {
  const locale = await recipientLocale(to);
  const t = translator(locale, invitationDe, invitationIt);
  const roleLabel: Record<string, string> = {
    company_admin: t("admin"),
    team_leader:   t("leader"),
    member:        t("member"),
  };

  const html = layout(
    locale,
    esc(t("title", { orgName })),
    `
    ${h1(t("heading"))}
    ${p(t("body", { sender: strong(senderName), app: esc(APP_NAME), role: strong(roleLabel[role] ?? role), organization: strong(orgName) }))}
    ${p(t("description"))}
    <div style="text-align:center;">
      ${btn(t("accept"), esc(inviteUrl))}
    </div>
    ${muted(t("expiry", { url: esc(inviteUrl) }))}
    `
  );

  await send(to, t("subject", { senderName, orgName }), html);
}

// ── Welcome email ──────────────────────────────────────────────────────────
export async function sendWelcomeEmail({
  to, name, dashboardUrl,
}: {
  to: string;
  name: string;
  dashboardUrl: string;
}) {
  const locale = await recipientLocale(to);
  const t = translator(locale, welcomeDe, welcomeIt);
  const html = layout(
    locale,
    esc(t("title", { app: APP_NAME })),
    `
    ${h1(t("greeting", { name: esc(name.split(" ")[0]) }))}
    ${p(t("intro", { app: esc(APP_NAME) }))}
    ${p(t("description"))}
    <div style="text-align:center;">
      ${btn(t("dashboard"), esc(dashboardUrl))}
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;border-top:1px solid #f3f4f6;padding-top:20px;">
      <tr>
        <td style="font-size:13px;color:#6b7280;line-height:1.8;">
          <strong style="color:#0f172a;">${t("nextSteps")}</strong><br/>
          &#10003; ${t("customize")}<br/>
          &#10003; ${t("share")}<br/>
          &#10003; ${t("analytics")}
        </td>
      </tr>
    </table>
    ${muted(t("reason"))}
    `
  );

  await send(to, t("subject", { app: APP_NAME }), html);
}

// ── Lead notification email ────────────────────────────────────────────────
export async function sendLeadNotificationEmail({
  to, ownerName, leadName, leadEmail, leadPhone, leadMessage, cardName, dashboardUrl,
}: {
  to: string;
  ownerName: string;
  leadName: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  leadMessage?: string | null;
  cardName: string;
  dashboardUrl: string;
}) {
  const locale = await recipientLocale(to);
  const t = translator(locale, leadNotificationDe, leadNotificationIt);
  const rows = [
    leadEmail ? `<tr><td style="color:#6b7280;padding:4px 0;width:80px;">${t("email")}</td><td style="padding:4px 0;"><a href="mailto:${esc(leadEmail)}" style="color:#0f172a;">${esc(leadEmail)}</a></td></tr>` : "",
    leadPhone ? `<tr><td style="color:#6b7280;padding:4px 0;">${t("phone")}</td><td style="padding:4px 0;">${esc(leadPhone)}</td></tr>` : "",
    leadMessage ? `<tr><td style="color:#6b7280;padding:4px 0;vertical-align:top;">${t("message")}</td><td style="padding:4px 0;">${esc(leadMessage)}</td></tr>` : "",
  ].filter(Boolean).join("");

  const html = layout(
    locale,
    esc(t("title", { card: cardName })),
    `
    ${h1(t("heading"))}
    ${p(t("body", { lead: strong(leadName), card: strong(cardName) }))}
    <table style="margin:16px 0;font-size:14px;line-height:1.6;width:100%;">
      <tr><td style="color:#6b7280;padding:4px 0;width:80px;">${t("name")}</td><td style="padding:4px 0;font-weight:600;">${esc(leadName)}</td></tr>
      ${rows}
    </table>
    <div style="text-align:center;">
      ${btn(t("viewLeads"), esc(dashboardUrl))}
    </div>
    ${muted(t("reason"))}
    `
  );

  await send(to, t("subject", { lead: leadName, card: cardName }), html);
}

// ── Org frozen email ──────────────────────────────────────────────────────
export async function sendOrgFrozenEmail({
  to, adminName, orgName, upgradeUrl,
}: {
  to: string;
  adminName: string;
  orgName: string;
  upgradeUrl: string;
}) {
  const locale = await recipientLocale(to);
  const t = translator(locale, orgFrozenDe, orgFrozenIt);
  const html = layout(
    locale,
    esc(t("title", { org: orgName })),
    `
    ${h1(t("heading"))}
    ${p(t("intro", { name: esc(adminName.split(" ")[0]), org: strong(orgName) }))}
    ${p(t("description", { app: esc(APP_NAME) }))}
    <table style="margin:16px 0;border-radius:8px;background:#fef3c7;padding:16px;width:100%;border-left:4px solid #f59e0b;">
      <tr><td style="font-size:14px;color:#92400e;line-height:1.6;">
        <strong>${t("suspendedTitle")}</strong><br/>
        &bull; ${t("members")}<br/>
        &bull; ${t("design")}<br/>
        &bull; ${t("import")}<br/>
        &bull; ${t("directory")}<br/><br/>
        <strong>${t("retainedTitle")}</strong><br/>
        &bull; ${t("cards")}<br/>
        &bull; ${t("analytics")}<br/>
        &bull; ${t("membership")}
      </td></tr>
    </table>
    ${p(t("reactivate"))}
    <div style="text-align:center;">
      ${btn(t("subscribe"), esc(upgradeUrl))}
    </div>
    ${muted(t("reason"))}
    `
  );
  await send(to, t("subject", { org: orgName }), html);
}

// ── Org restored email ─────────────────────────────────────────────────────
export async function sendOrgRestoredEmail({
  to, adminName, orgName, dashboardUrl,
}: {
  to: string;
  adminName: string;
  orgName: string;
  dashboardUrl: string;
}) {
  const locale = await recipientLocale(to);
  const t = translator(locale, orgRestoredDe, orgRestoredIt);
  const html = layout(
    locale,
    esc(t("title", { org: orgName })),
    `
    ${h1(t("heading"))}
    ${p(t("intro", { name: esc(adminName.split(" ")[0]), org: strong(orgName) }))}
    ${p(t("description"))}
    <div style="text-align:center;">
      ${btn(t("team"), esc(dashboardUrl))}
    </div>
    ${muted(t("reason"))}
    `
  );
  await send(to, t("subject", { org: orgName }), html);
}

// ── Email change notification ──────────────────────────────────────────────
export async function sendEmailChangeNotification({
  to, newEmail, userId,
}: {
  to: string;
  newEmail: string;
  userId: string;
}) {
  const locale = await recipientLocale(to, userId);
  const t = translator(locale, emailChangeNotificationDe, emailChangeNotificationIt);
  const html = layout(
    locale,
    esc(t("subject", { app: APP_NAME })),
    `
    ${h1(t("heading"))}
    ${p(t("intro", { app: esc(APP_NAME) }))}
    ${p(t("newAddress", { email: strong(newEmail) }))}
    ${p(t("security"))}
    ${muted(t("reason"))}
    `
  );
  await send(to, t("subject", { app: APP_NAME }), html);
}

// ── Password reset email ───────────────────────────────────────────────────
export async function sendPasswordResetEmail({
  to, url,
}: {
  to: string;
  url: string;
}) {
  const locale = await recipientLocale(to);
  const t = translator(locale, passwordResetDe, passwordResetIt);
  const html = layout(
    locale,
    esc(t("subject", { app: APP_NAME })),
    `
    ${h1(t("heading"))}
    ${p(t("body", { app: esc(APP_NAME) }))}
    <div style="text-align:center;">
      ${btn(t("heading"), esc(url))}
    </div>
    ${muted(t("expiry", { url: esc(url) }))}
    `
  );
  await send(to, t("subject", { app: APP_NAME }), html);
}
