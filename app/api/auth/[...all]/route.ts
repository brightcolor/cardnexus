import { auth } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { toNextJsHandler } from "better-auth/next-js";
import en from "@/messages/en/api/authentication.json";
import it from "@/messages/it/api/authentication.json";

const handlers = toNextJsHandler(auth);

const errorKeys: Record<string, keyof typeof it> = {
  INVALID_EMAIL_OR_PASSWORD: "credentials",
  INVALID_EMAIL: "invalidEmail",
  USER_ALREADY_EXISTS: "emailInUse",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "emailInUse",
  PASSWORD_TOO_SHORT: "shortPassword",
  PASSWORD_TOO_LONG: "longPassword",
  INVALID_PASSWORD: "invalidPassword",
  INVALID_TOKEN: "invalidToken",
  TOKEN_EXPIRED: "invalidToken",
  INVALID_CODE: "invalidCode",
  INVALID_BACKUP_CODE: "invalidCode",
  INVALID_TWO_FACTOR_COOKIE: "invalidToken",
};

async function localizedResponse(response: Response) {
  if (response.status < 400 || (response.status !== 429 && !response.headers.get("content-type")?.includes("application/json"))) {
    return response;
  }
  const locale = await getLocale();
  if (locale === "de") return response;
  const messages = locale === "en" ? en : it;

  const data: unknown = await response.clone().json().catch(() => null);
  if (!data || typeof data !== "object" || !("message" in data) || typeof data.message !== "string") {
    return response;
  }

  const code = "code" in data && typeof data.code === "string" ? data.code : "";
  const message = Object.hasOwn(errorKeys, code) ? messages[errorKeys[code]]
    : response.status === 429 ? messages.rateLimit : messages.generic;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return Response.json({ ...data, message }, { status: response.status, headers });
}

export async function GET(request: Request) {
  return localizedResponse(await handlers.GET(request));
}

export async function POST(request: Request) {
  return localizedResponse(await handlers.POST(request));
}
