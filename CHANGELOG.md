# Changelog

All notable changes to CardNexus are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added

#### Lead notifications
- Users can choose their notification preference in **Settings → Lead-Benachrichtigungen**: off, instant, or daily digest
- Instant mode: sends an email immediately when a visitor submits the contact form on your card
- The preference is stored per user (`leadNotification` column) and respected by the leads API

#### Wallet integration (Apple & Google)
- Full Apple Wallet pass generation (`/api/wallet/apple/[slug]`) — produces a signed `.pkpass` file
- Full Google Wallet pass URL generation (`/api/wallet/google/[slug]`) — returns a `pay.google.com/gp/v/save/…` URL signed with a service account JWT
- Both providers activate automatically when the required env vars are set (see README); no restart needed
- The "In Wallet speichern" button on public card pages now works: iOS devices receive a `.pkpass`, Android and others get redirected to Google Wallet
- `appleWalletEnabled()` and `googleWalletEnabled()` helper functions for conditional UI

#### Card sharing — WhatsApp & Email
- Two new share buttons appear below the existing share/QR row on every public card page
- **WhatsApp**: opens `wa.me/?text=…` with the card name and URL pre-filled
- **E-Mail**: opens `mailto:?subject=…&body=…` with the card name and URL
- Both buttons respect the `hideShareButton` card setting

#### Card approval workflow
- Organization admins can enable **Manager Approval** in org settings (`managerApproval`)
- When enabled, any save by a `member` sets the card's `approvalStatus` to `pending` instead of publishing immediately
- Admins and team leaders see a **"Karten zur Freigabe"** section in the Team page listing all pending cards
- Each pending card can be approved or rejected (with an optional rejection note) via `POST /api/cards/[slug]/approve`
- The card editor shows an amber banner for `pending` cards and a red banner for `rejected` cards (with the rejection note)
- New DB columns: `Card.approvalStatus` (default `approved`), `Card.approvalNote`

#### Analytics — top clicked links
- `topLinks` added to the analytics API response: top-10 custom and social links by click count
- Displayed as a ranked bar chart in the Analytics dashboard
- Data is sourced from existing `CardAnalytic.linkLabel` tracking (no schema changes needed)

#### Widget / iFrame embed
- New page at `/widget` in the dashboard sidebar
- Enter your card slug, set width and height, get the iFrame code instantly
- Live preview renders the card inline so you can verify before copying

### Changed
- `app/api/account` PATCH handler now accepts `leadNotification` in addition to `email` — both in a single unified schema
- `docker-entrypoint.sh` now seeds the demo user (`demo@cardnexus.app / demo1234`) on first run, matching `prisma/seed.ts`
- README: feature table updated, Wallet setup section added, Roadmap trimmed to remove completed items
- Sidebar: **Widget** entry added under Organisation

### Fixed
- Next.js error `You cannot use different slug names for the same dynamic path ('id' !== 'slug')`: moved the clone sub-route from `app/api/cards/[id]/clone` to `app/api/cards/clone/[id]` and updated `CardSwitcher.tsx` accordingly

---

## [1.5.0] — 2026-04-xx

- UTM analytics, security hardening, UI/UX standards

## [1.4.0] — 2026-04-xx

- TOTP MFA, security hardening, account & integrations UI

## [1.3.0] — 2026-04-xx

- Overlay z-index fix, price & env updates

## [1.2.0] — 2026-04-xx

- Multiple cards, webhooks, API keys, referrals, org analytics/leads, bulk invite

## [1.1.0] — 2026-04-xx

- Hide-share toggle, 3 new card templates (Elegant, Gradient, Wave)
