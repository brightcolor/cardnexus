import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ host: string }> }
) {
  const { host } = await params;
  const domain = decodeURIComponent(host);

  // Build a reliable base URL from forwarded headers (not req.url which can
  // contain the internal bind address like 0.0.0.0:3000)
  const fwdHost  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? domain;
  const fwdProto = req.headers.get("x-forwarded-proto") ?? "https";
  const base     = `${fwdProto}://${fwdHost}`;

  const card = await db.card.findFirst({
    where: { cardDomain: domain, isPublic: true },
    select: { slug: true },
  });

  if (!card) {
    return NextResponse.redirect(`${base}/`, { status: 302 });
  }

  return NextResponse.redirect(`${base}/c/${card.slug}`, { status: 302 });
}
