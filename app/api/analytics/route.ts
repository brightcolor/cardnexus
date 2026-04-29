import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDeviceType } from "@/lib/utils";
import { z } from "zod";

const trackSchema = z.object({
  cardSlug: z.string(),
  event: z.enum(["view", "vcard_download", "qr_scan", "link_click", "wallet_save"]),
  linkLabel: z.string().optional(),
  source: z.enum(["nfc", "qr", "direct", "share"]).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const { cardSlug, event, linkLabel, source } = parsed.data;
  const userAgent = request.headers.get("user-agent") ?? "";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  await db.cardAnalytic.create({
    data: {
      cardSlug,
      event,
      linkLabel,
      source,
      ip,
      device: getDeviceType(userAgent),
    },
  });

  if (event === "view") {
    await db.card.updateMany({
      where: { slug: cardSlug },
      data: { totalViews: { increment: 1 } },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = await db.card.findUnique({ where: { userId: session.user.id } });
  if (!card) return NextResponse.json({ data: null });

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [all, recent] = await Promise.all([
    db.cardAnalytic.groupBy({
      by: ["event"],
      where: { cardSlug: card.slug },
      _count: true,
    }),
    db.cardAnalytic.findMany({
      where: { cardSlug: card.slug, event: "view", createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const [sourceData, deviceData] = await Promise.all([
    db.cardAnalytic.groupBy({
      by: ["source"],
      where: { cardSlug: card.slug },
      _count: true,
    }),
    db.cardAnalytic.groupBy({
      by: ["device"],
      where: { cardSlug: card.slug },
      _count: true,
    }),
  ]);

  const countByEvent = (event: string) =>
    all.find((r) => r.event === event)?._count ?? 0;

  // Build daily view counts
  const viewMap = new Map<string, number>();
  recent.forEach((r) => {
    const key = r.createdAt.toISOString().split("T")[0];
    viewMap.set(key, (viewMap.get(key) ?? 0) + 1);
  });

  const viewsLast30Days = Array.from({ length: days }, (_, i) => {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    return { date: key, count: viewMap.get(key) ?? 0 };
  });

  return NextResponse.json({
    data: {
      totalViews: card.totalViews,
      vcardDownloads: countByEvent("vcard_download"),
      qrScans: countByEvent("qr_scan"),
      linkClicks: countByEvent("link_click"),
      viewsLast30Days,
      topSources: sourceData.map((s) => ({
        source: s.source ?? "direct",
        count: s._count,
      })),
      deviceSplit: deviceData.map((d) => ({
        device: d.device ?? "unknown",
        count: d._count,
      })),
    },
  });
}
