import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

/**
 * Rewrite the request URL using x-forwarded-* headers so better-auth sees
 * the public HTTPS URL instead of the internal http://container:3000/... URL.
 * Without this, better-auth compares its configured baseURL (https://domain.com)
 * against the internal URL and issues a redirect → redirect loop behind a TLS proxy.
 */
function withPublicUrl(req: NextRequest): NextRequest {
  const proto = req.headers.get("x-forwarded-proto");
  const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!proto || !host) return req;
  const url = new URL(req.url);
  url.protocol = proto + ":";
  url.host = host;
  return new NextRequest(url.toString(), req);
}

const { GET: _GET, POST: _POST } = toNextJsHandler(auth);

export const GET  = (req: NextRequest) => _GET(withPublicUrl(req));
export const POST = (req: NextRequest) => _POST(withPublicUrl(req));
