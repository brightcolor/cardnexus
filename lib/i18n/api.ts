import { flattenError, type ZodError } from "zod";
import { getLocale } from "./server";
import { translator } from "./messages";
import de from "@/messages/de/api/errors.json";
import it from "@/messages/it/api/errors.json";

export async function apiMessage(key: keyof typeof de, values?: Record<string, string | number>) {
  return translator(await getLocale(), de, it)(key, values);
}

export async function apiValidation(error: ZodError) {
  const locale = await getLocale();
  if (locale === "de") return flattenError(error);
  const t = translator(locale, de, it);
  return flattenError(error, (issue) => {
    switch (issue.code) {
      case "invalid_format": return t(issue.format === "email" ? "invalidEmail" : "invalidValue");
      case "too_small": return t("tooSmall", { limit: String(issue.minimum) });
      case "too_big": return t("tooLarge", { limit: String(issue.maximum) });
      default: return t("invalidValue");
    }
  });
}

export async function apiCardLimit(count: number, offerUpgrade = false) {
  const locale = await getLocale();
  const t = translator(locale, de, it);
  const message = t(count === 1 ? "cardLimitOne" : "cardLimitOther", { count });
  return offerUpgrade ? message + " " + t("upgradeMore") : message;
}

export async function apiProviderError(original: string, key: keyof typeof de) {
  const locale = await getLocale();
  return locale === "de" ? original : translator(locale, de, it)(key);
}
