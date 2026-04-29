import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const card = await db.card.findUnique({
    where: { slug },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!card || !card.isPublic) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    data: { ...card, customLinks: JSON.parse(card.customLinks) },
  });
}
