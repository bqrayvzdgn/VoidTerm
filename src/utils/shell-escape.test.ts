import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildSSHCommand, escapeShellPath } from './validation'

describe('escapeShellPath', () => {
  // Store original platform
  const originalPlatform = process.platform

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  describe('Unix (single-quote escaping)', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'linux' })
    })

    it('should wrap simple paths in single quotes', () => {
      expect(escapeShellPath('/home/user/.ssh/id_rsa')).toBe("'/home/user/.ssh/id_rsa'")
    })

    it('should escape single quotes within path', () => {
      // Result: '/home/user/it'\''s a key'
      // The function wraps in single quotes and escapes inner quotes
      expect(escapeShellPath("/home/user/it's a key")).toBe("'/home/user/it'\\''s a key'")
    })

    it('should handle paths with spaces', () => {
      expect(escapeShellPath('/home/user/my keys/id_rsa')).toBe("'/home/user/my keys/id_rsa'")
    })

    it('should handle paths with double quotes (no special treatment needed)', () => {
      const result = escapeShellPath('/path/with"quotes')
      expect(result).toBe("'/path/with\"quotes'")
    })
  })

  describe('Windows (double-quote escaping)', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'win32' })
    })

    it('should wrap paths in double quotes', () => {
      expect(escapeShellPath('C:\\Users\\admin\\.ssh\\id_rsa')).toBe('"C:\\Users\\admin\\.ssh\\id_rsa"')
    })

    it('should escape double quotes within path', () => {
      expect(escapeShellPath('C:\\path with"quote')).toBe('"C:\\path with""quote"')
    })

    it('should handle paths with spaces', () => {
      expect(escapeShellPath('C:\\Users\\My User\\.ssh\\key')).toBe('"C:\\Users\\My User\\.ssh\\key"')
    })
  })
})

describe('buildSSHCommand with escapeShellPath', () => {
  const originalPlatform = process.platform

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  it('should use proper escaping for private key path on Unix', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' })

    const command = buildSSHCommand({
      host: 'example.com',
      username: 'admin',
      port: 22,
      privateKeyPath: '/home/user/.ssh/id_rsa'
    })

    expect(command).toBe("ssh admin@example.com -i '/home/user/.ssh/id_rsa'")
  })

  it('should use proper escaping for private key path on Windows', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' })

    const command = buildSSHCommand({
      host: 'example.com',
      username: 'admin',
      port: 22,
      privateKeyPath: 'C:\\Users\\admin\\.ssh\\id_rsa'
    })

    expect(command).toBe('ssh admin@example.com -i "C:\\Users\\admin\\.ssh\\id_rsa"')
  })

  it('should handle paths with spaces safely', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' })

    const command = buildSSHCommand({
      host: 'example.com',
      username: 'admin',
      port: 22,
      privateKeyPath: '/home/user/my keys/id_rsa'
    })

    expect(command).toBe("ssh admin@example.com -i '/home/user/my keys/id_rsa'")
  })

  it('should still reject dangerous paths via validation', () => {
    const command = buildSSHCommand({
      host: 'example.com',
      username: 'admin',
      port: 22,
      privateKeyPath: '/key; rm -rf /'
    })

    expect(command).toBeNull()
  })
})
