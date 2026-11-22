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
    select: { slug: true, passwordHash: true, primaryColor: true },
  });

  if (!card || !await canReadCard(card)) {
    return NextResponse.json({ error: await apiMessage("missing") }, { status: 404 });
  }

  const url = new URL(request.url);
  const HEX = /^#[0-9a-fA-F]{6}$/;
  // SECURITY: don't pass un-validated query params into an SVG buffer.
  const colorRaw = url.searchParams.get("color");
  const bgRaw = url.searchParams.get("bg");
  const color = colorRaw && HEX.test(colorRaw) ? colorRaw : card.primaryColor;
  const bg    = bgRaw    && HEX.test(bgRaw)    ? bgRaw    : "#ffffff";

  const host  = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const cardUrl = `${proto}://${host}/c/${slug}?source=qr`;

  const svg = await generateQRCodeSVG(cardUrl, { color, backgroundColor: bg });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "private, no-store",
    },
  });
}
