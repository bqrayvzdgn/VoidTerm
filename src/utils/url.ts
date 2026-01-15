/**
 * URL validation utilities for secure external link handling
 */

// Allowed protocols for external links
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:']

/**
 * Validates if a URL is safe to open externally
 * Prevents javascript:, data:, file:// and other potentially dangerous protocols
 */
export function isValidExternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    const parsed = new URL(url)
    return ALLOWED_PROTOCOLS.includes(parsed.protocol)
  } catch {
    // Invalid URL format
    return false
  }
}

/**
 * Sanitizes and validates a URL for external opening
 * Returns the URL if valid, null otherwise
 */
export function sanitizeExternalUrl(url: string): string | null {
  if (isValidExternalUrl(url)) {
    return url
  }
  return null
}
