/**
 * Reusable in-memory rate limiter for API routes.
 * Simple IP-based throttling with configurable limits per route.
 */

const stores = new Map<string, Map<string, { count: number; resetAt: number }>>();

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = { limit: 10, windowMs: 60_000 };

// Presets for different route types
export const RATE_LIMITS = {
  /** Public forms - strict: 5 per minute */
  FORM: { limit: 5, windowMs: 60_000 },
  /** AI endpoints - moderate: 10 per minute */
  AI: { limit: 10, windowMs: 60_000 },
  /** Plan viewing - relaxed: 30 per minute */
  VIEW: { limit: 30, windowMs: 60_000 },
  /** Webhooks - generous: 100 per minute */
  WEBHOOK: { limit: 100, windowMs: 60_000 },
} as const;

function getStore(routeKey: string): Map<string, { count: number; resetAt: number }> {
  let store = stores.get(routeKey);
  if (!store) {
    store = new Map();
    stores.set(routeKey, store);
  }
  return store;
}

/**
 * Check if a request is within rate limits.
 * @param routeKey - Unique identifier for the route (e.g., 'contact', 'ai-chat')
 * @param ip - Client IP address
 * @param config - Rate limit configuration
 * @returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function rateLimit(
  routeKey: string,
  ip: string,
  config: RateLimitConfig = DEFAULT_CONFIG,
): { allowed: boolean; remaining: number; resetIn: number } {
  const store = getStore(routeKey);
  const now = Date.now();

  // Periodic cleanup - remove expired entries when store grows
  if (store.size > 500) {
    for (const [k, v] of store) {
      if (now > v.resetAt) store.delete(k);
    }
  }

  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.limit - 1, resetIn: config.windowMs };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: config.limit - entry.count, resetIn: entry.resetAt - now };
}

/**
 * Helper to extract client IP from Next.js request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return '127.0.0.1';
}

/**
 * Returns a 429 JSON response with standard rate limit headers
 */
export function rateLimitResponse(resetIn: number): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(resetIn / 1000)),
        'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000)),
      },
    },
  );
}
