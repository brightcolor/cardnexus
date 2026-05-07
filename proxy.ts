import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "./lib/auth";

// ─── Custom domain detection ──────────────────────────────────────────────────

// Strip protocol and port from a URL/host string to get just the hostname
function toHostname(val: string) {
  return val.replace(/^https?:\/\//, "").split(":")[0].split("/")[0];
}

const PLATFORM_HOSTNAMES = [
  "localhost",
  "0.0.0.0",
  process.env.BETTER_AUTH_URL ? toHostname(process.env.BETTER_AUTH_URL) : "",
  process.env.APP_URL ? toHostname(process.env.APP_URL) : "",
].filter(Boolean);

/**
 * Returns true only for real external domain names that could be custom domains.
 * Excludes: localhost, 0.0.0.0, IPv4 addresses, hostnames without a dot.
 */
function isLikelyCustomDomain(host: string): boolean {
  const hostname = toHostname(host);
  if (!hostname) return false;
  if (PLATFORM_HOSTNAMES.includes(hostname)) return false;
  // Reject plain IPs (v4) — they are never valid custom domains
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
  // Must look like a real domain (has at least one dot)
  if (!hostname.includes(".")) return false;
  return true;
}

// ─── Auth route constants ─────────────────────────────────────────────────────

const PUBLIC_PATHS = ["/", "/login", "/register", "/c/", "/p/"];
const AUTH_PATHS = ["/login", "/register"];
const ADMIN_PATHS = ["/admin"];

export async function proxy(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // ── Custom domain routing ──────────────────────────────────────────────────
  // Only activate for real external domains (not IPs, not localhost, not 0.0.0.0)
  if (isLikelyCustomDomain(host)) {
    const url = request.nextUrl.clone();
    const hostname = toHostname(host);
    url.pathname = `/api/domain/${encodeURIComponent(hostname)}`;
    return NextResponse.rewrite(url);
  }

  // ── Auth / route protection ───────────────────────────────────────────────
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
    baseURL: request.nextUrl.origin,
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });

  const isAuthenticated = !!session?.user;

  // Redirect logged-in users away from auth pages
  if (isAuthenticated && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protect dashboard and admin routes
  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin routes: only super_admin
  if (isAdmin && session?.user) {
    const role = (session.user as { role?: string }).role;
    if (role !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
