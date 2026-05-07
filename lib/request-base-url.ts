import type { NextRequest } from "next/server";

/**
 * Derives the public-facing base URL from request headers.
 * Uses x-forwarded-host/proto (set by reverse proxies) to avoid leaking
 * the internal bind address (0.0.0.0:3000) to the browser.
 */
export function requestBaseUrl(req: NextRequest): string {
  const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
