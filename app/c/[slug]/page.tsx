import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/pages/public-card-status.json";
import it from "@/messages/it/pages/public-card-status.json";
import en from "@/messages/en/pages/public-card-status.json";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { CardData } from "@/types";
import { PublicCardView } from "./client";
import { CardPasswordGate } from "./PasswordGate";
import { canUseFeature } from "@/lib/plans";
import { getPlatformSettings } from "@/lib/platform";
import { canReadCard, publicCardFields, publishedCardScope, unexpiredCardScope } from "@/lib/card-publication";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string; expired?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale();
  const t = translator(locale, de, it, en);
  const { slug } = await params;
  const card = await db.card.findUnique({
    where: { slug, ...publishedCardScope },
    select: { firstName: true, lastName: true, title: true, company: true, expiresAt: true, passwordHash: true },
  });
  if (!card) return { title: t("notFound") };

  // Don't leak names of expired or non-public cards in metadata.
  if (card.expiresAt && card.expiresAt < new Date()) return { title: t("expired") };
  if (card.passwordHash) return { title: t("protected") };

  const name = `${card.firstName ?? ""} ${card.lastName ?? ""}`.trim();
  return {
    title: `${name}${card.title ? ` – ${card.title}` : ""}`,
    description: card.company ?? undefined,
    openGraph: { title: name, type: "profile" },
  };
}

export default async function PublicCardPage({ params, searchParams }: Props) {
  const locale = await getLocale();
  const t = translator(locale, de, it, en);
  const { slug } = await params;
  const { source } = await searchParams;

  const raw = await db.card.findUnique({
    where: { slug, ...publishedCardScope },
    select: {
      ...publicCardFields, id: true, expiresAt: true, passwordHash: true,
      user: { select: { plan: true, planExpiresAt: true } },
    },
  });

  if (!raw) {
    // Check if this is an old slug that was renamed
    const alias = await db.cardSlugAlias.findUnique({
      where: { oldSlug: slug, card: { ...publishedCardScope, ...unexpiredCardScope() } },
      select: { cardSlug: true },
    });
    if (alias) redirect(`/c/${alias.cardSlug}${source ? `?source=${encodeURIComponent(source)}` : ""}`);
    if (slug === "demo") redirect("/demo");
    notFound();
  }

  // SECURITY: enforce expiry — abgelaufene Karten dürfen nicht mehr aufgerufen werden.
  if (raw.expiresAt && raw.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-sm text-center space-y-2">
          <h1 className="text-2xl font-semibold">{t("expired")}</h1>
          <p className="text-muted-foreground">{t("expiredDescription")}</p>
        </div>
      </div>
    );
  }

  if (!await canReadCard(raw)) return <CardPasswordGate slug={slug} />;

  const { passwordHash: _ph, user: _owner, ...safe } = raw;
  const card = { ...safe, customLinks: JSON.parse(raw.customLinks) } as CardData;
  const ownerPlan = raw.user?.plan ?? "free";
  const ownerExpiry = raw.user?.planExpiresAt;
  const whiteLabel   = canUseFeature("whiteLabel",   ownerPlan, ownerExpiry);
  const showLeadForm = canUseFeature("leadCapture",  ownerPlan, ownerExpiry);

  const { appName, logoUrl } = await getPlatformSettings();
  return <PublicCardView card={card} source={source} showBadge={!whiteLabel} showLeadForm={showLeadForm} appName={appName} logoUrl={logoUrl} />;
}
