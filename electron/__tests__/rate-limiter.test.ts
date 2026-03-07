import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })
}))

import { isAllowed, resetAllBuckets, RATE_LIMITS } from '../rate-limiter'

describe('rate-limiter', () => {
  beforeEach(() => {
    resetAllBuckets()
    vi.restoreAllMocks()
  })

  it('allows requests from a fresh bucket', () => {
    expect(isAllowed('test-channel', RATE_LIMITS.ptyCreate)).toBe(true)
  })

  it('allows requests up to maxTokens', () => {
    const config = { maxTokens: 3, refillRate: 0 }
    expect(isAllowed('limited', config)).toBe(true)
    expect(isAllowed('limited', config)).toBe(true)
    expect(isAllowed('limited', config)).toBe(true)
  })

  it('denies requests when bucket is depleted', () => {
    const config = { maxTokens: 2, refillRate: 0 }
    isAllowed('depleted', config)
    isAllowed('depleted', config)
    expect(isAllowed('depleted', config)).toBe(false)
  })

  it('refills tokens over time', () => {
    const config = { maxTokens: 2, refillRate: 10 }
    // Drain the bucket
    isAllowed('refill-test', config)
    isAllowed('refill-test', config)
    expect(isAllowed('refill-test', config)).toBe(false)

    // Advance time by 1 second, should refill 10 tokens (capped at 2)
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now + 1000)
    expect(isAllowed('refill-test', config)).toBe(true)
  })

  it('resetAllBuckets clears all state', () => {
    const config = { maxTokens: 1, refillRate: 0 }
    isAllowed('reset-test', config)
    expect(isAllowed('reset-test', config)).toBe(false)

    resetAllBuckets()
    expect(isAllowed('reset-test', config)).toBe(true)
  })

  it('maintains separate buckets per channel', () => {
    const config = { maxTokens: 1, refillRate: 0 }
    isAllowed('channel-a', config)
    expect(isAllowed('channel-a', config)).toBe(false)
    // Channel B should still have tokens
    expect(isAllowed('channel-b', config)).toBe(true)
  })

  it('RATE_LIMITS has expected profiles', () => {
    expect(RATE_LIMITS.ptyWrite.maxTokens).toBe(500)
    expect(RATE_LIMITS.ptyResize.maxTokens).toBe(30)
    expect(RATE_LIMITS.config.maxTokens).toBe(10)
    expect(RATE_LIMITS.ptyCreate.maxTokens).toBe(5)
  })

  it('does not exceed maxTokens after long idle', () => {
    const config = { maxTokens: 3, refillRate: 100 }
    isAllowed('cap-test', config)

    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now + 10000)

    // Should allow 3 requests (capped) then deny
    expect(isAllowed('cap-test', config)).toBe(true)
    expect(isAllowed('cap-test', config)).toBe(true)
    expect(isAllowed('cap-test', config)).toBe(true)
    expect(isAllowed('cap-test', config)).toBe(false)
  })
})
