interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * In-memory rate limiter for Next.js API routes & Middleware.
 * Cleans up expired entries periodically to prevent memory leaks.
 */
export function checkRateLimit(
  ip: string,
  key: string = "global",
  limit: number = 60,
  windowMs: number = 60 * 1000
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const mapKey = `${key}:${ip}`;

  const record = rateLimitMap.get(mapKey);

  // Periodically clean expired keys if map grows large (> 5000 records)
  if (rateLimitMap.size > 5000) {
    rateLimitMap.forEach((v, k) => {
      if (v.resetTime < now) {
        rateLimitMap.delete(k);
      }
    });
  }

  if (!record || record.resetTime < now) {
    rateLimitMap.set(mapKey, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, reset: windowMs };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: Math.ceil((record.resetTime - now) / 1000) };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count, reset: Math.ceil((record.resetTime - now) / 1000) };
}
