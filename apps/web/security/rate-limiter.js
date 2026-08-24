/**
 * @file security/rate-limiter.js
 * @description In-memory sliding-window rate limiter for the API server.
 *
 * Strategy: Sliding Window Counter per IP + Session.
 *   - Cheaper than token bucket but more accurate than fixed window.
 *   - Each IP gets its own counter with a rolling time window.
 *   - Exceeding the limit returns HTTP 429 with a Retry-After header.
 *
 * Limits (configurable per route group):
 *   - /api/v1/files/upload-request  → 20 requests / 60 seconds per IP
 *   - /api/v1/jobs (POST)           → 30 requests / 60 seconds per IP
 *   - /api/v1/jobs/:id (GET)        → 120 requests / 60 seconds per IP (polling)
 *   - General API                   → 200 requests / 60 seconds per IP
 *
 * Production Upgrade Path:
 *   Replace this store with Redis INCR + EXPIRE for multi-instance deployments.
 *   See TECH_DEBT.md for tracking entry.
 */

const WINDOW_MS = 60_000; // 1 minute sliding window

// Route-specific limits: [maxRequests, windowMs]
export const ROUTE_LIMITS = {
  upload:  { maxRequests: 20,  windowMs: WINDOW_MS },
  job:     { maxRequests: 30,  windowMs: WINDOW_MS },
  poll:    { maxRequests: 120, windowMs: WINDOW_MS },
  default: { maxRequests: 200, windowMs: WINDOW_MS },
};

/**
 * In-memory store: Map<key, { count: number; windowStart: number }>
 * Automatically pruned when windows expire.
 */
const store = new Map();

// Prune expired windows every 2 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > entry.windowMs) {
      store.delete(key);
    }
  }
}, 120_000).unref(); // .unref() so the interval doesn't keep the process alive

/**
 * Extract client IP from request, respecting X-Forwarded-For in proxy environments.
 * Falls back to remoteAddress for direct connections.
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For: client, proxy1, proxy2 — take the first (real client)
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Classify a request into a rate limit group.
 */
function classifyRequest(pathname, method) {
  if (pathname === '/api/v1/files/upload-request' && method === 'POST') return 'upload';
  if (pathname === '/api/v1/jobs' && method === 'POST') return 'job';
  if (pathname.startsWith('/api/v1/jobs/') && method === 'GET') return 'poll';
  if (pathname.startsWith('/api/')) return 'default';
  return null; // No rate limiting on static assets
}

/**
 * Check if a request should be rate limited.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {string} pathname
 * @returns {{ limited: boolean; retryAfterSeconds: number; remaining: number }}
 */
export function checkRateLimit(req, pathname) {
  const group = classifyRequest(pathname, req.method);
  if (!group) return { limited: false, retryAfterSeconds: 0, remaining: Infinity };

  const limit = ROUTE_LIMITS[group];
  const ip = getClientIp(req);
  const key = `${ip}:${group}`;
  const now = Date.now();

  let entry = store.get(key);

  // Expired or new window — reset counter
  if (!entry || now - entry.windowStart > limit.windowMs) {
    entry = { count: 0, windowStart: now, windowMs: limit.windowMs };
  }

  entry.count++;
  store.set(key, entry);

  if (entry.count > limit.maxRequests) {
    const windowElapsed = now - entry.windowStart;
    const retryAfterMs = limit.windowMs - windowElapsed;
    return {
      limited: true,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      remaining: 0,
    };
  }

  return {
    limited: false,
    retryAfterSeconds: 0,
    remaining: limit.maxRequests - entry.count,
  };
}

/**
 * Middleware-style wrapper: returns true if the request was rejected.
 * Automatically writes the 429 response when rate limited.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} pathname
 * @returns {boolean} true if the request was blocked
 */
export function applyRateLimit(req, res, pathname) {
  const result = checkRateLimit(req, pathname);

  if (result.limited) {
    const body = JSON.stringify({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please slow down.',
        retryAfterSeconds: result.retryAfterSeconds,
        userAction: `You have exceeded the request limit. Please wait ${result.retryAfterSeconds} second(s) and try again.`,
      },
    });
    res.writeHead(429, {
      'Content-Type': 'application/json',
      'Retry-After': String(result.retryAfterSeconds),
      'X-RateLimit-Remaining': '0',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(body);
    return true;
  }

  // Set rate limit headers on successful requests too (good API citizen)
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  return false;
}
