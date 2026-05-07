export interface ChangelogEntry {
  version: string;
  date: string;       // ISO date string
  changes: { type: "feature" | "fix"; text: string }[];
}

export const CHANGELOG: ChangelogEntry[] = [
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
      { type: "feature", text: "Bulk CSV-Import für Teams" },
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
