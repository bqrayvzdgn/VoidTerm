import * as pty from 'node-pty'
import { v4 as uuidv4 } from 'uuid'
import os from 'os'
import { createLogger } from './logger'

const logger = createLogger('PtyManager')

/**
 * Whitelisted environment variable names that are safe to pass to PTY processes.
 * This prevents leaking sensitive env vars (API keys, tokens, secrets) to child processes.
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

/**
 * Build a safe environment for PTY processes using a whitelist approach.
 * Only known-safe environment variables are passed through.
 */
export function buildSafeEnv(userEnv?: Record<string, string>): Record<string, string> {
  const whitelist = process.platform === 'win32' ? ENV_WHITELIST_WIN32 : ENV_WHITELIST_UNIX
  const safeEnv: Record<string, string> = {}

  for (const key of whitelist) {
    const value = process.env[key]
    if (value !== undefined) {
      safeEnv[key] = value
    }
  }

  // Apply user-provided overrides (from profile settings)
  if (userEnv) {
    Object.assign(safeEnv, userEnv)
  }

  // Always set terminal type
  safeEnv['TERM'] = 'xterm-256color'
  safeEnv['COLORTERM'] = 'truecolor'

  return safeEnv
}

interface PtyProcess {
  pty: pty.IPty
  id: string
}

export interface PtyCreateOptions {
  shell?: string
  cwd?: string
  env?: Record<string, string>
}

type DataCallback = (id: string, data: string) => void
type ExitCallback = (id: string, exitCode: number) => void

export class PtyManager {
  private processes: Map<string, PtyProcess> = new Map()
  private dataCallbacks: DataCallback[] = []
  private exitCallbacks: ExitCallback[] = []

  getDefaultShell(): string {
    if (process.platform === 'win32') {
      return process.env.COMSPEC || 'powershell.exe'
    }
    return process.env.SHELL || '/bin/bash'
  }

  private getShellArgs(shell: string): string[] {
    if (process.platform !== 'win32') return ['--login']
    const name = shell.toLowerCase()
    if (name.includes('powershell') || name.includes('pwsh')) {
      return ['-NoLogo']
    }
    return []
  }

  /**
   * Check if this shell is legacy Windows PowerShell (which defaults to blue background).
   */
  private isLegacyPowerShell(shell: string): boolean {
    const name = shell.toLowerCase()
    return process.platform === 'win32' && name.includes('powershell') && !name.includes('pwsh')
  }

  create(options: PtyCreateOptions = {}): string {
    const id = uuidv4()
    const shell = options.shell || this.getDefaultShell()
    const cwd = options.cwd || os.homedir()

    const env = buildSafeEnv(options.env)

    const shellArgs = this.getShellArgs(shell)

    const ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env
    })

    // Legacy Windows PowerShell defaults to a blue (#012456) background.
    // Send a command to reset console colors so the xterm.js theme shows through.
    if (this.isLegacyPowerShell(shell)) {
      ptyProcess.write('[Console]::ResetColor(); Clear-Host\r')
    }

    ptyProcess.onData((data) => {
      this.dataCallbacks.forEach(cb => cb(id, data))
    })

    ptyProcess.onExit(({ exitCode }) => {
      this.exitCallbacks.forEach(cb => cb(id, exitCode))
      this.processes.delete(id)
    })

    this.processes.set(id, { pty: ptyProcess, id })
    return id
  }

  write(id: string, data: string): void {
    const process = this.processes.get(id)
    if (process) {
      process.pty.write(data)
    }
  }

  resize(id: string, cols: number, rows: number): void {
    const process = this.processes.get(id)
    if (process) {
      process.pty.resize(cols, rows)
    }
  }

  kill(id: string): void {
    const process = this.processes.get(id)
    if (process) {
      try {
        process.pty.kill()
      } catch {
        // Process may already be dead (AttachConsole can fail on Windows)
      }
      this.processes.delete(id)
    }
  }

  killAll(): void {
    this.processes.forEach((process) => {
      try {
        process.pty.kill()
      } catch {
        // Process may already be dead
      }
    })
    this.processes.clear()
  }

  /**
   * Get list of all active PTY IDs
   */
  getActiveIds(): string[] {
    return Array.from(this.processes.keys())
  }

  /**
   * Check if a PTY process exists and is tracked
   */
  isAlive(id: string): boolean {
    return this.processes.has(id)
  }

  /**
   * Get the count of active PTY processes
   */
  getCount(): number {
    return this.processes.size
  }

  /**
   * Cleanup orphaned PTY processes that are no longer needed
   * Called when renderer crashes or is destroyed
   */
  cleanupOrphaned(): void {
    const count = this.processes.size
    if (count > 0) {
      logger.info(`Cleaning up ${count} orphaned PTY processes`)
      this.killAll()
    }
  }

  onData(callback: DataCallback): void {
    this.dataCallbacks.push(callback)
  }

  onExit(callback: ExitCallback): void {
    this.exitCallbacks.push(callback)
  }
}
