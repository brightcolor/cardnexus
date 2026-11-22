import { getLocale } from "@/lib/i18n/server";
import { translator } from "@/lib/i18n/messages";
import de from "@/messages/de/pages/admin-access-log.json";
import it from "@/messages/it/pages/admin-access-log.json";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AccessLogClient } from "./client";

export async function generateMetadata() {
  return { title: translator(await getLocale(), de, it)("title") };
}

const PAGE_SIZE = 50;

export default async function AccessLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; event?: string; cardSlug?: string; days?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if ((session?.user as { role?: string } | undefined)?.role !== "super_admin") redirect("/dashboard");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const days = sp.days ? Math.max(1, Math.min(365, parseInt(sp.days))) : undefined;
  const eventFilter = sp.event || undefined;
  const cardSlugFilter = sp.cardSlug || undefined;

  const where = {
    ...(eventFilter ? { event: eventFilter } : {}),
    ...(cardSlugFilter ? { cardSlug: cardSlugFilter } : {}),
    ...(days ? { createdAt: { gte: new Date(Date.now() - days * 86400_000) } } : {}),
  };

  const [entries, total, cards] = await Promise.all([
    db.cardAnalytic.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.cardAnalytic.count({ where }),
    db.card.findMany({ select: { slug: true, name: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <AccessLogClient
      entries={entries.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }))}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
      cards={cards}
      filters={{ event: eventFilter, cardSlug: cardSlugFilter, days: sp.days }}
    />
  );
}
