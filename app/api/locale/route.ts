import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { localeCookie, localeCookieOptions, parseLocale } from "@/lib/i18n/locales";

export async function POST(request: NextRequest) {
  // JSON is required so cross-origin forms cannot trigger a preference change.
  const contentType = request.headers.get("content-type")?.split(";")[0].trim();
  if (contentType !== "application/json") {
    return NextResponse.json({ ok: false }, { status: 415 });
  }

  const body = await request.json().catch(() => null);
  const locale = parseLocale(body?.locale);
  if (!locale) return NextResponse.json({ ok: false }, { status: 400 });

  const session = await auth.api.getSession({ headers: request.headers });
  if (session) {
    await db.user.update({ where: { id: session.user.id }, data: { locale } });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(localeCookie, locale, {
    ...localeCookieOptions,
    secure: request.headers.get("x-forwarded-proto") === "https" ||
      request.nextUrl.protocol === "https:",
  });
  return response;
}
