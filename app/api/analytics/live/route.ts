import { apiMessage } from "@/lib/i18n/api";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Lightweight endpoint for realtime polling — returns only totalViews
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: await apiMessage("unauthorized") }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: await apiMessage("missingSlug") }, { status: 400 });

  const card = await db.card.findUnique({
    where: { slug, userId: session.user.id },
    select: { totalViews: true },
  });

  if (!card) return NextResponse.json({ error: await apiMessage("notFound") }, { status: 404 });

  return NextResponse.json({ totalViews: card.totalViews }, {
    headers: { "Cache-Control": "no-store" },
  });
}
