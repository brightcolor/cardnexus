import { NextRequest, NextResponse } from "next/server";

// Domains that belong to the platform itself — don't intercept
const PLATFORM_HOSTS = [
  "localhost",
  process.env.BETTER_AUTH_URL?.replace(/^https?:\/\//, "") ?? "",
  process.env.APP_URL?.replace(/^https?:\/\//, "") ?? "",
].filter(Boolean);

export async function middleware(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const hostname = host.split(":")[0]; // strip port

  // Skip if this is the platform's own domain
  if (PLATFORM_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
    return NextResponse.next();
  }

  // Skip internal Next.js paths
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/public") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Custom domain — look up card by cardDomain, rewrite to /c/[slug]
  // We can't do a DB lookup in middleware (Edge runtime), so we rewrite to a
  // special API route that handles the DB lookup and redirects.
  const url = req.nextUrl.clone();
  url.pathname = `/api/domain/${encodeURIComponent(hostname)}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
