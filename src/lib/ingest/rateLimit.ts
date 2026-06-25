import "server-only";

/**
 * In-memory token-bucket per key. Tuned for the `/api/ingest` route:
 * structuring is slow + expensive, so a few requests per minute per
 * IP is plenty. Process-local — fine for `next start` / single-instance
 * serverless; a multi-instance deploy should swap in a Redis bucket.
 */

interface Bucket {
  tokens: number;
  lastRefillMs: number;
}

const BUCKETS = new Map<string, Bucket>();

export interface RateLimitConfig {
  /** Bucket capacity. Burst limit. */
  capacity: number;
  /** Tokens added per second. Steady-state rate. */
  refillPerSecond: number;
}

const DEFAULT: RateLimitConfig = { capacity: 5, refillPerSecond: 5 / 60 }; // 5 / minute, 5 burst

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT,
  nowMs: number = Date.now(),
): RateLimitResult {
  let bucket = BUCKETS.get(key);
  if (!bucket) {
    bucket = { tokens: config.capacity, lastRefillMs: nowMs };
    BUCKETS.set(key, bucket);
  }
  const elapsed = (nowMs - bucket.lastRefillMs) / 1000;
  bucket.tokens = Math.min(
    config.capacity,
    bucket.tokens + elapsed * config.refillPerSecond,
  );
  bucket.lastRefillMs = nowMs;
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { ok: true, remaining: Math.floor(bucket.tokens), retryAfterSeconds: 0 };
  }
  const tokensShort = 1 - bucket.tokens;
  return {
    ok: false,
    remaining: 0,
    retryAfterSeconds: Math.ceil(tokensShort / config.refillPerSecond),
  };
}

/** Test helper — clear all buckets. */
export function resetRateLimit(): void {
  BUCKETS.clear();
}
