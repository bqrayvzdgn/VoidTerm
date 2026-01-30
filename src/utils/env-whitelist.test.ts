import { describe, it, expect } from 'vitest'

/**
 * Tests for PTY environment variable whitelist logic.
 * We replicate the core logic here since the actual module
 * runs in the electron main process.
 */

const ENV_WHITELIST_WIN32 = [
  'COMSPEC', 'SYSTEMROOT', 'SYSTEMDRIVE', 'WINDIR',
  'PATH', 'PATHEXT', 'TEMP', 'TMP',
  'HOMEDRIVE', 'HOMEPATH', 'USERPROFILE', 'USERNAME',
  'APPDATA', 'LOCALAPPDATA', 'PROGRAMDATA',
  'PROGRAMFILES', 'PROGRAMFILES(X86)', 'COMMONPROGRAMFILES',
  'NUMBER_OF_PROCESSORS', 'PROCESSOR_ARCHITECTURE', 'OS',
  'LANG', 'LC_ALL', 'LC_CTYPE',
  'PSModulePath'
]

const ENV_WHITELIST_UNIX = [
  'PATH', 'HOME', 'USER', 'LOGNAME', 'SHELL',
  'LANG', 'LC_ALL', 'LC_CTYPE', 'LC_MESSAGES', 'LC_COLLATE',
  'DISPLAY', 'WAYLAND_DISPLAY', 'XDG_RUNTIME_DIR', 'XDG_SESSION_TYPE',
  'XDG_DATA_HOME', 'XDG_CONFIG_HOME', 'XDG_CACHE_HOME',
  'TMPDIR', 'EDITOR', 'VISUAL', 'PAGER',
  'SSH_AUTH_SOCK', 'SSH_AGENT_PID',
  'DBUS_SESSION_BUS_ADDRESS'
]

function buildSafeEnv(
  processEnv: Record<string, string | undefined>,
  platform: string,
  userEnv?: Record<string, string>
): Record<string, string> {
  const whitelist = platform === 'win32' ? ENV_WHITELIST_WIN32 : ENV_WHITELIST_UNIX
  const safeEnv: Record<string, string> = {}

  for (const key of whitelist) {
    const value = processEnv[key]
    if (value !== undefined) {
      safeEnv[key] = value
    }
  }

  if (userEnv) {
    Object.assign(safeEnv, userEnv)
  }

  safeEnv['TERM'] = 'xterm-256color'
  safeEnv['COLORTERM'] = 'truecolor'

  return safeEnv
}

describe('buildSafeEnv', () => {
  describe('whitelist filtering', () => {
    it('should only include whitelisted env vars on Unix', () => {
      const processEnv: Record<string, string | undefined> = {
        PATH: '/usr/bin',
        HOME: '/home/user',
        SECRET_API_KEY: 'super-secret-123',
        AWS_ACCESS_KEY_ID: 'AKIA...',
        DATABASE_URL: 'postgres://...',
        SHELL: '/bin/bash'
      }

      const result = buildSafeEnv(processEnv, 'linux')

      expect(result['PATH']).toBe('/usr/bin')
      expect(result['HOME']).toBe('/home/user')
      expect(result['SHELL']).toBe('/bin/bash')
      expect(result['SECRET_API_KEY']).toBeUndefined()
      expect(result['AWS_ACCESS_KEY_ID']).toBeUndefined()
      expect(result['DATABASE_URL']).toBeUndefined()
    })

    it('should only include whitelisted env vars on Windows', () => {
      const processEnv: Record<string, string | undefined> = {
        PATH: 'C:\\Windows\\system32',
        COMSPEC: 'C:\\Windows\\system32\\cmd.exe',
        USERPROFILE: 'C:\\Users\\test',
        GITHUB_TOKEN: 'ghp_...',
        NPM_TOKEN: 'npm_...',
        SYSTEMROOT: 'C:\\Windows'
      }

      const result = buildSafeEnv(processEnv, 'win32')

      expect(result['PATH']).toBe('C:\\Windows\\system32')
      expect(result['COMSPEC']).toBe('C:\\Windows\\system32\\cmd.exe')
      expect(result['USERPROFILE']).toBe('C:\\Users\\test')
      expect(result['SYSTEMROOT']).toBe('C:\\Windows')
      expect(result['GITHUB_TOKEN']).toBeUndefined()
      expect(result['NPM_TOKEN']).toBeUndefined()
    })

    it('should skip undefined env vars', () => {
      const processEnv: Record<string, string | undefined> = {
        PATH: '/usr/bin',
        HOME: undefined
      }

      const result = buildSafeEnv(processEnv, 'linux')

      expect(result['PATH']).toBe('/usr/bin')
      expect('HOME' in result).toBe(false)
    })
  })

  describe('terminal type settings', () => {
    it('should always set TERM and COLORTERM', () => {
      const result = buildSafeEnv({}, 'linux')

      expect(result['TERM']).toBe('xterm-256color')
      expect(result['COLORTERM']).toBe('truecolor')
    })

    it('should override TERM even if set in process env', () => {
      const processEnv: Record<string, string | undefined> = {
        TERM: 'dumb'
      }

      // TERM is not in whitelist so won't be picked up from process.env
      // It gets set by the function itself
      const result = buildSafeEnv(processEnv, 'linux')
      expect(result['TERM']).toBe('xterm-256color')
    })
  })

  describe('user env overrides', () => {
    it('should apply user-provided env vars', () => {
      const result = buildSafeEnv({}, 'linux', {
        CUSTOM_VAR: 'custom-value',
        MY_CONFIG: '/path/to/config'
      })

      expect(result['CUSTOM_VAR']).toBe('custom-value')
      expect(result['MY_CONFIG']).toBe('/path/to/config')
    })

    it('should allow user env to override whitelisted vars', () => {
      const processEnv: Record<string, string | undefined> = {
        PATH: '/usr/bin'
      }

      const result = buildSafeEnv(processEnv, 'linux', {
        PATH: '/custom/path:/usr/bin'
      })

      expect(result['PATH']).toBe('/custom/path:/usr/bin')
    })
  })

  describe('sensitive variable exclusion', () => {
    const sensitiveVars = [
      'SECRET_KEY', 'API_KEY', 'API_SECRET',
      'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY',
      'GITHUB_TOKEN', 'NPM_TOKEN', 'DOCKER_TOKEN',
      'DATABASE_URL', 'REDIS_URL', 'MONGODB_URI',
      'PRIVATE_KEY', 'JWT_SECRET',
      'STRIPE_SECRET_KEY', 'SENDGRID_API_KEY',
      'PASSWORD', 'PASSWD'
    ]

    it.each(sensitiveVars)('should NOT pass %s to PTY', (varName) => {
      const processEnv: Record<string, string | undefined> = {
        [varName]: 'sensitive-value'
      }

      const resultLinux = buildSafeEnv(processEnv, 'linux')
      const resultWin = buildSafeEnv(processEnv, 'win32')

      expect(resultLinux[varName]).toBeUndefined()
      expect(resultWin[varName]).toBeUndefined()
    })
  })
})
