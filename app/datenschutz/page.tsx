import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/pages/privacy.json";
import it from "@/messages/it/pages/privacy.json";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata() {
  return { title: translator(await getLocale(), de, it)("title") };
}

export default async function DatenschutzPage() {
  const locale = await getLocale();
  const t = translator(locale, de, it);
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-10 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {t("home")}
        </Link>

        <h1 className="text-3xl font-bold mb-2">{t("heading")}</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">{t("updated", { date: new Date().toLocaleDateString(locale, { year: "numeric", month: "long" }) })}</p>

        <div className="space-y-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("controller")}</h2>
            <p>{t("controllerData")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("dataCollected")}</h2>
            <p>{t("dataIntro")}</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>{t("accountData")}</li>
              <li>{t("cardData")}</li>
              <li>{t("analyticsData")}</li>
              <li>{t("leadData")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("purpose")}</h2>
            <p>{t("purposeDescription")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("location")}</h2>
            <p>{t("locationDescription")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("cookies")}</h2>
            <p>{t("cookiesDescription")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("rights")}</h2>
            <p>{t("rightsDescription")} <a href="mailto:kontakt@cardnexus.app" className="text-blue-600 hover:underline">kontakt@cardnexus.app</a></p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("complaints")}</h2>
            <p>{t("complaintsDescription")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("retention")}</h2>
            <p>{t("retentionDescription")}</p>
          </section>
        </div>

        <p className="mt-10 text-xs text-gray-400 dark:text-gray-500">
          {t("templateReminder")}
        </p>
      </div>
    </div>
  );
}
