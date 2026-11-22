import { apiMessage } from "@/lib/i18n/api";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canReadCard, publishedCardScope, unexpiredCardScope } from "@/lib/card-publication";
import { generateVCard, vCardFileName } from "@/lib/vcard";
import type { CardData } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const card = await db.card.findUnique({
    where: { slug, ...publishedCardScope, ...unexpiredCardScope() },
  });

  if (!card || !await canReadCard(card)) {
    return NextResponse.json({ error: await apiMessage("missing") }, { status: 404 });
  }

  // Track download
  await db.cardAnalytic.create({
    data: { cardSlug: slug, event: "vcard_download" },
  });

  const cardData = {
    ...card,
    customLinks: JSON.parse(card.customLinks),
  } as CardData;

  const vcf = generateVCard(cardData);
  const filename = vCardFileName(cardData);

  return new NextResponse(vcf, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
