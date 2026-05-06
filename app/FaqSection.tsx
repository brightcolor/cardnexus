"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Ist CardNexus wirklich kostenlos?",
    a: "Ja. Der Free-Plan ist dauerhaft kostenlos und enthält eine vollständige digitale Visitenkarte mit QR-Code, vCard-Download und Lead Capture. Ohne Kreditkarte.",
  },
  {
    q: "Brauche ich eine App um meine Karte zu teilen?",
    a: "Nein. Deine Karte ist eine normale Webseite und öffnet sich in jedem Browser. Besucher benötigen keine App. Für NFC-Tags wird eine einmalige Schreib-App benötigt, danach funktioniert es ohne alles.",
  },
  {
    q: "Wie funktioniert NFC?",
    a: "Du beschreibst einen günstigen NFC-Tag (ca. 0,50–2 €) einmalig mit deiner Karten-URL. Hält jemand sein Smartphone an den Tag, öffnet sich deine digitale Karte sofort – bei iPhone ab iPhone 7, bei Android ab Version 4.4.",
  },
  {
    q: "Kann ich CardNexus für mein Team einsetzen?",
    a: "Ja. Mit dem Business-Plan verwaltest du beliebig viele Mitglieder, vergibst Rollen, importierst per CSV und setzt ein einheitliches Firmendesign für alle Karten.",
  },
  {
    q: "Was passiert wenn mein Plan ausläuft?",
    a: "Dein Account wird auf den Free-Plan zurückgestuft. Deine Karte bleibt aktiv, Pro/Business-Features wie Whitelabel oder Kampagnen sind nicht mehr nutzbar bis du verlängerst.",
  },
  {
    q: "Wie kündige ich?",
    a: "Schreib uns einfach eine E-Mail. Es gibt keine Mindestlaufzeit – du kannst monatlich kündigen.",
  },
  {
    q: "Sind meine Daten sicher?",
    a: "Ja. Server und Datenbank liegen in Deutschland. Wir verwenden keine Tracking-Cookies von Drittanbietern und sind vollständig DSGVO-konform.",
  },
  {
    q: "Kann ich meine eigene Domain verwenden?",
    a: "Ab dem Pro-Plan ja. Du kannst deine Karte unter deiner eigenen Domain (z.B. karte.meinefirma.de) erreichbar machen.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-gray-500 text-sm leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
