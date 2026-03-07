import { describe, it, expect } from 'vitest'
import { isValidHostname, isValidUsername, isValidPort, isValidPath, isValidJumpHost } from '../validation'

describe('isValidHostname', () => {
  it('accepts valid IPv4 addresses', () => {
    expect(isValidHostname('192.168.1.1')).toBe(true)
    expect(isValidHostname('10.0.0.1')).toBe(true)
    expect(isValidHostname('127.0.0.1')).toBe(true)
    expect(isValidHostname('0.0.0.0')).toBe(true)
    expect(isValidHostname('255.255.255.255')).toBe(true)
  })

  it('accepts valid domain names', () => {
    expect(isValidHostname('example.com')).toBe(true)
    expect(isValidHostname('sub.example.com')).toBe(true)
    expect(isValidHostname('my-host')).toBe(true)
    expect(isValidHostname('a.b.c.d.example.com')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidHostname('')).toBe(false)
  })

  it('rejects hostnames longer than 255 chars', () => {
    expect(isValidHostname('a'.repeat(256))).toBe(false)
  })

  it('rejects invalid IP addresses', () => {
    expect(isValidHostname('999.999.999.999')).toBe(false)
    expect(isValidHostname('256.1.1.1')).toBe(false)
  })

  it('rejects hostnames with special characters', () => {
    expect(isValidHostname('host;rm -rf')).toBe(false)
    expect(isValidHostname('host name')).toBe(false)
    expect(isValidHostname('host@name')).toBe(false)
  })

  it('rejects domains starting or ending with hyphen', () => {
    expect(isValidHostname('-example.com')).toBe(false)
  })
})

describe('isValidUsername', () => {
  it('accepts valid usernames', () => {
    expect(isValidUsername('root')).toBe(true)
    expect(isValidUsername('user_name')).toBe(true)
    expect(isValidUsername('a-b')).toBe(true)
    expect(isValidUsername('_user')).toBe(true)
    expect(isValidUsername('admin123')).toBe(true)
  })

  it('rejects empty username', () => {
    expect(isValidUsername('')).toBe(false)
  })

  it('rejects usernames longer than 32 chars', () => {
    expect(isValidUsername('a'.repeat(33))).toBe(false)
  })

  it('rejects usernames starting with a number', () => {
    expect(isValidUsername('1user')).toBe(false)
  })

  it('rejects usernames with special characters', () => {
    expect(isValidUsername('user@name')).toBe(false)
    expect(isValidUsername('user#')).toBe(false)
    expect(isValidUsername('user$')).toBe(false)
    expect(isValidUsername('user name')).toBe(false)
  })
})

describe('isValidPort', () => {
  it('accepts valid ports', () => {
    expect(isValidPort(1)).toBe(true)
    expect(isValidPort(22)).toBe(true)
    expect(isValidPort(80)).toBe(true)
    expect(isValidPort(443)).toBe(true)
    expect(isValidPort(65535)).toBe(true)
  })

  it('rejects port 0', () => {
    expect(isValidPort(0)).toBe(false)
  })

  it('rejects negative ports', () => {
    expect(isValidPort(-1)).toBe(false)
  })

  it('rejects ports above 65535', () => {
    expect(isValidPort(65536)).toBe(false)
  })

  it('rejects non-integer ports', () => {
    expect(isValidPort(1.5)).toBe(false)
  })

  it('rejects NaN', () => {
    expect(isValidPort(NaN)).toBe(false)
  })
})

describe('isValidPath', () => {
  it('accepts valid Unix paths', () => {
    expect(isValidPath('/home/user')).toBe(true)
    expect(isValidPath('/var/log/syslog')).toBe(true)
  })

  it('accepts valid Windows paths', () => {
    expect(isValidPath('C:\\Users\\test')).toBe(true)
  })

  it('rejects empty path', () => {
    expect(isValidPath('')).toBe(false)
  })

  it('rejects paths with dangerous shell characters', () => {
    expect(isValidPath('/path;rm -rf /')).toBe(false)
    expect(isValidPath('/path|cat')).toBe(false)
    expect(isValidPath('/path`cmd`')).toBe(false)
    expect(isValidPath('/path$(cmd)')).toBe(false)
    expect(isValidPath('/path{a,b}')).toBe(false)
  })
})

describe('isValidJumpHost', () => {
  it('accepts valid user@host format', () => {
    expect(isValidJumpHost('user@host.com')).toBe(true)
    expect(isValidJumpHost('root@192.168.1.1')).toBe(true)
  })

  it('returns true for empty string (optional field)', () => {
    expect(isValidJumpHost('')).toBe(true)
  })

  it('rejects jump host without @', () => {
    expect(isValidJumpHost('hostname')).toBe(false)
  })

  it('rejects jump host with empty user', () => {
    expect(isValidJumpHost('@host.com')).toBe(false)
  })

  it('rejects jump host with invalid host', () => {
    expect(isValidJumpHost('user@')).toBe(false)
  })

  it('rejects jump host with multiple @', () => {
    expect(isValidJumpHost('user@host@other')).toBe(false)
  })
})
