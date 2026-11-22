import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/pages/imprint.json";
import it from "@/messages/it/pages/imprint.json";
import en from "@/messages/en/pages/imprint.json";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata() {
  return { title: translator(await getLocale(), de, it, en)("title") };
}

export default async function ImpressumPage() {
  const locale = await getLocale();
  const t = translator(locale, de, it, en);
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-10 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {t("home")}
        </Link>

        <h1 className="text-3xl font-bold mb-8">{t("heading")}</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("publisher")}</h2>
            <p>
              {t("publisherName")}<br />
              {t("publisherAddress")}<br />
              {t("publisherCity")}<br />
              {t("country")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("contact")}</h2>
            <p>
              {t("email")} <a href="mailto:kontakt@cardnexus.app" className="text-blue-600 hover:underline">kontakt@cardnexus.app</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("responsible")}</h2>
            <p>
              {t("responsibleName")}<br />
              {t("responsibleAddress")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("liability")}</h2>
            <p className="text-sm leading-relaxed">
              {t("liabilityText")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("disputes")}</h2>
            <p className="text-sm leading-relaxed">
              {t("disputeIntro")} <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://ec.europa.eu/consumers/odr</a>{t("disputeDetails")}
            </p>
          </section>
        </div>

        <p className="mt-10 text-xs text-gray-400 dark:text-gray-500">
          {t("templateReminder")}
        </p>
      </div>
    </div>
  );
}
