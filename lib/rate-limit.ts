import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Upstash Redis Rate Limiter (Production) ───────────────────────────────
// Shared across ALL Vercel serverless instances — the only correct approach
// for serverless deployments. Falls back to in-memory if env vars are missing.

let redisRatelimiter: Ratelimit | null = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    redisRatelimiter = new Ratelimit({
      redis,
      // Sliding window: counts requests in a rolling time window
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      analytics: false,
      prefix: "leadmagnets_rl",
    });
  } catch (e) {
    console.warn("[rate-limit] Failed to initialise Upstash Redis. Falling back to in-memory limiter.", e);
  }
}

// ─── In-Memory Fallback (Development / Upstash not configured) ─────────────
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

function checkInMemoryRateLimit(
  ip: string,
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const mapKey = `${key}:${ip}`;
  const record = rateLimitMap.get(mapKey);

  // Periodically purge expired entries to prevent memory leaks
  if (rateLimitMap.size > 5000) {
    rateLimitMap.forEach((v, k) => {
      if (v.resetTime < now) rateLimitMap.delete(k);
    });
  }

  if (!record || record.resetTime < now) {
    rateLimitMap.set(mapKey, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, reset: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: Math.ceil((record.resetTime - now) / 1000) };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count, reset: Math.ceil((record.resetTime - now) / 1000) };
}

// ─── Public API ─────────────────────────────────────────────────────────────
/**
 * Checks the rate limit for the given IP and key.
 * Uses Upstash Redis in production (shared across all serverless instances).
 * Falls back to in-memory if Upstash is not configured (local dev).
 */
export async function checkRateLimit(
  ip: string,
  key: string = "global",
  limit: number = 30,
  windowMs: number = 60 * 1000
): Promise<{ success: boolean; remaining: number; reset: number }> {
  // Use shared Redis limiter when available
  if (redisRatelimiter) {
    try {
      const identifier = `${key}:${ip}`;
      const result = await redisRatelimiter.limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
        reset: Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch (e) {
      // If Redis call fails (network blip, outage) → fail open so users aren't locked out
      console.warn("[rate-limit] Upstash Redis call failed, failing open:", e);
      return { success: true, remaining: limit, reset: 60 };
    }
  }

  // Fallback: in-memory (works only on single-instance / local dev)
  return checkInMemoryRateLimit(ip, key, limit, windowMs);
}

