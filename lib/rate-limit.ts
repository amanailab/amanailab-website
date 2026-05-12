// Simple in-memory rate limiter — works per serverless instance.
// For distributed deployments replace with Upstash Redis.

interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>()

// Clean stale entries every 2 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [k, v] of store) if (now > v.resetAt) store.delete(k)
  }, 120_000)
}

const IP_RE = /^[\d.a-fA-F:]+$/

/**
 * Check whether a key (IP + route) is within rate limit.
 * @param key      Unique identifier (e.g. `${ip}:resume-analyze`)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in ms (default 60 s)
 */
export function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 }
  }

  if (entry.count >= limit) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000)
    console.warn(`[RateLimit] Blocked key="${key}" retryAfter=${retryAfterSec}s`)
    return { allowed: false, remaining: 0, retryAfterSec }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, retryAfterSec: 0 }
}

/** Extract best-effort client IP from Next.js request headers.
 *  Validates the value looks like an IP to avoid log injection. */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) {
    const candidate = fwd.split(',')[0].trim()
    if (IP_RE.test(candidate)) return candidate
  }
  const real = req.headers.get('x-real-ip')
  if (real && IP_RE.test(real.trim())) return real.trim()
  return 'unknown'
}
