"use server";

import { getLocale } from "@/lib/i18n/server";
import { translator } from "@/lib/i18n/messages";
import de from "@/messages/de/components/card-password-gate.json";
import it from "@/messages/it/components/card-password-gate.json";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { verifyPassword, makeCardUnlockToken } from "@/lib/password-hash";

import { cardUnlockCookie, publishedCardScope } from "@/lib/card-publication";
import { clientIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";

export async function unlockCard(
  slug: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const t = translator(await getLocale(), de, it);
  const card = await db.card.findUnique({
    where: { slug, ...publishedCardScope },
    select: { passwordHash: true, expiresAt: true },
  });
  if (!card) return { ok: false, error: t("notFound") };
  if (card.expiresAt && card.expiresAt < new Date()) return { ok: false, error: t("expired") };
  if (!card.passwordHash) return { ok: true };

  const ip = clientIp({ headers: await headers() });
  if (typeof password !== "string" || password.length > 200 ||
      !rateLimit({ key: `card-unlock:${slug}:${ip}`, max: 10, windowMs: 60_000 }) ||
      !verifyPassword(password, card.passwordHash)) {
    return { ok: false, error: t("wrongPassword") };
  }

  // Store an HMAC-signed token, not the raw hash — prevents forging the cookie
  // by knowing the hash alone (e.g. from a DB dump or log leak).
  const token = makeCardUnlockToken(slug, card.passwordHash);
  (await cookies()).set(cardUnlockCookie(slug), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: (process.env.APP_URL ?? process.env.BETTER_AUTH_URL)?.startsWith("https://") ?? false,
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return { ok: true };
}
