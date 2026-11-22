import { getLocale } from "@/lib/i18n/server";
import { translator } from "@/lib/i18n/messages";
import de from "@/messages/de/pages/widget.json";
import it from "@/messages/it/pages/widget.json";
import en from "@/messages/en/pages/widget.json";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { effectivePlan, getPlanFeatures } from "@/lib/plans";
import { WidgetClient } from "./client";

export async function generateMetadata() {
  return { title: translator(await getLocale(), de, it, en)("title") };
}

export default async function WidgetPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string };

  const [dbUser, cards] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: { plan: true, planExpiresAt: true },
    }),
    db.card.findMany({
      where: { userId: user.id },
      select: { slug: true, name: true },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
  ]);

  const plan = effectivePlan(dbUser?.plan ?? "free", dbUser?.planExpiresAt);
  const { maxCards } = getPlanFeatures(plan);
  const canSelectMultiple = maxCards > 1;

  return (
    <WidgetClient
      cards={cards.map((c) => ({ slug: c.slug, name: c.name ?? c.slug }))}
      canSelectMultiple={canSelectMultiple}
    />
  );
}
