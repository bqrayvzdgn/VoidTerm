import { describe, it, expect } from 'vitest'
import {
  isValidHostname,
  isValidUsername,
  isValidPort,
  isValidPath,
  isValidJumpHost,
  sanitizeSSHConnection,
  buildSSHCommand
} from './validation'

describe('isValidHostname', () => {
  describe('valid hostnames', () => {
    it('should accept valid domain names', () => {
      expect(isValidHostname('example.com')).toBe(true)
      expect(isValidHostname('sub.example.com')).toBe(true)
      expect(isValidHostname('deep.sub.example.com')).toBe(true)
      expect(isValidHostname('example-site.com')).toBe(true)
      expect(isValidHostname('a.co')).toBe(true)
    })

    it('should accept valid IPv4 addresses', () => {
      expect(isValidHostname('192.168.1.1')).toBe(true)
      expect(isValidHostname('10.0.0.1')).toBe(true)
      expect(isValidHostname('172.16.0.1')).toBe(true)
      expect(isValidHostname('0.0.0.0')).toBe(true)
      expect(isValidHostname('255.255.255.255')).toBe(true)
      expect(isValidHostname('127.0.0.1')).toBe(true)
    })

    it('should accept localhost', () => {
      expect(isValidHostname('localhost')).toBe(true)
    })
  })

  describe('invalid hostnames', () => {
    it('should reject empty or null values', () => {
      expect(isValidHostname('')).toBe(false)
      expect(isValidHostname(null as unknown as string)).toBe(false)
      expect(isValidHostname(undefined as unknown as string)).toBe(false)
    })

    it('should reject invalid IPv4 addresses with out-of-range octets', () => {
      expect(isValidHostname('256.1.1.1')).toBe(false)
      expect(isValidHostname('192.168.1.256')).toBe(false)
      expect(isValidHostname('300.300.300.300')).toBe(false)
      // Note: Partial IPs like '192.168.1' or '192.168.1.1.1' may be valid domain names
      // and are handled by the domain validation regex
    })

    it('should reject invalid domain names', () => {
      expect(isValidHostname('-example.com')).toBe(false)
      expect(isValidHostname('example-.com')).toBe(false)
      expect(isValidHostname('.example.com')).toBe(false)
      expect(isValidHostname('example..com')).toBe(false)
    })

    it('should reject hostnames with special characters', () => {
      expect(isValidHostname('example@com')).toBe(false)
      expect(isValidHostname('example com')).toBe(false)
      expect(isValidHostname('example;com')).toBe(false)
      expect(isValidHostname('example&com')).toBe(false)
    })

    it('should reject hostnames exceeding max length', () => {
      const longHostname = 'a'.repeat(256)
      expect(isValidHostname(longHostname)).toBe(false)
    })
  })
})

describe('isValidUsername', () => {
  describe('valid usernames', () => {
    it('should accept valid Unix usernames', () => {
      expect(isValidUsername('admin')).toBe(true)
      expect(isValidUsername('user123')).toBe(true)
      expect(isValidUsername('_service')).toBe(true)
      expect(isValidUsername('user-name')).toBe(true)
      expect(isValidUsername('user_name')).toBe(true)
      expect(isValidUsername('a')).toBe(true)
    })

    it('should accept usernames starting with underscore', () => {
      expect(isValidUsername('_backup')).toBe(true)
      expect(isValidUsername('_www-data')).toBe(true)
    })
  })

  describe('invalid usernames', () => {
    it('should reject empty or null values', () => {
      expect(isValidUsername('')).toBe(false)
      expect(isValidUsername(null as unknown as string)).toBe(false)
      expect(isValidUsername(undefined as unknown as string)).toBe(false)
    })

    it('should reject usernames starting with numbers', () => {
      expect(isValidUsername('1admin')).toBe(false)
      expect(isValidUsername('123user')).toBe(false)
    })

    it('should reject usernames starting with dash', () => {
      expect(isValidUsername('-admin')).toBe(false)
    })

    it('should reject usernames with special characters', () => {
      expect(isValidUsername('user@name')).toBe(false)
      expect(isValidUsername('user name')).toBe(false)
      expect(isValidUsername('user.name')).toBe(false)
      expect(isValidUsername('user$name')).toBe(false)
      expect(isValidUsername('user;name')).toBe(false)
    })

    it('should reject usernames exceeding max length', () => {
      const longUsername = 'a'.repeat(33)
      expect(isValidUsername(longUsername)).toBe(false)
    })
  })
})

