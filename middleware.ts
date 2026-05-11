import { NextResponse, type NextRequest } from "next/server";

/**
 * Fix the Host header for requests coming through a reverse proxy.
 *
 * Problem: reverse proxies forward the backend address (e.g. 46.224.163.89:3000)
 * as the Host header instead of the public domain. better-auth constructs the
 * origin from this header, gets "http://46.224.163.89:3000", and rejects every
 * session because that IP is not in trustedOrigins.
 *
 * Fix: if X-Forwarded-Host is present (set by a correctly configured proxy),
 * replace Host with its value. Server Components and Route Handlers then see
 * the correct public domain in headers(), and better-auth origin validation passes.
 */
export function middleware(request: NextRequest) {
  const fwdHost = request.headers.get("x-forwarded-host");
  if (!fwdHost) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("host", fwdHost);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Run for every request except Next.js internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
