export interface ChangelogEntry {
  version: string;
  date: string;       // ISO date string
  changes: { type: "feature" | "fix"; text: string }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.7.0",
    date: "2026-05-10",
    changes: [
      { type: "feature", text: "Org-Freeze: Bei Kündigung des Business-Plans wird die Organisation eingefroren statt gelöscht" },
      { type: "feature", text: "Alle Mitglieder-Daten und Karten bleiben erhalten; bei Wiederbuchung sofortige Reaktivierung" },
      { type: "feature", text: "Frozen-Banner auf der Team-Seite für Admins (mit Upgrade-Link) und Members" },
      { type: "feature", text: "E-Mail-Benachrichtigung an Org-Admins bei Einfrieren und Reaktivierung" },
      { type: "feature", text: "Schema: isActive + frozenAt auf Organization" },
    ],
  },
  {
    version: "1.6.0",
    date: "2026-05-10",
    changes: [
      { type: "feature", text: "Organisation bearbeiten: Name, Farbe, Domain direkt im Admin-Panel" },
      { type: "feature", text: "Organisation löschen: Mitglieder werden automatisch abgemeldet" },
      { type: "feature", text: "Admin einer Organisation zuweisen direkt im Bearbeitungs-Dialog" },
      { type: "feature", text: "Organisation pro User zuweisbar über Dropdown in der Benutzertabelle" },
      { type: "feature", text: "Team-Analytics für Org-Admins: Aufrufe, Downloads, Leads, Top-Karten" },
      { type: "fix",     text: "Lead-Capture auf Karten nur noch verfügbar wenn Karten-Owner Pro/Business hat" },
      { type: "fix",     text: "Selects in der Admin-Benutzertabelle immer sichtbar (bg-muted statt transparent)" },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-05-09",
    changes: [
      { type: "feature", text: "6 E-Mail-Signatur-Stile: Standard, Kompakt, Rich, Modern, Minimal, Dark" },
      { type: "feature", text: "Signatur-Optionen: Farbe, Foto, Social-Links, Karten-Button, Fußzeile" },
      { type: "feature", text: "Klartext-Kopie der Signatur für E-Mail-Clients ohne HTML-Unterstützung" },
      { type: "feature", text: "Organisation selbst erstellen (Business-Plan) mit Slug und Farbe" },
      { type: "feature", text: "CSV-Import-UI für Mitglieder im Team-Bereich" },
      { type: "feature", text: "Version und Build-Zeit im Admin-Bereich" },
      { type: "fix",     text: "Super-Admin sah alle User unter Team statt des Admin-Panels" },
      { type: "fix",     text: "Business-User ohne Organisation konnte Team-Seite nicht nutzen" },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-05-08",
    changes: [
      { type: "feature", text: "GeoIP-Tracking: Land und Stadt in der Analytics" },
      { type: "feature", text: "Erweiterte Metriken: Browser, Betriebssystem, Referrer, Sprache" },
      { type: "feature", text: "Admin Access Log mit allen Karten-Zugriffen und Filtern" },
      { type: "feature", text: "Karten-Limits in der API und UI durchgesetzt (Free: 1, Pro: 3, Business: ∞)" },
      { type: "feature", text: "Klon-Button ausgeblendet wenn Karten-Limit erreicht" },
      { type: "feature", text: "Slug bearbeitbar – alte Slugs leiten automatisch weiter (CardSlugAlias)" },
      { type: "feature", text: "Analytics-Direktlink im Karten-Editor und Dashboard" },
      { type: "feature", text: "Dashboard-Übersicht zeigt alle Karten mit 30-Tage-Views" },
      { type: "feature", text: "12 Karten-Templates (3 weitere: Bold, Glass, Retro)" },
      { type: "fix",     text: "Bot- und Crawler-Anfragen werden nicht mehr als Views gezählt" },
      { type: "fix",     text: "Doppelte View-Events beim Teilen der Karte behoben (sessionStorage-Dedup)" },
      { type: "fix",     text: "geoip-lite ENOENT beim Build durch dynamischen Import behoben" },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-05-07",
    changes: [
      { type: "feature", text: "PayPal als Zahlungsmethode" },
      { type: "feature", text: "Freundliche Kampagnen-URLs (Name + ID)" },
      { type: "feature", text: "Custom Domains für Karten" },
      { type: "feature", text: "E-Mail-Adresse ändern in den Einstellungen" },
      { type: "fix",     text: "Plan-Features werden jetzt korrekt erkannt nach dem Zuweisen eines Plans" },
      { type: "fix",     text: "Kampagnen-URLs zeigten localhost statt der echten Domain" },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-05-06",
    changes: [
      { type: "feature", text: "Stripe-Zahlungen: Upgrade direkt aus der App heraus" },
      { type: "feature", text: "E-Mail-Versand: Einladungs- und Willkommens-Mails via SMTP" },
      { type: "feature", text: "Meilenstein-Benachrichtigungen bei 100, 500, 1.000 Aufrufen" },
      { type: "feature", text: "Echtzeit-Aufrufs-Zähler im Dashboard" },
      { type: "feature", text: "Terminbuchungs-Link auf der Karte" },
      { type: "feature", text: "Kampagnen / UTM-Tracking-Links" },
      { type: "feature", text: "NFC-Einrichtungsanleitung" },
      { type: "feature", text: "Lead-Capture-Formular auf öffentlichen Karten" },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-05-01",
    changes: [
      { type: "feature", text: "9 Karten-Templates (Classic, Modern, Minimal, Dark, Bold, Glass, Retro, Neon, Corporate)" },
      { type: "feature", text: "Firmenverzeichnis / Team-Seite" },
      { type: "feature", text: "Abteilungs-Berechtigungen in den Org-Einstellungen" },
      { type: "feature", text: "Bulk CSV-Import für Teams (API)" },
      { type: "feature", text: "E-Mail-Signatur-Generator" },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-04-15",
    changes: [
      { type: "feature", text: "Digitale Visitenkarte mit QR-Code und vCard-Download" },
      { type: "feature", text: "Multi-Tenant-Organisationen mit Rollen" },
      { type: "feature", text: "Analytics (Aufrufe, Geräte, Quellen)" },
      { type: "feature", text: "Avatar- und Cover-Bild-Upload" },
      { type: "feature", text: "Öffentliche / private Karten-Umschaltung" },
    ],
  },
];
