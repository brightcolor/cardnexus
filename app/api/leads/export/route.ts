import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const rows = [
    "Datum,Name,E-Mail,Telefon,Nachricht,Karte",
    ...leads.map((l) => {
      const date = l.createdAt.toLocaleDateString("de-DE");
      const cardName = cardNameMap.get(l.cardId) ?? "";
      const escape = (v: string | null | undefined) => {
        const s = v ?? "";
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };
      return [date, l.name, l.email, l.phone, l.message, cardName]
        .map(escape)
        .join(",");
    }),
  ].join("\n");

  return new NextResponse(rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="leads.csv"',
    },
  });
}
