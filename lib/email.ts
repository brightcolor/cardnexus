import nodemailer from "nodemailer";

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

// ── Base layout ────────────────────────────────────────────────────────────
function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="de">
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
              &copy; ${new Date().getFullYear()} ${APP_NAME}. Alle Rechte vorbehalten.<br />
              Diese E-Mail wurde automatisch generiert. Bitte nicht antworten.
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
export async function sendInvitationEmail({
  to, senderName, orgName, role, inviteUrl,
}: {
  to: string;
  senderName: string;
  orgName: string;
  role: string;
  inviteUrl: string;
}) {
  const roleLabel: Record<string, string> = {
    company_admin: "Administrator",
    team_leader:   "Team Leader",
    member:        "Mitglied",
  };

  const html = layout(
    esc(`Einladung zu ${orgName}`),
    `
    ${h1(`Du wurdest eingeladen`)}
    ${p(`<strong>${esc(senderName)}</strong> hat dich eingeladen, ${esc(APP_NAME)} als <strong>${esc(roleLabel[role] ?? role)}</strong> der Organisation <strong>${esc(orgName)}</strong> beizutreten.`)}
    ${p("Erstelle deinen kostenlosen Account und gestalte sofort deine digitale Visitenkarte.")}
    <div style="text-align:center;">
      ${btn("Einladung annehmen", esc(inviteUrl))}
    </div>
    ${muted(`Dieser Link ist 7 Tage gültig. Falls du diese E-Mail nicht erwartet hast, kannst du sie ignorieren.<br/>Link: ${esc(inviteUrl)}`)}
    `
  );

  await send(to, `${senderName} lädt dich zu ${orgName} ein`, html);
}

// ── Welcome email ──────────────────────────────────────────────────────────
export async function sendWelcomeEmail({
  to, name, dashboardUrl,
}: {
  to: string;
  name: string;
  dashboardUrl: string;
}) {
  const html = layout(
    esc(`Willkommen bei ${APP_NAME}`),
    `
    ${h1(`Hallo ${esc(name.split(" ")[0])} 👋`)}
    ${p(`Schön, dass du dabei bist! Dein ${esc(APP_NAME)}-Account ist bereit.`)}
    ${p("Erstelle jetzt deine digitale Visitenkarte, füge deine Kontaktdaten ein und teile sie per Link, QR-Code oder NFC-Chip.")}
    <div style="text-align:center;">
      ${btn("Zum Dashboard", esc(dashboardUrl))}
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;border-top:1px solid #f3f4f6;padding-top:20px;">
      <tr>
        <td style="font-size:13px;color:#6b7280;line-height:1.8;">
          <strong style="color:#0f172a;">Was du als Nächstes tun kannst:</strong><br/>
          &#10003; Karte gestalten &rarr; Template und Farbe wählen<br/>
          &#10003; QR-Code herunterladen oder NFC-Tag einrichten<br/>
          &#10003; Analytics aktivieren und Aufrufe tracken
        </td>
      </tr>
    </table>
    ${muted("Du erhältst diese E-Mail, weil du dich soeben registriert hast.")}
    `
  );

  await send(to, `Willkommen bei ${APP_NAME}!`, html);
}
