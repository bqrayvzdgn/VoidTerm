/**
 * SSH ve terminal girdileri icin validation fonksiyonlari
 */

/** Hostname validasyonu - IP veya domain */
export function isValidHostname(hostname: string): boolean {
  if (!hostname || hostname.length > 255) return false
  
  // IP adresi kontrolu
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Regex.test(hostname)) {
    const parts = hostname.split('.')
    return parts.every(part => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  }
  
  // Domain name kontrolu
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return domainRegex.test(hostname)
}

/** Username validasyonu */
export function isValidUsername(username: string): boolean {
  if (!username || username.length > 32) return false
  // Unix kullanici adi kurallari: harf, rakam, tire, alt cizgi
  const usernameRegex = /^[a-zA-Z_][a-zA-Z0-9_-]*$/
  return usernameRegex.test(username)
}

/** Port validasyonu */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535
}

/** Dosya yolu validasyonu (temel) */
export function isValidPath(filePath: string): boolean {
  if (!filePath) return false
  // Shell injection karakterlerini engelle
  const dangerousChars = /[;&|`$(){}[\]<>!]/
  return !dangerousChars.test(filePath)
}

/**
 * Detect if the current platform is Windows.
 * Works in both renderer (via electronAPI) and test environments.
 */
function isWindows(): boolean {
  try {
    if (typeof window !== 'undefined' && window.electronAPI?.platform) {
      return window.electronAPI.platform === 'win32'
    }
  } catch {
    // Fallback for test environment
  }
  // Fallback: check process.platform (available in Node/Electron/test contexts)
  if (typeof process !== 'undefined' && process.platform) {
    return process.platform === 'win32'
  }
  return false
}

/**
 * Escape a file path for safe use in shell arguments.
 * Uses single quotes on Unix (which prevent all expansion)
 * and double quotes on Windows.
 */
export function escapeShellPath(filePath: string): string {
  if (isWindows()) {
    // Windows: double-quote, escape inner double-quotes
    return `"${filePath.replace(/"/g, '""')}"`
  }
  // Unix: single-quote, escape inner single-quotes by ending the
  // quoted section, adding an escaped quote, and reopening.
  return `'${filePath.replace(/'/g, "'\\''")}'`
}

/** Jump host validasyonu (user@host formatinda) */
export function isValidJumpHost(jumpHost: string): boolean {
  if (!jumpHost) return true // opsiyonel alan
  
  const parts = jumpHost.split('@')
  if (parts.length !== 2) return false
  
  const [username, host] = parts
  return isValidUsername(username) && isValidHostname(host)
}

/** SSH baglanti bilgilerini sanitize et */
export function sanitizeSSHConnection(connection: {
  host: string
  username: string
  port: number
  privateKeyPath?: string
  jumpHost?: string
}): {
  isValid: boolean
  errors: string[]
  sanitized?: typeof connection
} {
  const errors: string[] = []
  
  if (!isValidHostname(connection.host)) {
    errors.push('Gecersiz host adresi')
  }
  
  if (!isValidUsername(connection.username)) {
    errors.push('Gecersiz kullanici adi')
  }
  
  if (!isValidPort(connection.port)) {
    errors.push('Gecersiz port numarasi (1-65535)')
  }
  
  if (connection.privateKeyPath && !isValidPath(connection.privateKeyPath)) {
    errors.push('Gecersiz private key yolu')
  }
  
  if (connection.jumpHost && !isValidJumpHost(connection.jumpHost)) {
    errors.push('Gecersiz jump host (user@host formatinda olmali)')
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors }
  }
  
  return {
    isValid: true,
    errors: [],
    sanitized: {
      host: connection.host.trim(),
      username: connection.username.trim(),
      port: connection.port,
      privateKeyPath: connection.privateKeyPath?.trim(),
      jumpHost: connection.jumpHost?.trim()
    }
  }
}

/** SSH komutunu guvenli sekilde olustur */
export function buildSSHCommand(connection: {
  host: string
  username: string
  port: number
  privateKeyPath?: string
  jumpHost?: string
}): string | null {
  const validation = sanitizeSSHConnection(connection)
  if (!validation.isValid || !validation.sanitized) {
    return null
  }
  
  const { host, username, port, privateKeyPath, jumpHost } = validation.sanitized
  
  let command = `ssh ${username}@${host}`
  
  if (port !== 22) {
    command += ` -p ${port}`
  }
  
  if (privateKeyPath) {
    // Escape path safely for shell use
    command += ` -i ${escapeShellPath(privateKeyPath)}`
  }
  
  if (jumpHost) {
    command += ` -J ${jumpHost}`
  }
  
  return command
}
