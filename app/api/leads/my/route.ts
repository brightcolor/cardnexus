import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = await db.card.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!card) return NextResponse.json({ leads: [] });

  const leads = await db.lead.findMany({
    where: { cardId: card.id },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ leads });
}

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id: string };

  const card = await db.card.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!card) return NextResponse.json({ error: "Keine Karte" }, { status: 400 });

  // Verify lead belongs to this user's card before deleting
  const lead = await db.lead.findUnique({ where: { id }, select: { cardId: true } });
  if (!lead || lead.cardId !== card.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  await db.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
