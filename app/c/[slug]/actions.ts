"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password-hash";

function unlockCookieName(slug: string): string {
  return `card_unlocked_${slug}`;
}

export async function unlockCard(
  slug: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const card = await db.card.findUnique({
    where: { slug },
    select: { passwordHash: true, isPublic: true, expiresAt: true },
  });
  if (!card || !card.isPublic) return { ok: false, error: "Karte nicht gefunden" };
  if (card.expiresAt && card.expiresAt < new Date()) return { ok: false, error: "Karte abgelaufen" };
  if (!card.passwordHash) return { ok: true };

  if (!verifyPassword(password, card.passwordHash)) {
    return { ok: false, error: "Falsches Passwort" };
  }

  (await cookies()).set(unlockCookieName(slug), card.passwordHash, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return { ok: true };
}
