import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Smartphone, Nfc, QrCode, Users, BarChart2, Wallet,
  ArrowRight, Check, Shield, Zap,
} from "lucide-react";

const features = [
  {
    icon: Nfc,
    title: "NFC-Ready",
    description: "Kontaktdaten per Tippen teilen – einfach das Smartphone halten.",
  },
  {
    icon: QrCode,
    title: "QR-Code",
    description: "Automatisch generierter QR-Code zum Scannen und Teilen.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Optimiert für den mobilen Abruf – lädt in unter einer Sekunde.",
  },
  {
    icon: Users,
    title: "Team-Verwaltung",
    description: "Verwalte ganze Teams und Abteilungen zentral von einem Ort.",
  },
  {
    icon: BarChart2,
    title: "Analytics",
    description: "Wer sieht deine Karte? Aufrufe, QR-Scans und Downloads im Blick.",
  },
  {
    icon: Wallet,
    title: "Wallet-Integration",
    description: "Apple Wallet & Google Wallet – bald verfügbar.",
  },
];

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Für Einzelpersonen",
    features: ["1 digitale Karte", "QR-Code", "vCard-Download", "Alle Templates"],
    cta: "Kostenlos starten",
    href: "/register",
  },
  {
    name: "Pro",
    price: "5",
    description: "Für Professionals",
    features: ["1 digitale Karte", "Analytics", "Custom Links", "Eigene Farben", "NFC-Link"],
    cta: "Pro testen",
    href: "/register",
    featured: true,
  },
  {
    name: "Business",
    price: "15",
    description: "Für Teams",
    features: ["Unbegrenzte Mitglieder", "Team-Verwaltung", "Rollen & Berechtigungen", "Excel-Import/Export", "Organisations-Branding"],
    cta: "Team starten",
    href: "/register",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
                <span className="text-xs font-bold text-white">FC</span>
              </div>
              <span className="font-semibold text-gray-900">CardNexus</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Anmelden
              </Link>
              <Button asChild size="sm">
                <Link href="/register">Kostenlos starten</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm text-gray-600 mb-8">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          Digitale Visitenkarte der nächsten Generation
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
          Deine Karte.
          <br />
          <span className="text-gray-400">In Sekunden geteilt.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-gray-500 mb-10 leading-relaxed">
          Erstelle deine digitale Visitenkarte, teile sie per NFC-Chip, QR-Code oder Link – und behalte den Überblick mit integrierten Analytics.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">
              Jetzt kostenlos starten
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Anmelden</Link>
          </Button>
        </div>

        {/* Mock card preview */}
        <div className="mt-20 relative">
          <div className="mx-auto max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="h-1.5 bg-gray-900" />
            <div className="p-8">
              <div className="flex items-start gap-4 mb-5">
                <div className="h-16 w-16 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  MH
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Max Hoffmann</h3>
                  <p className="text-sm font-medium text-gray-500">Head of Product</p>
                  <p className="text-sm text-gray-400">TechCorp GmbH</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
                    <Smartphone className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  +49 170 1234567
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
                    <Shield className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  max@techcorp.de
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Alles was du brauchst</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Von der persönlichen Karte bis zur unternehmensweiten Lösung – CardNexus wächst mit dir.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Einfache Preise</h2>
            <p className="text-gray-500">Kein Kleingedrucktes. Jederzeit kündbar.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border-2 ${
                  plan.featured
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-100 bg-white"
                }`}
              >
                <p className="text-sm font-medium mb-1 opacity-60">{plan.description}</p>
                <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">€{plan.price}</span>
                  <span className="text-sm opacity-60">/Monat</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 shrink-0 ${plan.featured ? "text-white" : "text-emerald-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={plan.featured ? "secondary" : "default"}
                  className="w-full"
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-900">
              <span className="text-[10px] font-bold text-white">FC</span>
            </div>
            <span className="text-sm font-medium text-gray-700">CardNexus</span>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} CardNexus. Alle Rechte vorbehalten.</p>
          <div className="flex gap-4 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-700 transition-colors">Datenschutz</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Impressum</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
