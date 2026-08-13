// Best-effort in-memory sliding-window rate limiter. Real limit for a
// single long-running Node process; on multi-instance serverless hosting
// each instance keeps its own counter, so this raises the bar for casual
// abuse but is not a hard guarantee. For a real production guarantee
// (shared state across instances), swap this for Upstash Redis or
// Vercel KV -- both need the user to create an account and hand over a
// connection URL, so this in-memory version is the honest default until
// that's provided.

const buckets = new Map<string, { count: number; resetAt: number }>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count += 1
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
