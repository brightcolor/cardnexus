import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnalyticsOverview } from "@/components/analytics/AnalyticsOverview";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ cardId?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string };
  const { cardId } = await searchParams;

  const cards = await db.card.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: { id: true, name: true },
  });

  // Verify the requested cardId belongs to this user
  const validCardId = cardId && cards.some((c) => c.id === cardId) ? cardId : undefined;

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="Analytics"
        description="Wie wird deine Karte genutzt?"
      />
      <AnalyticsOverview cards={cards} initialCardId={validCardId} />
    </div>
  );
}
