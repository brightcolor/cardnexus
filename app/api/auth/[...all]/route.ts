import { auth } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { toNextJsHandler } from "better-auth/next-js";
import it from "@/messages/it/api/authentication.json";

const handlers = toNextJsHandler(auth);

const errorMessages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: it.credentials,
  INVALID_EMAIL: it.invalidEmail,
  USER_ALREADY_EXISTS: it.emailInUse,
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: it.emailInUse,
  PASSWORD_TOO_SHORT: it.shortPassword,
  PASSWORD_TOO_LONG: it.longPassword,
  INVALID_PASSWORD: it.invalidPassword,
  INVALID_TOKEN: it.invalidToken,
  TOKEN_EXPIRED: it.invalidToken,
  INVALID_CODE: it.invalidCode,
  INVALID_BACKUP_CODE: it.invalidCode,
  INVALID_TWO_FACTOR_COOKIE: it.invalidToken,
};

async function localizedResponse(response: Response) {
  if (response.status < 400 || (response.status !== 429 && !response.headers.get("content-type")?.includes("application/json"))) {
    return response;
  }
  if (await getLocale() === "de") return response;

  const data: unknown = await response.clone().json().catch(() => null);
  if (!data || typeof data !== "object" || !("message" in data) || typeof data.message !== "string") {
    return response;
  }

  const code = "code" in data && typeof data.code === "string" ? data.code : "";
  const message = Object.hasOwn(errorMessages, code) ? errorMessages[code]
    : response.status === 429 ? it.rateLimit : it.generic;
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
