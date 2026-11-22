export const locales = ["de", "it", "en"] as const;
export type Locale = (typeof locales)[number];

export const localeCookie = "cardnexus_locale";

export function parseLocale(value: unknown): Locale | undefined {
  return locales.find((locale) => locale === value);
}

export function defaultLocale(): Locale {
  return parseLocale(process.env.DEFAULT_LOCALE) ?? "de";
}

export function formatLocale(locale: Locale): string {
  return { de: "de-DE", it: "it-IT", en: "en-GB" }[locale];
}

export const localeCookieOptions = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax",
  httpOnly: true,
} as const;
