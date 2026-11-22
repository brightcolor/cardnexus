import { apiMessage } from "@/lib/i18n/api";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canReadCard, publicCardFields, publishedCardScope } from "@/lib/card-publication";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const card = await db.card.findUnique({
    where: { slug, ...publishedCardScope },
    select: { ...publicCardFields, expiresAt: true, passwordHash: true },
  });

  if (!card) {
    return NextResponse.json({ error: await apiMessage("missing") }, { status: 404 });
  }

  // Hide expiry-elapsed and password-protected cards from the public endpoint.
  if (card.expiresAt && card.expiresAt < new Date()) {
    return NextResponse.json({ error: await apiMessage("cardExpired") }, { status: 410 });
  }
  if (!await canReadCard(card)) {
    return NextResponse.json({ error: await apiMessage("cardProtected") }, { status: 401 });
  }

  // Strip server-only fields before returning.
  const { passwordHash: _ph, expiresAt: _expiresAt, ...safe } = card;
  return NextResponse.json({
    data: { ...safe, customLinks: JSON.parse(card.customLinks) },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
