<div align="center">

<br />

<img src="https://raw.githubusercontent.com/brightcolor/cardnexus/main/public/logo.png" alt="CardNexus" width="72" height="72" style="border-radius:16px" />

# CardNexus

**Open-source digital business card platform**

Share your contact details with a tap, scan or link — no app required.  
Built for teams and organizations.

<br />

[![Docker](https://img.shields.io/badge/docker-ghcr.io%2Fbrightcolor%2Fcardnexus-0db7ed?logo=docker&logoColor=white)](https://github.com/brightcolor/cardnexus/pkgs/container/cardnexus)
[![License](https://img.shields.io/badge/license-MIT-22c55e)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma)](https://www.prisma.io)
[![CI](https://github.com/brightcolor/cardnexus/actions/workflows/docker.yml/badge.svg)](https://github.com/brightcolor/cardnexus/actions/workflows/docker.yml)

<br />

</div>

---

## Quick start

One command. Clones the repo to `/opt/cardnexus`, generates a secret and starts everything.

```bash
curl -fsSL https://raw.githubusercontent.com/brightcolor/cardnexus/main/quickstart.sh | sudo sh
```

Open **http://&lt;your-ip&gt;:3000** and log in with `admin@example.com` / `admin123`.

> **Change the admin password immediately** after first login.

The script:
- Creates `/opt/cardnexus` and clones the repository there
- Generates a random `BETTER_AUTH_SECRET` and writes `.env`
- Pulls the Docker image and starts the stack via `docker compose`
- On re-run: pulls the latest code and image instead of re-installing

<details>
<summary>Manual setup</summary>

```bash
git clone https://github.com/brightcolor/cardnexus.git /opt/cardnexus
cd /opt/cardnexus
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" > .env
echo "APP_URL=http://your-server-ip:3000" >> .env
docker compose up -d
```

</details>

<details>
<summary>docker run (one-liner, no git)</summary>

```bash
docker run -d \
  --name cardnexus \
  -p 3000:3000 \
  -v cardnexus-db:/app/data \
  -v cardnexus-uploads:/app/public/uploads \
  -e BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  -e APP_URL="http://localhost:3000" \
  ghcr.io/brightcolor/cardnexus:latest
```

</details>

---

## What is CardNexus?

CardNexus is a self-hosted **digital business card platform** that replaces paper business cards. Every person gets a personal card page they can share via:

- 📱 **NFC tag** — tap your phone to share instantly
- 🔲 **QR code** — scan to open, no app needed
- 🔗 **Direct link** — share as a URL anywhere
- 📧 **vCard (.vcf)** — one tap saves all contact details to any phone's address book

---

## Features

### For members

| Feature | Description |
|---------|-------------|
| **Personal card page** | Public profile at `yourdomain.com/c/your-name` |
| **12 card templates** | Classic, Modern, Minimal, Dark, Gradient, Glassmorphism, Bold, Elegant, Neon, Corporate, Retro, Wave |
| **Brand customization** | Primary color, accent color, font family, layout style, corner radius |
| **Avatar & cover photo** | Upload profile picture and cover background |
| **Full contact block** | Phone, mobile, email, website, address |
| **Social links** | LinkedIn, Xing, Twitter, Instagram, GitHub, YouTube and more |
| **Custom link buttons** | Branded CTAs on your card (e.g. "Book a call") |
| **Booking URL** | Link directly to your calendar (Cal.com, Calendly, etc.) |
| **Email signature** | Auto-generated HTML signature for Gmail, Outlook and co. |
| **vCard download** | One tap adds all contacts to phone address book |
| **QR code** | Per-card QR code, color-matched, downloadable as SVG |
| **Analytics** | Views, sources, devices, top clicked links — with UTM campaign breakdown |
| **Realtime view counter** | Live updating view count on your dashboard |
| **NFC setup guide** | Step-by-step instructions to program your NFC tag |
| **Lead capture form** | Visitors can leave their contact details on your card (Pro+) |
| **Lead notifications** | Get notified instantly or via daily digest when a new lead comes in (Pro+) |
| **Share via WhatsApp / Email** | One-tap share buttons in addition to native share and clipboard copy |
| **Wallet integration** | Save card to Apple Wallet (.pkpass) or Google Wallet (admin-configured) |
| **Widget / iFrame embed** | Embed your card on any website with auto-generated iFrame code |
| **Public / private toggle** | Hide your card from the public at any time |

### For organization admins

| Feature | Description |
|---------|-------------|
| **Design defaults** | Set default template, font, layout and accent color for all new cards |
| **Brand color palette** | Define a set of approved colors members can pick from |
| **Permission matrix** | Control per-organization: can members change template, color, font, layout? |
| **Department policies** | Override permissions per department (e.g. Marketing = free design, Legal = locked) |
| **Card footer text** | Append a company tagline or disclaimer to every card |
| **Bulk import template** | Define a card template for CSV bulk imports |
| **Team directory** | Searchable directory of all org members |
| **Card approval workflow** | Require admin / team-leader sign-off before member card changes go live |
| **Team analytics** | Aggregate views, downloads, scans and leads across the whole organization |
| **CSV member import** | Bulk-create or update member cards from a CSV file |

### For super admins

| Feature | Description |
|---------|-------------|
| **Platform branding** | Set app name, URL, favicon and logo — white-label ready |
| **Organization management** | Create, configure and assign users to organizations |
| **User management** | View all users, change roles, plans and expiry dates |
| **Plan assignment** | Manually assign Free / Pro / Business plan to any user |
| **Access log** | Full audit trail of every card view, QR scan, vCard download and link click |
| **Platform analytics** | Global stats: total users, cards, views, downloads |

### Platform

| Feature | Description |
|---------|-------------|
| **Subscription plans** | Free / Pro / Business tiers with Stripe payments |
| **Stripe integration** | Checkout, billing portal, webhook handling (subscriptions & renewals) |
| **Email delivery** | Invitation emails and welcome emails via any SMTP provider |
| **Milestone notifications** | Notify users when their card hits 100, 500, 1 000 … views |
| **Self-hostable** | Docker image, SQLite by default, Postgres-ready via Prisma |
| **Multi-tenant** | Unlimited organizations, each with their own settings |
| **Role system** | `super_admin` → `company_admin` → `team_leader` → `member` |
| **Invitation flow** | Invite members by email with role-scoped tokens |
| **Image uploads** | Local storage by default, swap to S3 by pointing the upload handler |

---

## Subscription plans

| | Free | Pro | Business |
|---|---|---|---|
| Cards | 1 | 3 | Unlimited |
| Templates | 4 basic | All 12 | All 12 |
| Custom booking URL | — | ✓ | ✓ |
| Analytics | Basic (30d) | Full (1y) | Full (2y) |
| Lead capture | — | ✓ | ✓ |
| Milestone notifications | — | ✓ | ✓ |
| White-label (no badge) | — | ✓ | ✓ |
| Campaigns / UTM links | — | ✓ | ✓ |
| CSV bulk import | — | — | ✓ |
| Team directory | — | — | ✓ |

Plans can be purchased via Stripe (if configured) or assigned manually by a super admin.

---

## Screenshots

> _Coming soon_

---

## Configuration

Copy `.env.example` to `.env` and adjust:

```env
# Required
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=https://yourdomain.com
APP_URL=https://yourdomain.com

# Database (SQLite by default; change to postgres:// for PostgreSQL)
DATABASE_URL=file:/app/data/app.db

# Stripe (optional — leave empty to disable payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...

# SMTP / Email (optional — leave SMTP_HOST empty to disable)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@example.com
SMTP_PASS=yourpassword
SMTP_FROM=CardNexus <noreply@yourdomain.com>

# Apple Wallet (optional — all 5 required to enable)
# APPLE_WALLET_CERT=<base64-encoded PEM certificate from Apple Developer>
# APPLE_WALLET_KEY=<base64-encoded PEM private key>
# APPLE_WALLET_WWDR=<base64-encoded Apple WWDR certificate>
# APPLE_TEAM_ID=<your 10-char Apple Team ID>
# APPLE_PASS_TYPE_ID=<pass.com.yourcompany.cardnexus>

# Google Wallet (optional — both required to enable)
# GOOGLE_WALLET_ISSUER_ID=<issuer ID from Google Pay & Wallet Console>
# GOOGLE_WALLET_SERVICE_ACCOUNT=<base64-encoded service account JSON>
```

All platform settings (app name, logo, favicon, support email, footer) can be changed at runtime from the **Super Admin → Settings** panel — no restart required.

---

## Stripe setup

1. Create a [Stripe](https://stripe.com) account and get your API keys.
2. Create two recurring products in the Stripe dashboard (Pro Monthly, Business Monthly).
3. Copy the price IDs (`price_...`) and set `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_BUSINESS_MONTHLY`.
4. Set up a webhook endpoint pointing to `https://yourdomain.com/api/stripe/webhook`.
5. Select these events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`.
6. Copy the webhook signing secret and set `STRIPE_WEBHOOK_SECRET`.

If `STRIPE_SECRET_KEY` is not set, the upgrade page shows an email-based fallback instead of Stripe checkout.

---

## Wallet setup

CardNexus supports saving cards to **Apple Wallet** and **Google Wallet**. Both are disabled by default and activate automatically once the required env vars are set.

### Apple Wallet
1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/)
2. Create a **Pass Type ID** in your developer account (e.g. `pass.com.yourcompany.cardnexus`)
3. Generate a signing certificate, download it, and export key + cert as PEM
4. Download the Apple WWDR certificate
5. Base64-encode each PEM file: `base64 -w0 cert.pem`
6. Set `APPLE_WALLET_CERT`, `APPLE_WALLET_KEY`, `APPLE_WALLET_WWDR`, `APPLE_TEAM_ID`, `APPLE_PASS_TYPE_ID`

### Google Wallet
1. Create a project in [Google Pay & Wallet Console](https://pay.google.com/business/console)
2. Create a **Generic Pass class** and note your Issuer ID
3. Create a service account with the **Google Wallet Object Issuer** role
4. Download the service account JSON key and base64-encode it: `base64 -w0 service-account.json`
5. Set `GOOGLE_WALLET_ISSUER_ID` and `GOOGLE_WALLET_SERVICE_ACCOUNT`

---

## Email / SMTP setup

CardNexus sends emails via any standard SMTP server. Configure your provider credentials in `.env`:

- **Invitation emails** — sent when an admin invites a new member
- **Welcome email** — sent after successful registration
- **Lead notifications** — instant or daily digest when a visitor leaves their contact details
- **Password reset** — triggered from the login page

Supported providers: Gmail (app password), Mailgun, SendGrid, Postmark, Brevo, your own SMTP server, etc.

If `SMTP_HOST` is not set, email sending is silently disabled — the app works normally, just without emails.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components) |
| Language | TypeScript 5 |
| Auth | [better-auth](https://better-auth.com) |
| Database | Prisma 6 + SQLite (Postgres-ready) |
| Payments | [Stripe](https://stripe.com) (optional) |
| Email | Nodemailer (SMTP, optional) |
| Styling | Tailwind CSS + Radix UI primitives |
| Charts | Recharts |
| QR codes | `qrcode` (SVG output) |
| Containerization | Docker + GitHub Actions (linux/amd64 + linux/arm64) |

---

## Development

```bash
# 1. Clone & install
git clone https://github.com/brightcolor/cardnexus.git
cd cardnexus
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set BETTER_AUTH_SECRET at minimum

# 3. Set up database & seed admin account
npm run db:push
npm run db:seed

# 4. Start dev server
npm run dev
```

Open http://localhost:3000 — default login: `admin@example.com` / `admin123`

### Useful scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run db:push      # Apply schema changes to DB
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run db:seed      # Create default super-admin
```

---

## Docker

### Build locally

```bash
docker build -t cardnexus .
docker run -d -p 3000:3000 \
  -v cardnexus-db:/app/data \
  -v cardnexus-uploads:/app/public/uploads \
  -e BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  cardnexus
```

### docker-compose (recommended for production)

```bash
# Download compose file
curl -O https://raw.githubusercontent.com/brightcolor/cardnexus/main/docker-compose.yml

# Create .env
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" > .env
echo "APP_URL=https://yourdomain.com" >> .env

# Start
docker compose up -d
```

### Published images

| Tag | Description |
|-----|-------------|
| `latest` | Latest stable build from `main` |
| `main` | Bleeding-edge `main` branch |
| `v1.2.3` | Specific version |

Images are built for **linux/amd64** and **linux/arm64** (Apple Silicon, Raspberry Pi).

---

## Deployment

CardNexus runs anywhere Docker runs. Recommended stack:

- **Reverse proxy** — Caddy or Nginx for HTTPS
- **Database** — SQLite (included) or external Postgres
- **Storage** — local volume (default) or S3-compatible bucket

Example Caddy config:

```
yourdomain.com {
    reverse_proxy cardnexus:3000
}
```

---

## Roadmap

- [ ] PostgreSQL first-class documentation
- [ ] SCIM / LDAP directory sync
- [ ] CSV export of card analytics
- [ ] S3 / object storage documentation

---

## License

MIT — see [LICENSE](./LICENSE)

---

<div align="center">

Built with ❤️ · [Report a bug](https://github.com/brightcolor/cardnexus/issues) · [Request a feature](https://github.com/brightcolor/cardnexus/discussions)

</div>
