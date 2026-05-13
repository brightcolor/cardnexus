import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";

/**
 * Hash a password using scrypt (Node built-in, no extra dependency).
 * Returns "scrypt:<salt-hex>:<hash-hex>" — self-contained, easy to verify.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * Creates an HMAC token that proves the cookie was issued by this server.
 * Stored in the cookie instead of the raw hash — prevents an attacker who
 * somehow learns the hash (DB dump, log leak) from forging the unlock cookie.
 */
export function makeCardUnlockToken(slug: string, hash: string): string {
  const secret = process.env.BETTER_AUTH_SECRET ?? "cardnexus-dev-fallback";
  return createHmac("sha256", secret).update(`unlock:${slug}:${hash}`).digest("hex");
}

/** Timing-safe verification of a password against a stored scrypt hash. */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored.startsWith("scrypt:")) return false;
  const [, saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const got = scryptSync(password.normalize("NFKC"), salt, expected.length);
  if (got.length !== expected.length) return false;
  return timingSafeEqual(got, expected);
}
