/**
 * Lightweight in-memory token-bucket rate limiter.
 * NOT cluster-safe — fine for a single-node deployment, replaceable later
 * by Upstash/Redis without changing the call sites.
 *
 * Usage:
 *   const ok = rateLimit({ key: `lead:${ip}:${cardId}`, max: 5, windowMs: 60_000 });
 *   if (!ok) return NextResponse.json({ error: "rate limited" }, { status: 429 });
 */

interface Bucket { count: number; resetAt: number }

const store = new Map<string, Bucket>();

// Periodically prune expired buckets so the map doesn't grow unbounded.
let lastSweep = Date.now();
function maybeSweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k);
  }
}

export function rateLimit(opts: { key: string; max: number; windowMs: number }): boolean {
  const now = Date.now();
  maybeSweep(now);
  const cur = store.get(opts.key);
  if (!cur || cur.resetAt <= now) {
    store.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return true;
  }
  if (cur.count >= opts.max) return false;
  cur.count += 1;
  return true;
}
