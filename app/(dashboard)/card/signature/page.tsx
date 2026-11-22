import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/pages/signature-overview.json";
import it from "@/messages/it/pages/signature-overview.json";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SignatureClient } from "./client";
import type { CardData } from "@/types";

export async function generateMetadata() {
  return { title: translator(await getLocale(), de, it)("title") };
}

export default async function SignaturePage() {
  const locale = await getLocale();
  const t = translator(locale, de, it);
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string };

  const raw = await db.card.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  if (raw.length === 0) redirect("/card");

  const cards = raw.map((c) => ({
    ...c,
    firstName:   c.firstName ?? "",
    lastName:    c.lastName  ?? "",
    customLinks: JSON.parse(c.customLinks as unknown as string || "[]"),
  })) as CardData[];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("description")}
        </p>
      </div>
      <SignatureClient card={cards[0]} allCards={cards} />
    </div>
  );
}
