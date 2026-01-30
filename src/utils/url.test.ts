import { describe, it, expect } from 'vitest'
import { isValidExternalUrl, sanitizeExternalUrl } from './url'

describe('isValidExternalUrl', () => {
  describe('allowed protocols', () => {
    it('should accept https URLs', () => {
      expect(isValidExternalUrl('https://example.com')).toBe(true)
      expect(isValidExternalUrl('https://example.com/path?q=1&b=2')).toBe(true)
      expect(isValidExternalUrl('https://sub.domain.example.com')).toBe(true)
      expect(isValidExternalUrl('https://example.com:8443/secure')).toBe(true)
    })

    it('should accept http URLs', () => {
      expect(isValidExternalUrl('http://example.com')).toBe(true)
      expect(isValidExternalUrl('http://localhost:3000')).toBe(true)
    })

    it('should accept mailto URLs', () => {
      expect(isValidExternalUrl('mailto:user@example.com')).toBe(true)
      expect(isValidExternalUrl('mailto:user@example.com?subject=Hello')).toBe(true)
    })
  })

  describe('blocked protocols', () => {
    it('should reject javascript: protocol', () => {
      expect(isValidExternalUrl('javascript:alert(1)')).toBe(false)
      expect(isValidExternalUrl('javascript:void(0)')).toBe(false)
      expect(isValidExternalUrl('JAVASCRIPT:alert(document.cookie)')).toBe(false)
    })

    it('should reject data: protocol', () => {
      expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
      expect(isValidExternalUrl('data:text/html;base64,PHNjcmlwdD4=')).toBe(false)
    })

    it('should reject file: protocol', () => {
      expect(isValidExternalUrl('file:///etc/passwd')).toBe(false)
      expect(isValidExternalUrl('file:///C:/Windows/system32')).toBe(false)
    })

    it('should reject ftp: protocol', () => {
      expect(isValidExternalUrl('ftp://ftp.example.com')).toBe(false)
    })

    it('should reject vbscript: protocol', () => {
      expect(isValidExternalUrl('vbscript:msgbox("xss")')).toBe(false)
    })
  })

  describe('invalid input', () => {
    it('should reject empty strings', () => {
      expect(isValidExternalUrl('')).toBe(false)
    })

    it('should reject null/undefined', () => {
      expect(isValidExternalUrl(null as unknown as string)).toBe(false)
      expect(isValidExternalUrl(undefined as unknown as string)).toBe(false)
    })

    it('should reject non-URL strings', () => {
      expect(isValidExternalUrl('not a url')).toBe(false)
      expect(isValidExternalUrl('just text')).toBe(false)
    })

    it('should reject partial URLs', () => {
      expect(isValidExternalUrl('example.com')).toBe(false)
      expect(isValidExternalUrl('//example.com')).toBe(false)
    })
  })
})

describe('sanitizeExternalUrl', () => {
  it('should return valid URLs unchanged', () => {
    expect(sanitizeExternalUrl('https://example.com')).toBe('https://example.com')
    expect(sanitizeExternalUrl('http://localhost:3000')).toBe('http://localhost:3000')
    expect(sanitizeExternalUrl('mailto:test@test.com')).toBe('mailto:test@test.com')
  })

  it('should return null for invalid URLs', () => {
    expect(sanitizeExternalUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeExternalUrl('data:text/html,xss')).toBeNull()
    expect(sanitizeExternalUrl('')).toBeNull()
    expect(sanitizeExternalUrl('not-a-url')).toBeNull()
  })
})
