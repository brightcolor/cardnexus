import { apiMessage } from "@/lib/i18n/api";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canReadCard, publishedCardScope, unexpiredCardScope } from "@/lib/card-publication";
import { generateQRCodeSVG } from "@/lib/qr";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const card = await db.card.findUnique({
    where: { slug, ...publishedCardScope, ...unexpiredCardScope() },
    select: { slug: true, passwordHash: true },
  });

  if (!card || !await canReadCard(card)) {
    return NextResponse.json({ error: await apiMessage("missing") }, { status: 404 });
  }

  const host  = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const cardUrl = `${proto}://${host}/c/${slug}?source=qr`;

  const svg = await generateQRCodeSVG(cardUrl);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "private, no-store",
    },
  });
}
