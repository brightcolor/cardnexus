import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// /c/campaign/[slug] → redirect to card with tracking
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const campaign = await db.campaign.findUnique({
    where: { urlSlug: slug },
    include: { card: { select: { slug: true, isPublic: true } } },
  });

  if (!campaign || !campaign.card.isPublic) {
    return NextResponse.redirect(new URL("/", _req.url));
  }

  // Check expiry
  if (campaign.expiresAt && campaign.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/", _req.url), { status: 302 });
  }

  // Increment campaign views
  await db.campaign.update({
    where: { id: campaign.id },
    data: { views: { increment: 1 } },
  });

  const dest = new URL(`/c/${campaign.card.slug}`, _req.url);
  dest.searchParams.set("src", "campaign");
  dest.searchParams.set("cid", campaign.id);

  return NextResponse.redirect(dest, { status: 302 });
}
