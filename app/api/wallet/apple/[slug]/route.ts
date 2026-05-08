import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAppleWalletPass, WalletFeatureDisabledError } from "@/lib/wallet";
import { headers } from "next/headers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const card = await db.card.findUnique({
    where: { slug, isPublic: true },
    select: {
      slug: true, firstName: true, lastName: true, title: true,
      company: true, email: true, phone: true, primaryColor: true, avatarUrl: true,
    },
  });

  if (!card) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const hdrs  = await headers();
  const host  = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";

  try {
    const pass = await generateAppleWalletPass({
      ...card,
      cardUrl: `${proto}://${host}/c/${card.slug}`,
    });

    return new NextResponse(pass, {
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${card.slug}.pkpass"`,
      },
    });
  } catch (err) {
    if (err instanceof WalletFeatureDisabledError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("[wallet/apple]", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
