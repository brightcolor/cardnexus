import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canUseFeature } from "@/lib/plans";
import { CampaignsClient } from "./client";
import { UpgradePrompt } from "@/components/plan/UpgradePrompt";
import type { Campaign } from "@/types";

export const metadata = { title: "Kampagnen" };

export default async function CampaignsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string; plan?: string; planExpiresAt?: Date };

  const hasCampaigns = canUseFeature("campaigns", user.plan ?? "free", user.planExpiresAt);

  const card = await db.card.findUnique({
    where: { userId: user.id },
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">UTM-Kampagnen</h1>
        <p className="text-muted-foreground mt-1">
          Erstelle individuelle Links fur Events, Messen oder Kampagnen &mdash; mit separater Klick-Statistik.
        </p>
      </div>

      {!hasCampaigns ? (
        <UpgradePrompt
          feature="UTM-Kampagnen & Event-Links sind ab dem Pro-Plan verfugbar"
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
