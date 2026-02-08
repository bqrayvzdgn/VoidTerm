import { createLogger } from './logger'

const logger = createLogger('DeepLink')

export interface DeepLinkAction {
  type: 'open' | 'ssh' | 'run'
  cwd?: string
  host?: string
  user?: string
  cmd?: string
}

/**
 * Parse a voidterm:// deep link URL into an action.
 * Supported formats:
 *   voidterm://open?cwd=/path/to/dir
 *   voidterm://ssh?host=example.com&user=root
 *   voidterm://run?cmd=ls+-la  (requires user confirmation)
 */
export function parseDeepLink(url: string): DeepLinkAction | null {
  try {
    const parsed = new URL(url)

    if (parsed.protocol !== 'voidterm:') {
      logger.warn(`Invalid deep link protocol: ${parsed.protocol}`)
      return null
    }

    const action = parsed.hostname
    const params = parsed.searchParams

    switch (action) {
      case 'open': {
        const cwd = params.get('cwd')
        if (!cwd) {
          logger.warn('Deep link open: missing cwd parameter')
          return null
        }
        // Basic path traversal check
        if (cwd.includes('..')) {
          logger.warn('Deep link open: path traversal detected')
          return null
        }
        return { type: 'open', cwd }
      }

      case 'ssh': {
        const host = params.get('host')
        const user = params.get('user')
        if (!host) {
          logger.warn('Deep link ssh: missing host parameter')
          return null
        }
        return { type: 'ssh', host, user: user || undefined }
      }

      case 'run': {
        const cmd = params.get('cmd')
        if (!cmd) {
          logger.warn('Deep link run: missing cmd parameter')
          return null
        }
        return { type: 'run', cmd }
      }

      default:
        logger.warn(`Unknown deep link action: ${action}`)
        return null
    }
  } catch (error) {
    logger.error('Failed to parse deep link:', error)
    return null
  }
}
