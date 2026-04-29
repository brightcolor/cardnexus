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

One command. That's it.

```bash
curl -sL https://raw.githubusercontent.com/brightcolor/cardnexus/main/docker-compose.yml \
  | BETTER_AUTH_SECRET=$(openssl rand -base64 32) docker compose -f - up -d
```

Open **http://localhost:3000** and log in with `admin@example.com` / `admin123`.

> **Change the admin password immediately** after first login.

<details>
<summary>Alternative: docker run</summary>

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
| **4 card templates** | Classic, Modern, Minimal, Dark |
| **Brand customization** | Primary color, accent color, font family, layout style, corner radius |
| **Avatar & cover photo** | Upload profile picture and cover background |
| **Full contact block** | Phone, mobile, email, website, address |
| **Social links** | LinkedIn, Xing, Twitter, Instagram, GitHub, YouTube |
| **Custom link buttons** | Up to 5 branded CTAs on your card (e.g. "Book a call") |
| **vCard download** | One tap adds all contacts to phone address book |
| **QR code** | Per-card QR code, color-matched, downloadable as SVG |
| **Analytics** | See who viewed your card, from where, on which device |
| **Public / private toggle** | Hide your card from the public at any time |

### For organization admins

| Feature | Description |
|---------|-------------|
| **Design defaults** | Set default template, font, layout and accent color for all new cards |
| **Brand color palette** | Define a set of approved colors members can pick from |
| **Permission matrix** | Control per-organization: can members change template, color, font, layout? |
| **Department policies** | Override permissions per department (e.g. Marketing = free design, Legal = locked) |
| **Card footer text** | Append a company tagline or disclaimer to every card |
| **Analytics** | Aggregate view / download / scan stats across the whole organization |

### For super admins

| Feature | Description |
|---------|-------------|
| **Platform branding** | Set app name, URL, favicon and logo — white-label ready |
| **Organization management** | Create, configure and assign users to organizations |
| **User management** | View all users, change roles, assign organizations |
| **Platform analytics** | Global stats: total users, cards, views, downloads |

### Platform

| Feature | Description |
|---------|-------------|
| **Self-hostable** | Docker image, SQLite by default, Postgres-ready via Prisma |
| **Multi-tenant** | Unlimited organizations, each with their own settings |
| **Role system** | `super_admin` → `company_admin` → `team_leader` → `member` |
| **Invitation flow** | Invite members by email with role-scoped tokens |
| **Apple & Google Wallet** | Infrastructure ready — enable when you add certificates |
| **Image uploads** | Local storage by default, swap to S3 by pointing the upload handler |

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
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Database (SQLite by default; change to postgres:// for PostgreSQL)
DATABASE_URL=file:/app/data/app.db
```

All platform settings (app name, logo, favicon, support email, footer) can be changed at runtime from the **Super Admin → Settings** panel — no restart required.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components) |
| Language | TypeScript 5 |
| Auth | [better-auth](https://better-auth.com) |
| Database | Prisma 6 + SQLite (Postgres-ready) |
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
- [ ] Apple Wallet pass generation
- [ ] Google Wallet pass generation
- [ ] Email delivery (invite emails, welcome)
- [ ] SCIM / LDAP directory sync
- [ ] Zapier / webhook integration
- [ ] Lead capture form on public card
- [ ] CSV export of card analytics

---

## License

MIT — see [LICENSE](./LICENSE)

---

<div align="center">

Built with ❤️ · [Report a bug](https://github.com/brightcolor/cardnexus/issues) · [Request a feature](https://github.com/brightcolor/cardnexus/discussions)

</div>