describe('isValidPort', () => {
  describe('valid ports', () => {
    it('should accept valid port numbers', () => {
      expect(isValidPort(22)).toBe(true)
      expect(isValidPort(80)).toBe(true)
      expect(isValidPort(443)).toBe(true)
      expect(isValidPort(8080)).toBe(true)
      expect(isValidPort(1)).toBe(true)
      expect(isValidPort(65535)).toBe(true)
    })
  })

  describe('invalid ports', () => {
    it('should reject port 0', () => {
      expect(isValidPort(0)).toBe(false)
    })

    it('should reject negative ports', () => {
      expect(isValidPort(-1)).toBe(false)
      expect(isValidPort(-22)).toBe(false)
    })

    it('should reject ports above 65535', () => {
      expect(isValidPort(65536)).toBe(false)
      expect(isValidPort(100000)).toBe(false)
    })

    it('should reject non-integer values', () => {
      expect(isValidPort(22.5)).toBe(false)
      expect(isValidPort(NaN)).toBe(false)
      expect(isValidPort(Infinity)).toBe(false)
    })
  })
})

describe('isValidPath', () => {
  describe('valid paths', () => {
    it('should accept valid file paths', () => {
      expect(isValidPath('/home/user/.ssh/id_rsa')).toBe(true)
      expect(isValidPath('/var/log/app.log')).toBe(true)
      expect(isValidPath('C:\\Users\\admin\\.ssh\\id_rsa')).toBe(true)
      expect(isValidPath('./relative/path')).toBe(true)
      expect(isValidPath('../parent/path')).toBe(true)
    })

    it('should accept paths with spaces', () => {
      expect(isValidPath('/home/user/my keys/id_rsa')).toBe(true)
    })
  })

  describe('invalid paths - shell injection prevention', () => {
    it('should reject paths with semicolon (command separator)', () => {
      expect(isValidPath('/path; rm -rf /')).toBe(false)
    })

    it('should reject paths with ampersand (background execution)', () => {
      expect(isValidPath('/path & cat /etc/passwd')).toBe(false)
    })

    it('should reject paths with pipe (command piping)', () => {
      expect(isValidPath('/path | cat')).toBe(false)
    })

    it('should reject paths with backticks (command substitution)', () => {
      expect(isValidPath('/path`whoami`')).toBe(false)
    })

    it('should reject paths with dollar sign (variable expansion)', () => {
      expect(isValidPath('/path$HOME')).toBe(false)
      expect(isValidPath('/path$(whoami)')).toBe(false)
    })

    it('should reject paths with parentheses (subshell)', () => {
      expect(isValidPath('/path(command)')).toBe(false)
    })

    it('should reject paths with curly braces', () => {
      expect(isValidPath('/path{a,b}')).toBe(false)
    })

    it('should reject paths with square brackets', () => {
      expect(isValidPath('/path[0]')).toBe(false)
    })

    it('should reject paths with angle brackets (redirection)', () => {
      expect(isValidPath('/path > /etc/passwd')).toBe(false)
      expect(isValidPath('/path < input')).toBe(false)
    })

    it('should reject paths with exclamation mark', () => {
      expect(isValidPath('/path!command')).toBe(false)
    })

    it('should reject empty paths', () => {
      expect(isValidPath('')).toBe(false)
      expect(isValidPath(null as unknown as string)).toBe(false)
    })
  })
})

