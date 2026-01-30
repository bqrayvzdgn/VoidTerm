import { describe, it, expect, beforeEach } from 'vitest'

/**
 * Rate limiter logic test (mirrors electron/rate-limiter.ts algorithm)
 * We test the algorithm in isolation since the electron module
 * requires electron runtime context.
 */

interface BucketConfig {
  maxTokens: number
  refillRate: number
}

interface Bucket {
  tokens: number
  lastRefill: number
  config: BucketConfig
}

// Replicate the rate limiter logic for testing
const buckets = new Map<string, Bucket>()

function isAllowed(channel: string, config: BucketConfig, now = Date.now()): boolean {
  let bucket = buckets.get(channel)

  if (!bucket) {
    bucket = { tokens: config.maxTokens, lastRefill: now, config }
    buckets.set(channel, bucket)
  }

  const elapsed = (now - bucket.lastRefill) / 1000
  bucket.tokens = Math.min(config.maxTokens, bucket.tokens + elapsed * config.refillRate)
  bucket.lastRefill = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return true
  }

  return false
}

function resetAllBuckets(): void {
  buckets.clear()
}

describe('Rate Limiter', () => {
  beforeEach(() => {
    resetAllBuckets()
  })

  describe('isAllowed', () => {
    it('should allow requests within the burst limit', () => {
      const config: BucketConfig = { maxTokens: 5, refillRate: 2 }
      const now = 1000000

      // Should allow up to maxTokens requests immediately
      for (let i = 0; i < 5; i++) {
        expect(isAllowed('test', config, now)).toBe(true)
      }
    })

    it('should reject requests after burst limit is exhausted', () => {
      const config: BucketConfig = { maxTokens: 3, refillRate: 1 }
      const now = 1000000

      // Exhaust all tokens
      expect(isAllowed('test', config, now)).toBe(true)
      expect(isAllowed('test', config, now)).toBe(true)
      expect(isAllowed('test', config, now)).toBe(true)

      // Next request should be denied
      expect(isAllowed('test', config, now)).toBe(false)
    })

    it('should refill tokens over time', () => {
      const config: BucketConfig = { maxTokens: 3, refillRate: 2 }
      let now = 1000000

      // Exhaust all tokens
      isAllowed('test', config, now)
      isAllowed('test', config, now)
      isAllowed('test', config, now)
      expect(isAllowed('test', config, now)).toBe(false)

      // Wait 1 second - should refill 2 tokens
      now += 1000
      expect(isAllowed('test', config, now)).toBe(true)
      expect(isAllowed('test', config, now)).toBe(true)
      // Third should fail (only 2 refilled)
      expect(isAllowed('test', config, now)).toBe(false)
    })

    it('should not exceed maxTokens when refilling', () => {
      const config: BucketConfig = { maxTokens: 3, refillRate: 100 }
      let now = 1000000

      // Use one token
      isAllowed('test', config, now)

      // Wait a long time - refill capped at maxTokens
      now += 10000
      // Should only allow maxTokens (3), not 100*10 = 1000
      expect(isAllowed('test', config, now)).toBe(true)
      expect(isAllowed('test', config, now)).toBe(true)
      expect(isAllowed('test', config, now)).toBe(true)
      expect(isAllowed('test', config, now)).toBe(false)
    })

    it('should maintain separate buckets per channel', () => {
      const config: BucketConfig = { maxTokens: 2, refillRate: 1 }
      const now = 1000000

      // Exhaust channel A
      isAllowed('channelA', config, now)
      isAllowed('channelA', config, now)
      expect(isAllowed('channelA', config, now)).toBe(false)

      // Channel B should still have tokens
      expect(isAllowed('channelB', config, now)).toBe(true)
    })

    it('should handle zero elapsed time correctly', () => {
      const config: BucketConfig = { maxTokens: 2, refillRate: 10 }
      const now = 1000000

      // Multiple calls at exact same time
      expect(isAllowed('test', config, now)).toBe(true)
      expect(isAllowed('test', config, now)).toBe(true)
      expect(isAllowed('test', config, now)).toBe(false)
    })

    it('should handle fractional token refills', () => {
      const config: BucketConfig = { maxTokens: 5, refillRate: 2 }
      let now = 1000000

      // Exhaust all tokens
      for (let i = 0; i < 5; i++) {
        isAllowed('test', config, now)
      }
      expect(isAllowed('test', config, now)).toBe(false)

      // Wait 0.6 seconds - should refill 1.2 tokens (enough for 1)
      now += 600
      expect(isAllowed('test', config, now)).toBe(true)
      expect(isAllowed('test', config, now)).toBe(false)
    })
  })

  describe('resetAllBuckets', () => {
    it('should clear all rate limit state', () => {
      const config: BucketConfig = { maxTokens: 1, refillRate: 0 }
      const now = 1000000

      // Exhaust token
      isAllowed('test', config, now)
      expect(isAllowed('test', config, now)).toBe(false)

      // Reset
      resetAllBuckets()

      // Should work again
      expect(isAllowed('test', config, now)).toBe(true)
    })
  })

  describe('rate limit profiles', () => {
    it('ptyWrite profile should handle high throughput', () => {
      const config: BucketConfig = { maxTokens: 500, refillRate: 300 }
      const now = 1000000

      // Should handle 500 burst writes
      let allowed = 0
      for (let i = 0; i < 600; i++) {
        if (isAllowed('pty-write', config, now)) {
          allowed++
        }
      }
      expect(allowed).toBe(500)
    })

    it('ptyCreate profile should be restrictive', () => {
      const config: BucketConfig = { maxTokens: 5, refillRate: 2 }
      const now = 1000000

      let allowed = 0
      for (let i = 0; i < 10; i++) {
        if (isAllowed('pty-create', config, now)) {
          allowed++
        }
      }
      expect(allowed).toBe(5)
    })
  })
})
