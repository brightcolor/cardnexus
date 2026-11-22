import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/pages/campaign-overview.json";
import it from "@/messages/it/pages/campaign-overview.json";
import en from "@/messages/en/pages/campaign-overview.json";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canUseFeature } from "@/lib/plans";
import { CampaignsClient } from "./client";
import { UpgradePrompt } from "@/components/plan/UpgradePrompt";
import type { Campaign } from "@/types";

export async function generateMetadata() {
  return { title: translator(await getLocale(), de, it, en)("title") };
}

export default async function CampaignsPage() {
  const locale = await getLocale();
  const t = translator(locale, de, it, en);
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string; plan?: string; planExpiresAt?: Date };

  const hasCampaigns = canUseFeature("campaigns", user.plan ?? "free", user.planExpiresAt);

  const card = await db.card.findFirst({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }],
    select: { id: true, slug: true },
  });

  const campaigns: Campaign[] = hasCampaigns && card
    ? (await db.campaign.findMany({
        where: { cardId: card.id },
        orderBy: { createdAt: "desc" },
      })).map((c) => ({
        ...c,
        expiresAt: c.expiresAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      }))
    : [];

  const hdrs = await headers();
  const host  = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${proto}://${host}`;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("heading")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("description")}
        </p>
      </div>

      {!hasCampaigns ? (
        <UpgradePrompt
          feature={t("upgrade")}
          requiredPlan="pro"
        />
      ) : (
        <CampaignsClient
          campaigns={campaigns}
          cardSlug={card?.slug ?? ""}
          baseUrl={baseUrl}
          hasCard={!!card}
        />
      )}
    </div>
  );
}
