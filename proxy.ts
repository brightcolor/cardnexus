import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "./lib/auth";

// ─── Custom domain detection ──────────────────────────────────────────────────

const PLATFORM_HOSTS = [
  "localhost",
  process.env.BETTER_AUTH_URL?.replace(/^https?:\/\//, "") ?? "",
  process.env.APP_URL?.replace(/^https?:\/\//, "") ?? "",
].filter(Boolean);

function isPlatformHost(host: string) {
  const hostname = host.split(":")[0];
  return PLATFORM_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

// ─── Auth route constants ─────────────────────────────────────────────────────

const PUBLIC_PATHS = ["/", "/login", "/register", "/c/", "/p/"];
const AUTH_PATHS = ["/login", "/register"];
const ADMIN_PATHS = ["/admin"];

export async function proxy(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // ── Custom domain routing ──────────────────────────────────────────────────
  // If request comes from a non-platform host, rewrite to the domain API route
  // which looks up the card by cardDomain and redirects to /c/[slug]
  if (host && !isPlatformHost(host)) {
    const url = request.nextUrl.clone();
    const hostname = host.split(":")[0];
    url.pathname = `/api/domain/${encodeURIComponent(hostname)}${pathname === "/" ? "" : pathname}`;
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
