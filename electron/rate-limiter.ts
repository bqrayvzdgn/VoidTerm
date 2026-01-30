/**
 * Simple token-bucket rate limiter for IPC handlers.
 * Prevents renderer from flooding the main process with requests.
 */

import { createLogger } from './logger'

const logger = createLogger('RateLimiter')

interface BucketConfig {
  /** Maximum tokens (burst capacity) */
  maxTokens: number
  /** Tokens added per second */
  refillRate: number
}

interface Bucket {
  tokens: number
  lastRefill: number
  config: BucketConfig
}

const buckets = new Map<string, Bucket>()

/**
 * Pre-defined rate limit profiles
 */
export const RATE_LIMITS = {
  /** High-frequency operations like pty-write (500/sec burst, 300/sec sustained) */
  ptyWrite: { maxTokens: 500, refillRate: 300 },
  /** Medium-frequency operations like pty-resize (30/sec burst, 20/sec sustained) */
  ptyResize: { maxTokens: 30, refillRate: 20 },
  /** Low-frequency operations like config changes (10/sec burst, 5/sec sustained) */
  config: { maxTokens: 10, refillRate: 5 },
  /** Very low-frequency operations like pty-create (5/sec burst, 2/sec sustained) */
  ptyCreate: { maxTokens: 5, refillRate: 2 }
} as const

/**
 * Check if a request is allowed under the rate limit.
 * Uses token-bucket algorithm for burst tolerance.
 *
 * @param channel - IPC channel name used as the bucket key
 * @param config - Rate limit configuration
 * @returns true if allowed, false if rate-limited
 */
export function isAllowed(channel: string, config: BucketConfig): boolean {
  const now = Date.now()
  let bucket = buckets.get(channel)

  if (!bucket) {
    bucket = { tokens: config.maxTokens, lastRefill: now, config }
    buckets.set(channel, bucket)
  }

  // Refill tokens based on elapsed time
  const elapsed = (now - bucket.lastRefill) / 1000
  bucket.tokens = Math.min(config.maxTokens, bucket.tokens + elapsed * config.refillRate)
  bucket.lastRefill = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return true
  }

  logger.warn(`Rate limit exceeded for channel: ${channel}`)
  return false
}

/**
 * Reset all rate limit buckets (useful for testing)
 */
export function resetAllBuckets(): void {
  buckets.clear()
}
