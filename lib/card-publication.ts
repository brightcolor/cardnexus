import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { makeCardUnlockToken } from "./password-hash";

export const publishedCardScope = {
  isPublic: true,
  approvalStatus: "approved",
  user: {
    bannedAt: null,
    OR: [{ organizationId: null }, { organization: { isActive: true } }],
  },
} satisfies Prisma.CardWhereInput;

export function unexpiredCardScope(now = new Date()) {
  return { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } satisfies Prisma.CardWhereInput;
}

export function cardUnlockCookie(slug: string) {
  return `card_unlocked_${slug}`;
}

export async function canReadCard(card: { slug: string; passwordHash: string | null }) {
  if (!card.passwordHash) return true;
  const token = (await cookies()).get(cardUnlockCookie(card.slug))?.value;
  return token === makeCardUnlockToken(card.slug, card.passwordHash);
}

export const publicCardFields = {
  slug: true, firstName: true, lastName: true, title: true, company: true,
  department: true, bio: true, avatarUrl: true, coverUrl: true, pronouns: true,
  gender: true, birthday: true, phone: true, mobile: true, fax: true, email: true,
  website: true, address: true, linkedin: true, xing: true, twitter: true,
  instagram: true, github: true, youtube: true, customLinks: true, templateId: true,
  primaryColor: true, accentColor: true, fontFamily: true, layoutStyle: true,
  roundedStyle: true, showQrOnCard: true, bookingUrl: true, shadowStyle: true,
  socialStyle: true, avatarBorder: true, cardBackground: true, logoUrl: true,
  cardDomain: true, hideShareButton: true,
} satisfies Prisma.CardSelect;
