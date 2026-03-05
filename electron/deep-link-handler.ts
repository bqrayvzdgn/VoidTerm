import path from 'path'
import os from 'os'
import { createLogger } from './logger'

const logger = createLogger('DeepLink')

export interface DeepLinkAction {
  type: 'open' | 'ssh' | 'run'
  cwd?: string
  host?: string
  user?: string
  cmd?: string
}

/** Maximum allowed command length for deep link 'run' actions */
const MAX_CMD_LENGTH = 500

/** Hostname validation — IP or domain name */
function isValidHostname(hostname: string): boolean {
  if (!hostname || hostname.length > 255) return false
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Regex.test(hostname)) {
    return hostname.split('.').every(part => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  }
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return domainRegex.test(hostname)
}

/** Username validation */
function isValidUsername(username: string): boolean {
  if (!username || username.length > 32) return false
  return /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(username)
}

/** Dangerous command patterns that should be blocked or flagged */
const DANGEROUS_CMD_PATTERNS = /\b(rm\s+-rf|mkfs|format|dd\s+if=|shutdown|reboot|:(){ :|curl\s+.*\|\s*sh|wget\s+.*\|\s*sh)\b/i

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
        // Resolve and normalize path to prevent traversal bypasses (e.g., %2e%2e)
        const resolved = path.resolve(path.normalize(cwd))
        const homeDir = os.homedir()
        // Ensure resolved path is under the user's home directory
        if (!resolved.startsWith(homeDir)) {
          logger.warn(`Deep link open: path traversal blocked — resolved to ${resolved}`)
          return null
        }
        return { type: 'open', cwd: resolved }
      }

      case 'ssh': {
        const host = params.get('host')
        const user = params.get('user')
        if (!host) {
          logger.warn('Deep link ssh: missing host parameter')
          return null
        }
        // Validate host and user using proper validation
        if (!isValidHostname(host)) {
          logger.warn(`Deep link ssh: invalid hostname: ${host}`)
          return null
        }
        if (user && !isValidUsername(user)) {
          logger.warn(`Deep link ssh: invalid username: ${user}`)
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
        // Enforce command length limit
        if (cmd.length > MAX_CMD_LENGTH) {
          logger.warn(`Deep link run: command too long (${cmd.length} chars, max ${MAX_CMD_LENGTH})`)
          return null
        }
        // Block known dangerous commands
        if (DANGEROUS_CMD_PATTERNS.test(cmd)) {
          logger.warn('Deep link run: dangerous command pattern detected')
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
