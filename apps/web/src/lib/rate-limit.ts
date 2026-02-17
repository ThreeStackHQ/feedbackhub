import { AppError } from "./errors";

/**
 * Simple in-memory rate limiter (for MVP)
 * TODO: Replace with Redis for production
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit for a given key
 * @param key - Unique identifier (e.g., "vote:192.168.1.1" or "comment:user@example.com")
 * @param limit - Maximum requests allowed
 * @param windowSeconds - Time window in seconds
 * @throws AppError if rate limit exceeded
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<void> {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (entry) {
    if (now > entry.resetAt) {
      // Window expired, reset
      rateLimitStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    } else {
      // Within window
      if (entry.count >= limit) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        throw new AppError(
          `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          429
        );
      }
      entry.count++;
    }
  } else {
    // First request
    rateLimitStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
  }
}

/**
 * Cleanup expired entries (run periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof window === "undefined") {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
