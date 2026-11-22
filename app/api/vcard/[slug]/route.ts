import { apiMessage } from "@/lib/i18n/api";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canReadCard, publishedCardScope, unexpiredCardScope } from "@/lib/card-publication";
import { generateVCard, vCardFileName } from "@/lib/vcard";
import { requestBaseUrl } from "@/lib/request-base-url";
import { getPlatformSettings } from "@/lib/platform";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import type { CardData } from "@/types";

async function embeddedPhoto(avatarUrl: string | null) {
  const filename = avatarUrl?.match(/^\/uploads\/([\w-]+\.(?:jpg|jpeg|png|webp|gif))$/i)?.[1];
  if (!filename) return undefined;

  try {
    const original = await readFile(join(process.cwd(), "public", "uploads", filename));
    const photo = await sharp(original, { limitInputPixels: 24_000_000 })
      .rotate()
      .resize(512, 512, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 85 })
      .toBuffer();
    return `data:image/jpeg;base64,${photo.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const card = await db.card.findUnique({
    where: { slug, ...publishedCardScope, ...unexpiredCardScope() },
  });

  if (!card || !await canReadCard(card)) {
    return NextResponse.json({ error: await apiMessage("missing") }, { status: 404 });
  }

  // Track download
  await db.cardAnalytic.create({
    data: { cardSlug: slug, event: "vcard_download" },
  });

  const cardData = {
    ...card,
    customLinks: JSON.parse(card.customLinks),
  } as CardData;

  const requestOrigin = new URL(requestBaseUrl(request));
  const baseUrl = ["localhost", "0.0.0.0", "127.0.0.1", "[::1]"].includes(requestOrigin.hostname)
    ? (await getPlatformSettings()).appUrl
    : requestOrigin.origin;
  const cardUrl = new URL(`/c/${encodeURIComponent(card.slug)}`, baseUrl).href;
  const vcf = generateVCard(cardData, cardUrl, await embeddedPhoto(card.avatarUrl));
  const filename = vCardFileName(cardData);

  return new NextResponse(vcf, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
