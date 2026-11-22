import { apiMessage, apiCardLimit } from "@/lib/i18n/api";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { generateCardSlug } from "@/lib/card-slug";
import { effectivePlan, getPlanFeatures } from "@/lib/plans";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: await apiMessage("unauthorized") }, { status: 401 });

  const { id } = await params;

  // Enforce plan card limit before cloning
  const [source, dbUser, existingCount] = await Promise.all([
    db.card.findFirst({ where: { id, userId: session.user.id } }),
    db.user.findUnique({ where: { id: session.user.id }, select: { plan: true, planExpiresAt: true } }),
    db.card.count({ where: { userId: session.user.id } }),
  ]);

  if (!source) return NextResponse.json({ error: await apiMessage("notFound") }, { status: 404 });

  const plan = effectivePlan(dbUser?.plan ?? "free", dbUser?.planExpiresAt);
  const { maxCards } = getPlanFeatures(plan);
  if (existingCount >= maxCards) {
    return NextResponse.json(
      { error: await apiCardLimit(maxCards) },
      { status: 403 }
    );
  }

  let slug = generateCardSlug(source.firstName, source.lastName);
  while (await db.card.findUnique({ where: { slug } })) {
    slug = generateCardSlug(source.firstName, source.lastName);
  }

  const omit = new Set(["id", "slug", "createdAt", "updatedAt"]);
  const data = Object.fromEntries(
    Object.entries(source).filter(([k]) => !omit.has(k))
  ) as typeof source;

  const cloned = await db.card.create({
    data: {
      ...data,
      slug,
      name: `${source.name} (Kopie)`,
      isDefault: false,
      isPublic: false,
      cardDomain: null,
      totalViews: 0,
    } as Parameters<typeof db.card.create>[0]["data"],
  });

  const { passwordHash: _ph, ...safe } = cloned;
  return NextResponse.json(
    { ...safe, customLinks: JSON.parse((cloned.customLinks as unknown as string) || "[]") },
    { status: 201 }
  );
}
