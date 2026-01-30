/**
 * Structured logging system for main process
 * Uses electron-log with context-aware loggers
 */
import log from 'electron-log'

// Configure electron-log (file transport)
log.transports.file.level = 'info'
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

// Console log level is configured lazily to avoid accessing
// app.isPackaged before the app module is fully initialized.
let consoleConfigured = false
function ensureConsoleLevel(): void {
  if (consoleConfigured) return
  consoleConfigured = true
  try {
    const { app } = require('electron')
    log.transports.console.level = app.isPackaged ? 'warn' : 'debug'
  } catch {
    log.transports.console.level = 'debug'
  }
}

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
      ensureConsoleLevel()
      log.debug(formatMessage(message), ...args)
    },
    info: (message: string, ...args: unknown[]) => {
      ensureConsoleLevel()
      log.info(formatMessage(message), ...args)
    },
    warn: (message: string, ...args: unknown[]) => {
      ensureConsoleLevel()
      log.warn(formatMessage(message), ...args)
    },
    error: (message: string, ...args: unknown[]) => {
      ensureConsoleLevel()
      log.error(formatMessage(message), ...args)
    }
  }
}

// Default logger for main process
export const mainLogger = createLogger('Main')

// Export raw log for special cases
export { log }
