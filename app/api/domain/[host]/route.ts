import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ host: string }> }
) {
  const { host } = await params;
  const domain = decodeURIComponent(host);

  const card = await db.card.findFirst({
    where: { cardDomain: domain, isPublic: true },
    select: { slug: true },
  });

  if (!card) return NextResponse.redirect(new URL("/", req.url), { status: 302 });

  return NextResponse.redirect(new URL(`/c/${card.slug}`, req.url), { status: 302 });
}
