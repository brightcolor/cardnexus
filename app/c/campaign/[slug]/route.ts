import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canReadCard, publishedCardScope, unexpiredCardScope } from "@/lib/card-publication";
import { requestBaseUrl } from "@/lib/request-base-url";

// /c/campaign/[slug] → redirect to card with tracking (legacy URL, kept for compatibility)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const base = requestBaseUrl(req);

  const campaign = await db.campaign.findUnique({
    where: { urlSlug: slug, card: { ...publishedCardScope, ...unexpiredCardScope() } },
    include: { card: { select: { slug: true, passwordHash: true } } },
  });

  if (!campaign) {
    return NextResponse.redirect(`${base}/`, { status: 302 });
  }

  if (campaign.expiresAt && campaign.expiresAt < new Date()) {
    return NextResponse.redirect(`${base}/`, { status: 302 });
  }

  if (!await canReadCard(campaign.card)) {
    return NextResponse.redirect(new URL(`/c/${campaign.card.slug}`, base), { status: 302 });
  }

  await db.campaign.update({
    where: { id: campaign.id },
    data: { views: { increment: 1 } },
  });

  const dest = new URL(`/c/${campaign.card.slug}`, base);
  dest.searchParams.set("src", "campaign");
  dest.searchParams.set("cid", campaign.id);

  return NextResponse.redirect(dest.toString(), { status: 302 });
}
