import type { NextRequest } from "next/server";

/**
 * Derives the public-facing base URL from request headers.
 * Uses x-forwarded-host/proto (set by reverse proxies) to avoid leaking
 * the internal bind address (0.0.0.0:3000) to the browser.
 */
export function requestBaseUrl(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host")?.split(",")[0].trim()
    || req.headers.get("host") || req.nextUrl.host;
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const proto = forwardedProto === "https" || forwardedProto === "http"
    ? forwardedProto
    : req.nextUrl.protocol.replace(/:$/, "");
  return `${proto}://${host}`;
}
