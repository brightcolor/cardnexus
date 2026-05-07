import { lookup } from "node:dns/promises";

/**
 * SSRF-protection helper.
 * Returns true when the URL is safe to be called from the server:
 * - https only
 * - resolves to a public IP (not loopback, RFC1918, link-local, multicast,
 *   metadata services 169.254.169.254, etc.)
 */
export async function isSafePublicUrl(rawUrl: string): Promise<boolean> {
  let u: URL;
  try { u = new URL(rawUrl); } catch { return false; }
  if (u.protocol !== "https:") return false;
  if (!u.hostname) return false;

  const blockedHosts = ["localhost", "metadata.google.internal"];
  if (blockedHosts.includes(u.hostname.toLowerCase())) return false;

  // Resolve all A / AAAA records and reject if any is private.
  let addresses: { address: string; family: number }[] = [];
  try {
    addresses = await lookup(u.hostname, { all: true });
  } catch {
    // If we cannot resolve, treat as unsafe.
    return false;
  }
  for (const { address } of addresses) {
    if (isPrivateOrReservedIp(address)) return false;
  }
  return true;
}

export function isPrivateOrReservedIp(ip: string): boolean {
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true;                            // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true;     // 172.16.0.0/12
    if (a === 192 && b === 168) return true;              // 192.168.0.0/16
    if (a === 127) return true;                           // loopback
    if (a === 0) return true;                             // 0.0.0.0/8
    if (a === 169 && b === 254) return true;              // link-local + AWS metadata
    if (a >= 224) return true;                            // multicast / reserved
    if (a === 100 && b >= 64 && b <= 127) return true;    // CGNAT
    return false;
  }
  // IPv6
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  if (lower.startsWith("fe80:")) return true;             // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA
  if (lower.startsWith("ff")) return true;                // multicast
  return false;
}
