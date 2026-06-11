/**
 * Lightweight in-memory rate limiter for Edge/Node API routes.
 *
 * Uses a sliding-window counter stored in a module-level Map.
 * On Vercel Edge each isolate is separate, so this is per-instance —
 * good enough to prevent accidental/script abuse without Vercel KV.
 *
 * Usage:
 *   const result = rateLimit(req, { limit: 30, windowMs: 60_000 });
 *   if (!result.ok) return NextResponse.json({ error: result.message }, { status: 429 });
 */

interface RateLimitOptions {
  /** Maximum requests allowed per window. Default 30. */
  limit?: number;
  /** Window duration in ms. Default 60 000 (1 minute). */
  windowMs?: number;
}

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  message: string;
  headers: Record<string, string>;
}

// module-level store — survives across requests in the same isolate
const store = new Map<string, { count: number; resetAt: number }>();

// Prune expired entries every 5 min to avoid unbounded memory growth
let lastPrune = Date.now();
function pruneExpired() {
  const now = Date.now();
  if (now - lastPrune < 5 * 60_000) return;
  lastPrune = now;
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key);
  }
}

export function rateLimit(
  req: Request,
  { limit = 30, windowMs = 60_000 }: RateLimitOptions = {}
): RateLimitResult {
  pruneExpired();

  // Key: IP (Vercel sets x-real-ip or x-forwarded-for)
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const key = `${ip}:${new URL(req.url).pathname}`;
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  const ok = entry.count <= limit;

  const headers: Record<string, string> = {
    "X-RateLimit-Limit":     String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset":     String(Math.ceil(entry.resetAt / 1000)),
  };

  if (!ok) {
    headers["Retry-After"] = String(Math.ceil((entry.resetAt - now) / 1000));
  }

  return {
    ok,
    remaining,
    message: ok
      ? ""
      : `Rate limit exceeded — ${limit} requests per ${windowMs / 1000}s. Retry after ${headers["Retry-After"]}s.`,
    headers,
  };
}
