import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/pages/not-found.json";
import it from "@/messages/it/pages/not-found.json";
import en from "@/messages/en/pages/not-found.json";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const locale = await getLocale();
  const t = translator(locale, de, it, en);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <p className="text-7xl font-bold text-muted-foreground mb-4">404</p>
      <h1 className="text-2xl font-semibold mb-2">{t("heading")}</h1>
      <p className="text-muted-foreground mb-8">{t("description")}</p>
      <Button asChild>
        <Link href="/">{t("home")}</Link>
      </Button>
    </div>
  );
}
