import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLogger } from './logger'

describe('createLogger', () => {

  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create a logger with all log methods', () => {
    const logger = createLogger('TestContext')

    expect(logger.debug).toBeDefined()
    expect(logger.info).toBeDefined()
    expect(logger.warn).toBeDefined()
    expect(logger.error).toBeDefined()
  })

  it('should include context in formatted message', () => {
    const logger = createLogger('MyModule')
    logger.error('something failed')

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[MyModule]'),
      // no extra args
    )
  })

  it('should include timestamp in formatted message', () => {
    const logger = createLogger('Test')
    logger.error('test message')

    const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0]
    // Should contain ISO timestamp pattern
    expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T/)
  })

  it('should include log level in formatted message', () => {
    const logger = createLogger('Test')
    logger.error('test message')

    const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call).toContain('[ERROR]')
  })

  it('should pass additional arguments to console methods', () => {
    const logger = createLogger('Test')
    const extra = { key: 'value' }
    logger.error('message', extra)

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('message'),
      extra
    )
  })

  it('should always log warn and error regardless of level', () => {
    const logger = createLogger('Test')

    logger.warn('warning message')
    logger.error('error message')

    expect(console.warn).toHaveBeenCalled()
    expect(console.error).toHaveBeenCalled()
  })
})

describe('pre-configured loggers', () => {
  it('should export pre-configured loggers', async () => {
    const { appLogger, terminalLogger, settingsLogger, workspaceLogger } = await import('./logger')

    expect(appLogger).toBeDefined()
    expect(appLogger.debug).toBeDefined()
    expect(terminalLogger).toBeDefined()
    expect(settingsLogger).toBeDefined()
    expect(workspaceLogger).toBeDefined()
  })
})
