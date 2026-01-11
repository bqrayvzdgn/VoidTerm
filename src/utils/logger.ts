/**
 * Structured logging system for renderer process
 * Context-aware logger with development/production support
 */

// Check if running in development mode
const isDevelopment = import.meta.env?.DEV ?? process.env.NODE_ENV !== 'production'

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface Logger {
  debug: (message: string, ...args: unknown[]) => void
  info: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
  error: (message: string, ...args: unknown[]) => void
}

// Current log level - in production, only warn and error are shown
const currentLevel: LogLevel = isDevelopment ? 'debug' : 'warn'

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[currentLevel]
}

/**
 * Creates a context-aware logger
 * @param context - Logger context (e.g., 'TerminalManager', 'SettingsStore')
 */
export function createLogger(context: string): Logger {
  const formatMessage = (level: LogLevel, message: string) => {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`
  }

  return {
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug')) {
        // eslint-disable-next-line no-console
        console.debug(formatMessage('debug', message), ...args)
      }
    },
    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        // eslint-disable-next-line no-console
        console.info(formatMessage('info', message), ...args)
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn')) {
        // eslint-disable-next-line no-console
        console.warn(formatMessage('warn', message), ...args)
      }
    },
    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error')) {
        // eslint-disable-next-line no-console
        console.error(formatMessage('error', message), ...args)
      }
    }
  }
}

// Pre-configured loggers for common contexts
export const appLogger = createLogger('App')
export const terminalLogger = createLogger('Terminal')
export const settingsLogger = createLogger('Settings')
export const workspaceLogger = createLogger('Workspace')
