import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/pages/lead-overview.json";
import it from "@/messages/it/pages/lead-overview.json";
import en from "@/messages/en/pages/lead-overview.json";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LeadsClient } from "./client";
import type { Lead } from "@/types";

export async function generateMetadata() {
  return { title: translator(await getLocale(), de, it, en)("title") };
}

export default async function LeadsPage() {
  const locale = await getLocale();
  const t = translator(locale, de, it, en);
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string };

  const card = await db.card.findFirst({
    where: { userId: user.id, isDefault: true },
    select: { id: true, slug: true },
  });

  const leads: Lead[] = card
    ? (await db.lead.findMany({
        where: { cardId: card.id },
        orderBy: { createdAt: "desc" },
        take: 500,
      })).map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))
    : [];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("description")}
        </p>
      </div>
      <LeadsClient leads={leads} hasCard={!!card} />
    </div>
  );
}
