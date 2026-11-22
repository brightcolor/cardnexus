import { apiMessage, apiProviderError } from "@/lib/i18n/api";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canReadCard, publishedCardScope, unexpiredCardScope } from "@/lib/card-publication";
import { generateGoogleWalletPassUrl, WalletFeatureDisabledError } from "@/lib/wallet";
import { headers } from "next/headers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const card = await db.card.findUnique({
    where: { slug, ...publishedCardScope, ...unexpiredCardScope() },
    select: {
      slug: true, passwordHash: true, firstName: true, lastName: true, title: true,
      company: true, email: true, phone: true, primaryColor: true, avatarUrl: true,
    },
  });

  if (!card || !await canReadCard(card)) return NextResponse.json({ error: await apiMessage("missing") }, { status: 404 });

  const hdrs  = await headers();
  const host  = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";

  try {
    const saveUrl = await generateGoogleWalletPassUrl({
      slug:         card.slug,
      firstName:    card.firstName  ?? "",
      lastName:     card.lastName   ?? "",
      title:        card.title,
      company:      card.company,
      email:        card.email,
      phone:        card.phone,
      primaryColor: card.primaryColor,
      avatarUrl:    card.avatarUrl,
      cardUrl:      `${proto}://${host}/c/${card.slug}`,
    });

    return NextResponse.json({ url: saveUrl }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    if (err instanceof WalletFeatureDisabledError) {
      return NextResponse.json({ error: await apiProviderError(err.message, "walletUnavailable") }, { status: 503 });
    }
    console.error("[wallet/google]", err);
    return NextResponse.json({ error: await apiMessage("serverError") }, { status: 500 });
  }
}
