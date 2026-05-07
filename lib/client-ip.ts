/**
 * Privacy-safe client IP extraction.
 * Returns the IP truncated to /24 (IPv4) or /48 (IPv6) so we can still do
 * coarse geo / device deduplication without storing personally identifying
 * full addresses (DSGVO-friendly).
 */
export function clientIp(req: { headers: Headers | { get(name: string): string | null } }): string {
  const h = req.headers;
  const xff = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = h.get("x-real-ip")?.trim();
  const raw = xff || real || "";
  return anonymizeIp(raw);
}

/** Truncate IPv4 to /24 ("192.168.1.0") and IPv6 to /48. */
export function anonymizeIp(ip: string): string {
  if (!ip) return "";
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  // IPv6 — keep first 3 hextets, zero the rest
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return [parts[0] ?? "", parts[1] ?? "", parts[2] ?? "", "0", "0", "0", "0", "0"].join(":");
  }
  return "";
}
