import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// /p/[slug] → redirect to card with tracking (friendly URL)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const campaign = await db.campaign.findUnique({
    where: { urlSlug: slug },
    include: { card: { select: { slug: true, isPublic: true } } },
  });

  if (!campaign || !campaign.card.isPublic) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (campaign.expiresAt && campaign.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/", req.url), { status: 302 });
  }

  await db.campaign.update({
    where: { id: campaign.id },
    data: { views: { increment: 1 } },
  });

  const dest = new URL(`/c/${campaign.card.slug}`, req.url);
  dest.searchParams.set("src", "campaign");
  dest.searchParams.set("cid", campaign.id);

  return NextResponse.redirect(dest, { status: 302 });
}
