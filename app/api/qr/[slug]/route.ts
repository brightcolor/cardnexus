import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateQRCodeSVG } from "@/lib/qr";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const card = await db.card.findUnique({
    where: { slug },
    select: { isPublic: true, primaryColor: true },
  });

  if (!card || !card.isPublic) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const url = new URL(request.url);
  const color = url.searchParams.get("color") ?? card.primaryColor;
  const bg = url.searchParams.get("bg") ?? "#ffffff";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cardUrl = `${appUrl}/c/${slug}?source=qr`;

  const svg = await generateQRCodeSVG(cardUrl, { color, backgroundColor: bg });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
