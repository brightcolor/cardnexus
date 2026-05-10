import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Datenschutz – CardNexus" };

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-10 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Startseite
        </Link>

        <h1 className="text-3xl font-bold mb-2">Datenschutzerklärung</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">Stand: {new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long" })}</p>

        <div className="space-y-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">1. Verantwortlicher</h2>
            <p>[Name und Adresse wie im Impressum]</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">2. Erhobene Daten</h2>
            <p>Wir erheben und verarbeiten folgende personenbezogene Daten:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Accountdaten (Name, E-Mail-Adresse, Passwort-Hash)</li>
              <li>Profildaten deiner digitalen Visitenkarte (Name, Kontakt, Foto)</li>
              <li>Nutzungsstatistiken (Aufrufe, Gerättyp, Quelle – ohne persönliche Identifikation)</li>
              <li>Lead-Kontaktdaten die Besucher freiwillig hinterlassen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">3. Zweck der Verarbeitung</h2>
            <p>Die Daten werden ausschließlich zur Bereitstellung des CardNexus-Dienstes verarbeitet. Keine Weitergabe an Dritte zu Werbezwecken.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">4. Speicherort</h2>
            <p>Alle Daten werden ausschließlich auf Servern in Deutschland gespeichert.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">5. Cookies</h2>
            <p>Wir verwenden ausschließlich technisch notwendige Session-Cookies zur Authentifizierung. Keine Tracking- oder Marketing-Cookies von Drittanbietern.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">6. Deine Rechte</h2>
            <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit (Art. 15–20 DSGVO). Wende dich dazu an: <a href="mailto:kontakt@cardnexus.app" className="text-blue-600 hover:underline">kontakt@cardnexus.app</a></p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">7. Beschwerderecht</h2>
            <p>Du hast das Recht, dich bei einer Datenschutzaufsichtsbehörde zu beschweren. Zuständig ist die Behörde des Bundeslandes, in dem du wohnst.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">8. Löschfristen</h2>
            <p>Analytics-Daten werden je nach Plan nach 30, 365 oder 730 Tagen automatisch gelöscht. Account-Daten werden auf Anfrage sofort gelöscht.</p>
          </section>
        </div>

        <p className="mt-10 text-xs text-gray-400 dark:text-gray-500">
          Diese Datenschutzerklärung ist ein Muster und muss von einem Rechtsanwalt auf deine konkrete Situation angepasst werden.
        </p>
      </div>
    </div>
  );
}
