/**
 * Structured logging system for main process
 * Uses electron-log with context-aware loggers
 */
import log from 'electron-log'
import { app } from 'electron'

// Configure electron-log
log.transports.file.level = 'info'
log.transports.console.level = app.isPackaged ? 'warn' : 'debug'

// Configure file rotation
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface Logger {
  debug: (message: string, ...args: unknown[]) => void
  info: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
  error: (message: string, ...args: unknown[]) => void
}

/**
 * Creates a context-aware logger
 * @param context - Logger context (e.g., 'PtyManager', 'Main', 'ConfigManager')
 */
export function createLogger(context: string): Logger {
  const formatMessage = (message: string) => `[${context}] ${message}`

  return {
    debug: (message: string, ...args: unknown[]) => {
      log.debug(formatMessage(message), ...args)
    },
    info: (message: string, ...args: unknown[]) => {
      log.info(formatMessage(message), ...args)
    },
    warn: (message: string, ...args: unknown[]) => {
      log.warn(formatMessage(message), ...args)
    },
    error: (message: string, ...args: unknown[]) => {
      log.error(formatMessage(message), ...args)
    }
  }
}

// Default logger for main process
export const mainLogger = createLogger('Main')

// Export raw log for special cases
export { log }
