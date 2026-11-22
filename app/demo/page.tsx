import Link from "next/link";
import { ModernTemplate } from "@/components/card/templates/Modern";
import { Button } from "@/components/ui/button";
import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/pages/demo.json";
import it from "@/messages/it/pages/demo.json";
import en from "@/messages/en/pages/demo.json";

export async function generateMetadata() {
  const t = translator(await getLocale(), de, it, en);
  return { title: t("title") };
}

export default async function DemoPage() {
  const t = translator(await getLocale(), de, it, en);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-10">
      <p className="text-sm font-medium text-muted-foreground">{t("title")}</p>
      <ModernTemplate card={{
        firstName: "Max",
        lastName: "Hoffmann",
        title: t("role"),
        company: "TechCorp",
        email: "max@example.com",
      }} />
      <Button variant="outline" asChild>
        <Link href="/">{t("back")}</Link>
      </Button>
    </main>
  );
}
