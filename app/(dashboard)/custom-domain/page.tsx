import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Server, CheckCircle } from "lucide-react";

export const metadata = { title: "Domain einrichten – CardNexus" };

export default async function CustomDomainPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "yourserver.com";
  const appHost = host;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/card" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurück zur Karte
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6" />
          Eigene Domain einrichten
        </h1>
        <p className="text-muted-foreground mt-1">
          So verlinkst du deine eigene Domain mit deiner digitalen Visitenkarte.
        </p>
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">1</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold">Domain kaufen oder auswählen</h2>
              <p className="text-sm text-muted-foreground">
                Kaufe eine Domain bei einem Anbieter deiner Wahl (z.&nbsp;B. Namecheap, IONOS, Hetzner, Cloudflare) oder nutze eine vorhandene Subdomain.
              </p>
              <div className="bg-muted rounded-lg p-3 text-sm font-mono">
                Beispiel: karte.meinefirma.de
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">2</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold">DNS-Eintrag setzen</h2>
              <p className="text-sm text-muted-foreground">
                Setze im DNS-Verwaltungsbereich deines Domain-Anbieters einen <strong>CNAME-Eintrag</strong> auf den Server dieser Plattform:
              </p>
              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm font-mono">
                <div className="grid grid-cols-3 gap-4 text-muted-foreground text-xs uppercase tracking-wide mb-2">
                  <span>Typ</span><span>Name</span><span>Ziel</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>CNAME</span>
                  <span>karte</span>
                  <span className="break-all">{appHost}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Für eine Root-Domain (ohne Subdomain) nutze stattdessen einen <strong>A-Eintrag</strong> auf die IP-Adresse des Servers.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">3</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold">Reverse Proxy konfigurieren</h2>
              <p className="text-sm text-muted-foreground">
                Damit HTTPS funktioniert, muss der Reverse Proxy (z.&nbsp;B. Caddy) die Domain akzeptieren und an CardNexus weiterleiten.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Caddy (empfohlen — HTTPS automatisch):</p>
                <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">{`karte.meinefirma.de {
    reverse_proxy cardnexus:3000
}`}</pre>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Nginx:</p>
                <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">{`server {
    listen 80;
    server_name karte.meinefirma.de;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">4</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold">Domain in den Karteneinstellungen eintragen</h2>
              <p className="text-sm text-muted-foreground">
                Trage deine Domain im Tab <strong>Design → Karten-Domain</strong> deines Karteneditors ein. Deine QR-Codes, NFC-Links und Kampagnen-URLs verwenden dann automatisch diese Domain.
              </p>
              <Link href="/card" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <CheckCircle className="h-4 w-4" />
                Zur Karte
              </Link>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex gap-2">
          <Server className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Middleware-Routing</p>
            <p className="mt-0.5">CardNexus erkennt automatisch Anfragen über deine Domain und leitet sie an die richtige Karte weiter — vorausgesetzt, der Reverse Proxy sendet den korrekten <code className="font-mono text-xs">Host</code>-Header.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
