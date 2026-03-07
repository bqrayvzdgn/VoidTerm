import { describe, it, expect } from 'vitest'

describe('test setup', () => {
  it('should have electronAPI mock available', () => {
    expect(window.electronAPI).toBeDefined()
    expect(window.electronAPI.platform).toBe('win32')
    expect(window.electronAPI.versions.electron).toBe('28.0.0')
  })

  it('should have mock PTY methods', async () => {
    const id = await window.electronAPI.ptyCreate({})
    expect(id).toBe('test-pty-id')
  })

  it('should have mock config methods', async () => {
    const settings = await window.electronAPI.config.getSettings()
    expect(settings).toEqual({})
  })

  it('should have clipboard mock', async () => {
    await navigator.clipboard.writeText('test')
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test')
  })
})