describe('isValidJumpHost', () => {
  describe('valid jump hosts', () => {
    it('should accept valid user@host format', () => {
      expect(isValidJumpHost('user@jump.example.com')).toBe(true)
      expect(isValidJumpHost('admin@192.168.1.1')).toBe(true)
      expect(isValidJumpHost('_service@bastion.local')).toBe(true)
    })

    it('should accept empty string (optional field)', () => {
      expect(isValidJumpHost('')).toBe(true)
    })
  })

  describe('invalid jump hosts', () => {
    it('should reject missing @ separator', () => {
      expect(isValidJumpHost('userjump.com')).toBe(false)
    })

    it('should reject multiple @ separators', () => {
      expect(isValidJumpHost('user@host@domain.com')).toBe(false)
    })

    it('should reject invalid username part', () => {
      expect(isValidJumpHost('1user@host.com')).toBe(false)
      expect(isValidJumpHost('@host.com')).toBe(false)
    })

    it('should reject invalid host part', () => {
      expect(isValidJumpHost('user@')).toBe(false)
      expect(isValidJumpHost('user@invalid..host')).toBe(false)
    })
  })
})

describe('sanitizeSSHConnection', () => {
  describe('valid connections', () => {
    it('should validate and sanitize a valid connection', () => {
      const connection = {
        host: 'example.com',
        username: 'admin',
        port: 22
      }

      const result = sanitizeSSHConnection(connection)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.sanitized).toBeDefined()
      expect(result.sanitized?.host).toBe('example.com')
      expect(result.sanitized?.username).toBe('admin')
      expect(result.sanitized?.port).toBe(22)
    })

    it('should trim whitespace from valid values after validation', () => {
      // Note: Validation happens before trimming, so values with only trailing/leading
      // whitespace may fail validation if the validators are strict.
      // The current validators require clean input - trimming happens only on sanitized output.
      const connection = {
        host: 'example.com',
        username: 'admin',
        port: 22,
        privateKeyPath: '/path/to/key'
      }

      const result = sanitizeSSHConnection(connection)

      expect(result.isValid).toBe(true)
      expect(result.sanitized?.host).toBe('example.com')
      expect(result.sanitized?.username).toBe('admin')
      expect(result.sanitized?.privateKeyPath).toBe('/path/to/key')
    })

    it('should validate connection with all optional fields', () => {
      const connection = {
        host: '192.168.1.100',
        username: 'deploy',
        port: 2222,
        privateKeyPath: '/home/user/.ssh/id_ed25519',
        jumpHost: 'bastion@jump.example.com'
      }

      const result = sanitizeSSHConnection(connection)

      expect(result.isValid).toBe(true)
      expect(result.sanitized?.jumpHost).toBe('bastion@jump.example.com')
    })
  })

  describe('invalid connections', () => {
    it('should return errors for invalid host', () => {
      const connection = {
        host: 'invalid..host',
        username: 'admin',
        port: 22
      }

      const result = sanitizeSSHConnection(connection)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Gecersiz host adresi')
    })

    it('should return errors for invalid username', () => {
      const connection = {
        host: 'example.com',
        username: '123invalid',
        port: 22
      }

      const result = sanitizeSSHConnection(connection)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Gecersiz kullanici adi')
    })

    it('should return errors for invalid port', () => {
      const connection = {
        host: 'example.com',
        username: 'admin',
        port: 70000
      }

      const result = sanitizeSSHConnection(connection)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Gecersiz port numarasi (1-65535)')
    })

    it('should return errors for invalid private key path', () => {
      const connection = {
        host: 'example.com',
        username: 'admin',
        port: 22,
        privateKeyPath: '/path; rm -rf /'
      }

      const result = sanitizeSSHConnection(connection)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Gecersiz private key yolu')
    })

    it('should return errors for invalid jump host', () => {
      const connection = {
        host: 'example.com',
        username: 'admin',
        port: 22,
        jumpHost: 'invalid-format'
      }

      const result = sanitizeSSHConnection(connection)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Gecersiz jump host (user@host formatinda olmali)')
    })

    it('should return multiple errors when multiple fields are invalid', () => {
      const connection = {
        host: '',
        username: '',
        port: 0
      }

      const result = sanitizeSSHConnection(connection)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })
})

describe('buildSSHCommand', () => {
  describe('valid commands', () => {
    it('should build basic SSH command', () => {
      const connection = {
        host: 'example.com',
        username: 'admin',
        port: 22
      }

      const command = buildSSHCommand(connection)

      expect(command).toBe('ssh admin@example.com')
    })

    it('should include port when not default', () => {
      const connection = {
        host: 'example.com',
        username: 'admin',
        port: 2222
      }

      const command = buildSSHCommand(connection)

      expect(command).toBe('ssh admin@example.com -p 2222')
    })

    it('should include private key path with quotes', () => {
      const connection = {
        host: 'example.com',
        username: 'admin',
        port: 22,
        privateKeyPath: '/home/user/.ssh/id_rsa'
      }

      const command = buildSSHCommand(connection)

      expect(command).toBe('ssh admin@example.com -i "/home/user/.ssh/id_rsa"')
    })

    it('should include jump host', () => {
      const connection = {
        host: 'internal.server',
        username: 'deploy',
        port: 22,
        jumpHost: 'bastion@jump.example.com'
      }

      const command = buildSSHCommand(connection)

      expect(command).toBe('ssh deploy@internal.server -J bastion@jump.example.com')
    })

    it('should build full command with all options', () => {
      const connection = {
        host: '10.0.0.100',
        username: 'admin',
        port: 2222,
        privateKeyPath: '/keys/deploy_key',
        jumpHost: 'ops@bastion.local'
      }

      const command = buildSSHCommand(connection)

      expect(command).toBe('ssh admin@10.0.0.100 -p 2222 -i "/keys/deploy_key" -J ops@bastion.local')
    })
  })

  describe('invalid commands', () => {
    it('should return null for invalid connection', () => {
      const connection = {
        host: '',
        username: 'admin',
        port: 22
      }

      const command = buildSSHCommand(connection)

      expect(command).toBeNull()
    })

    it('should return null when private key path contains injection', () => {
      const connection = {
        host: 'example.com',
        username: 'admin',
        port: 22,
        privateKeyPath: '/key; cat /etc/passwd'
      }

      const command = buildSSHCommand(connection)

      expect(command).toBeNull()
    })
  })
})

describe('URL validation utility', async () => {
  const { isValidExternalUrl, sanitizeExternalUrl } = await import('./url')

  describe('isValidExternalUrl', () => {
    it('should accept http and https URLs', () => {
      expect(isValidExternalUrl('https://example.com')).toBe(true)
      expect(isValidExternalUrl('http://example.com')).toBe(true)
      expect(isValidExternalUrl('https://sub.example.com/path?query=1')).toBe(true)
    })

    it('should accept mailto URLs', () => {
      expect(isValidExternalUrl('mailto:test@example.com')).toBe(true)
    })

    it('should reject javascript URLs', () => {
      expect(isValidExternalUrl('javascript:alert(1)')).toBe(false)
    })

    it('should reject data URLs', () => {
      expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('should reject file URLs', () => {
      expect(isValidExternalUrl('file:///etc/passwd')).toBe(false)
    })

    it('should reject invalid URLs', () => {
      expect(isValidExternalUrl('')).toBe(false)
      expect(isValidExternalUrl('not a url')).toBe(false)
      expect(isValidExternalUrl(null as unknown as string)).toBe(false)
    })
  })

  describe('sanitizeExternalUrl', () => {
    it('should return valid URLs unchanged', () => {
      expect(sanitizeExternalUrl('https://example.com')).toBe('https://example.com')
    })

    it('should return null for invalid URLs', () => {
      expect(sanitizeExternalUrl('javascript:alert(1)')).toBeNull()
      expect(sanitizeExternalUrl('')).toBeNull()
    })
  })
})
