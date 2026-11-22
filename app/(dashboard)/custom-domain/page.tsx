import { getPlatformSettings } from "@/lib/platform";
import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/pages/custom-domain.json";
import it from "@/messages/it/pages/custom-domain.json";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Server, CheckCircle } from "lucide-react";

export async function generateMetadata() {
  return { title: translator(await getLocale(), de, it)("title") };
}

export default async function CustomDomainPage() {
  const [locale, { appName }] = await Promise.all([getLocale(), getPlatformSettings()]);
  const t = translator(locale, de, it);
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
          {t("back")}
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6" />
          {t("heading")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("intro")}
        </p>
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">1</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold">{t("buy")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("buyHint")}
              </p>
              <div className="bg-muted rounded-lg p-3 text-sm font-mono">
                {t("example")}
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">2</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold">{t("dns")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("dnsStart")} <strong>{t("cname")}</strong> {t("dnsEnd")}
              </p>
              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm font-mono">
                <div className="grid grid-cols-3 gap-4 text-muted-foreground text-xs uppercase tracking-wide mb-2">
                  <span>{t("type")}</span><span>{t("name")}</span><span>{t("target")}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>CNAME</span>
                  <span>karte</span>
                  <span className="break-all">{appHost}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("rootStart")} <strong>{t("recordA")}</strong> {t("rootEnd")}
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">3</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold">{t("proxy")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("proxyHint", { appName })}
              </p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">{t("caddy")}</p>
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
              <h2 className="font-semibold">{t("add")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("addStart")} <strong>{t("designPath")}</strong> {t("addEnd")}
              </p>
              <Link href="/card" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <CheckCircle className="h-4 w-4" />
                {t("open")}
              </Link>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex gap-2">
          <Server className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{t("routing")}</p>
            <p className="mt-0.5">{t("routingStart", { appName })} <code className="font-mono text-xs">Host</code>{t("routingEnd")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
