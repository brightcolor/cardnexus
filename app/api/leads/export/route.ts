import { apiMessage } from "@/lib/i18n/api";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildCsv } from "@/lib/csv";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/pages/leads.json";
import it from "@/messages/it/pages/leads.json";
import en from "@/messages/en/pages/leads.json";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: await apiMessage("unauthorized") }, { status: 401 });

  const cards = await db.card.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });

  const cardIds = cards.map((c) => c.id);
  const cardNameMap = new Map(cards.map((c) => [c.id, c.name]));

  const leads = await db.lead.findMany({
    where: { cardId: { in: cardIds } },
    orderBy: { createdAt: "desc" },
  });

  const locale = await getLocale();
  const labels = { de, it, en }[locale];
  const csv = buildCsv(
    [labels.csvDate, labels.csvName, labels.csvEmail, labels.csvPhone, labels.csvMessage, labels.csvCard],
    leads.map((l) => [
      l.createdAt.toLocaleDateString(locale),
      l.name,
      l.email,
      l.phone,
      l.message,
      cardNameMap.get(l.cardId) ?? "",
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="leads.csv"',
    },
  });
}
