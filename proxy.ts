import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "./lib/auth";
import { db } from "./lib/db";
import deAuth from "./messages/de/api/authentication.json";
import itAuth from "./messages/it/api/authentication.json";
import enAuth from "./messages/en/api/authentication.json";
import { defaultLocale, localeCookie, localeCookieOptions, parseLocale } from "./lib/i18n/locales";
import { rateLimit } from "./lib/rate-limit";

// ─── Custom domain detection ──────────────────────────────────────────────────

function toHostname(val: string) {
  return val.replace(/^https?:\/\//, "").split(":")[0].split("/")[0];
}

const PLATFORM_HOSTNAMES = [
  "localhost",
  "0.0.0.0",
  process.env.BETTER_AUTH_URL ? toHostname(process.env.BETTER_AUTH_URL) : "",
  process.env.APP_URL ? toHostname(process.env.APP_URL) : "",
].filter(Boolean);

function isLikelyCustomDomain(host: string): boolean {
  const hostname = toHostname(host);
  if (!hostname) return false;
  if (PLATFORM_HOSTNAMES.includes(hostname)) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
  if (!hostname.includes(".")) return false;
  return true;
}

// ─── Auth route constants ─────────────────────────────────────────────────────

const PUBLIC_PAGES = new Set([
  "/", "/demo", "/login", "/login/2fa", "/register", "/invite",
  "/forgot-password", "/reset-password", "/pricing", "/impressum", "/datenschutz",
]);
const AUTH_PATHS = ["/login", "/register"];
const ADMIN_PATHS = ["/admin"];

export async function proxy(request: NextRequest) {
  const fwdHost  = request.headers.get("x-forwarded-host");
  const fwdProto = request.headers.get("x-forwarded-proto") ?? "http";
  const host     = fwdHost ?? request.headers.get("host") ?? "";
  const base     = `${fwdProto}://${host}`;
  const { pathname } = request.nextUrl;

  // ── Fix Host header for app code behind a reverse proxy ───────────────────
  // Reverse proxies forward the backend address (e.g. 46.x.x.x:3000) as Host.
  // better-auth constructs the origin from this header and rejects sessions
  // because the raw IP is not in trustedOrigins.
  // Solution: rewrite Host to X-Forwarded-Host for all NextResponse.next() calls.
  function nextWithFixedHost() {
    if (!fwdHost) return NextResponse.next();
    const headers = new Headers(request.headers);
    headers.set("host", fwdHost);
    return NextResponse.next({ request: { headers } });
  }

  // ── Auth brute-force protection ───────────────────────────────────────────
  // Rate-limit sign-in and sign-up: max 10 attempts per IP per minute.
  // Must run BEFORE the API early-return so it applies to auth routes.
  if (
    pathname.startsWith("/api/auth/sign-in") ||
    pathname.startsWith("/api/auth/sign-up")
  ) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      request.headers.get("x-real-ip") ??
      "anon";
    if (!rateLimit({ key: `auth:${ip}`, max: 10, windowMs: 60_000 })) {
      const locale = parseLocale(request.cookies.get(localeCookie)?.value) ?? defaultLocale();
      return new NextResponse(
        JSON.stringify({ error: ({ de: deAuth, it: itAuth, en: enAuth }[locale]).proxyRateLimit }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }
  }

  // ── API routes: only fix the Host header, skip all other logic ────────────
  // Auth checks and custom-domain routing must NOT run for API calls.
  if (pathname.startsWith("/api/")) {
    return nextWithFixedHost();
  }

  // ── Custom domain routing ──────────────────────────────────────────────────
  if (!pathname.startsWith("/c/") && isLikelyCustomDomain(host)) {
    const url = request.nextUrl.clone();
    const hostname = toHostname(host);
    url.pathname = `/api/domain/${encodeURIComponent(hostname)}`;
    return NextResponse.rewrite(url);
  }

  // ── Auth / route protection ───────────────────────────────────────────────
  const isPublic = PUBLIC_PAGES.has(pathname) || ["/c/", "/p/", "/print/", "/team/"].some((prefix) => pathname.startsWith(prefix));
  const isAuth   = AUTH_PATHS.includes(pathname);
  const isAdmin  = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  // Always use the internal URL so we don't get ERR_SSL_WRONG_VERSION_NUMBER
  // when the container tries to fetch itself through the external TLS proxy.
  const internalBase = `http://localhost:${process.env.PORT ?? 3000}`;
  const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
    baseURL: internalBase,
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });

  const isAuthenticated = !!session?.user;

  if (isAuthenticated && isAuth) {
    const invite = request.nextUrl.searchParams.get("invite");
    if (invite) return NextResponse.redirect(`${base}/invite?${new URLSearchParams({ invite })}`);
    return NextResponse.redirect(`${base}/dashboard`);
  }

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(`${base}/login`);
  }

  if (isAdmin && session?.user) {
    const role = (session.user as { role?: string }).role;
    if (role !== "super_admin") {
      return NextResponse.redirect(`${base}/dashboard`);
    }
  }

  const response = nextWithFixedHost();
  if (session?.user) {
    const explicit = parseLocale(request.cookies.get(localeCookie)?.value);
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { locale: true },
    });
    const preference = parseLocale(user?.locale);
    if (preference && preference !== explicit) {
      response.cookies.set(localeCookie, preference, {
        ...localeCookieOptions,
        secure: fwdProto === "https" || request.nextUrl.protocol === "https:",
      });
    } else if (user && user.locale === null && explicit) {
      await db.user.updateMany({
        where: { id: session.user.id, locale: null },
        data: { locale: explicit },
      });
    }
  }
  return response;
}

export const config = {
  matcher: [
    // Include /api/* so the Host header is fixed for API calls too.
    // API routes exit early (only host-fix, no auth/domain logic).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
