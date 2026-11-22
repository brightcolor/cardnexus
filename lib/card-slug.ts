import { customAlphabet } from "nanoid";

export const CARD_SLUG_MAX_LENGTH = 120;
export const CARD_SLUG_PATTERN = /^[a-z0-9-]+$/;

const randomSuffix = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export function generateCardSlug(firstName?: string | null, lastName?: string | null, suffixLength = 6) {
  const base = [firstName, lastName].filter(Boolean).join("-").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, CARD_SLUG_MAX_LENGTH - suffixLength - 1)
    .replace(/^-|-$/g, "") || "karte";
  return `${base}-${randomSuffix(suffixLength)}`;
}
