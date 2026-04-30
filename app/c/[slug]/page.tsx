import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { CardData } from "@/types";
import { PublicCardView } from "./client";
import { canUseFeature } from "@/lib/plans";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = await db.card.findUnique({ where: { slug }, select: { firstName: true, lastName: true, title: true, company: true } });
  if (!card) return { title: "Karte nicht gefunden" };

  const name = `${card.firstName} ${card.lastName}`.trim();
  return {
    title: `${name}${card.title ? ` – ${card.title}` : ""}`,
    description: card.company ?? undefined,
    openGraph: { title: name, type: "profile" },
  };
}

export default async function PublicCardPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { source } = await searchParams;

  const raw = await db.card.findUnique({
    where: { slug },
    include: { user: { select: { name: true, email: true, plan: true, planExpiresAt: true } } },
  });

  if (!raw || !raw.isPublic) notFound();

  const card = { ...raw, customLinks: JSON.parse(raw.customLinks) } as CardData;
  const whiteLabel = canUseFeature("whiteLabel", raw.user?.plan ?? "free", raw.user?.planExpiresAt);

  return <PublicCardView card={card} source={source} showBadge={!whiteLabel} />;
}
