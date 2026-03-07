import * as pty from 'node-pty'
import { v4 as uuidv4 } from 'uuid'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { createLogger } from './logger'

const logger = createLogger('PtyManager')

/**
 * Whitelisted environment variable names that are safe to pass to PTY processes.
 * This prevents leaking sensitive env vars (API keys, tokens, secrets) to child processes.
 */
const ENV_WHITELIST_WIN32 = [
  'COMSPEC',
  'SYSTEMROOT',
  'SYSTEMDRIVE',
  'WINDIR',
  'PATH',
  'PATHEXT',
  'TEMP',
  'TMP',
  'HOMEDRIVE',
  'HOMEPATH',
  'USERPROFILE',
  'USERNAME',
  'APPDATA',
  'LOCALAPPDATA',
  'PROGRAMDATA',
  'PROGRAMFILES',
  'PROGRAMFILES(X86)',
  'COMMONPROGRAMFILES',
  'NUMBER_OF_PROCESSORS',
  'PROCESSOR_ARCHITECTURE',
  'OS',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'PSModulePath'
]

const ENV_WHITELIST_UNIX = [
  'PATH',
  'HOME',
  'USER',
  'LOGNAME',
  'SHELL',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'LC_MESSAGES',
  'LC_COLLATE',
  'DISPLAY',
  'WAYLAND_DISPLAY',
  'XDG_RUNTIME_DIR',
  'XDG_SESSION_TYPE',
  'XDG_DATA_HOME',
  'XDG_CONFIG_HOME',
  'XDG_CACHE_HOME',
  'TMPDIR',
  'EDITOR',
  'VISUAL',
  'PAGER',
  'SSH_AUTH_SOCK',
  'SSH_AGENT_PID',
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
  safeEnv['VOIDTERM'] = '1'

  return safeEnv
}

interface PtyProcess {
  pty: pty.IPty
  id: string
}

type DataCallback = (id: string, data: string) => void
type ExitCallback = (id: string, exitCode: number) => void

export interface PtyCreateOptions {
  shell?: string
  cwd?: string
  env?: Record<string, string>
  shellIntegration?: boolean
}

export class PtyManager {
  private processes: Map<string, PtyProcess> = new Map()
  private dataCallbacks: DataCallback[] = []
  private exitCallbacks: ExitCallback[] = []
  private shellIntegrationEnabled = true

  getDefaultShell(): string {
    if (process.platform === 'win32') {
      return process.env.COMSPEC || 'powershell.exe'
    }
    return process.env.SHELL || '/bin/bash'
  }

  private getShellArgs(
    shell: string,
    integrationScript?: { scriptPath: string; type: 'ps1' | 'fish' | 'sh' } | null
  ): string[] {
    const name = shell.toLowerCase()

    if (process.platform === 'win32') {
      if (name.includes('powershell') || name.includes('pwsh')) {
        if (integrationScript) {
          // Load integration via -Command so nothing is echoed to the terminal
          const escaped = integrationScript.scriptPath.replace(/\\/g, '\\\\')
          return ['-NoLogo', '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', `. "${escaped}"`]
        }
        return ['-NoLogo']
      }
      return []
    }

    // Unix shells
    if (integrationScript && integrationScript.type === 'sh') {
      if (name.includes('bash')) {
        // --rcfile sources the script instead of .bashrc, but our script can source .bashrc itself
        return ['--login', '-c', `. "${integrationScript.scriptPath}" 2>/dev/null; exec ${shell} --login`]
      }
    }

    return ['--login']
  }

  /**
   * Check if this shell is legacy Windows PowerShell (which defaults to blue background).
   */
  private isLegacyPowerShell(shell: string): boolean {
    const name = shell.toLowerCase()
    return process.platform === 'win32' && name.includes('powershell') && !name.includes('pwsh')
  }

  setShellIntegration(enabled: boolean): void {
    this.shellIntegrationEnabled = enabled
  }

  /**
   * Resolve the shell integration script path for a given shell.
   */
  private getShellIntegrationScriptPath(shell: string): { scriptPath: string; type: 'ps1' | 'fish' | 'sh' } | null {
    if (!this.shellIntegrationEnabled) return null

    const shellName = shell.toLowerCase()
    let scriptFile: string | null = null
    let type: 'ps1' | 'fish' | 'sh' = 'sh'

    if (shellName.includes('bash')) {
      scriptFile = 'bash.sh'
      type = 'sh'
    } else if (shellName.includes('zsh')) {
      scriptFile = 'zsh.sh'
      type = 'sh'
    } else if (shellName.includes('pwsh') || shellName.includes('powershell')) {
      scriptFile = 'powershell.ps1'
      type = 'ps1'
    } else if (shellName.includes('fish')) {
      scriptFile = 'fish.fish'
      type = 'fish'
    }

    if (!scriptFile) return null

    let scriptDir: string
    if (app.isPackaged) {
      scriptDir = path.join(process.resourcesPath, 'assets', 'shell-integration')
    } else {
      scriptDir = path.join(app.getAppPath(), 'assets', 'shell-integration')
    }

    const scriptPath = path.join(scriptDir, scriptFile)

    try {
      fs.accessSync(scriptPath, fs.constants.R_OK)
    } catch {
      logger.warn(`Shell integration script not found: ${scriptPath}`)
      return null
    }

    return { scriptPath, type }
  }

  create(options: PtyCreateOptions = {}): string {
    const id = uuidv4()
    const shell = options.shell || this.getDefaultShell()
    let cwd = options.cwd || os.homedir()

    // Validate cwd: must be an absolute path to an existing directory
    if (!path.isAbsolute(cwd)) {
      logger.warn(`Invalid cwd (not absolute): ${cwd}, falling back to homedir`)
      cwd = os.homedir()
    } else {
      try {
        const stat = fs.statSync(cwd)
        if (!stat.isDirectory()) {
          logger.warn(`Invalid cwd (not a directory): ${cwd}, falling back to homedir`)
          cwd = os.homedir()
        }
      } catch {
        logger.warn(`Invalid cwd (does not exist): ${cwd}, falling back to homedir`)
        cwd = os.homedir()
      }
    }

    const env = buildSafeEnv(options.env)

    // Mark shell integration environment variable
    if (this.shellIntegrationEnabled && options.shellIntegration !== false) {
      env['VOIDTERM_SHELL_INTEGRATION'] = '1'
    }

    // Resolve shell integration script (if enabled)
    const integration = options.shellIntegration !== false ? this.getShellIntegrationScriptPath(shell) : null

    const shellArgs = this.getShellArgs(shell, integration)

    const ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env
    })

    // Legacy Windows PowerShell defaults to a blue (#012456) background.
    // ResetColor is included in the -Command startup args when integration is active.
    if (this.isLegacyPowerShell(shell) && !integration) {
      ptyProcess.write('[Console]::ResetColor(); Clear-Host\r')
    }

    // For shells where args-based integration isn't supported, fall back to stdin write
    if (integration && integration.type === 'fish') {
      setTimeout(() => {
        try {
          ptyProcess.write(`source "${integration.scriptPath}"; clear\r`)
        } catch {
          // PTY may have already exited
        }
      }, 200)
    } else if (integration && integration.type === 'sh' && !shell.toLowerCase().includes('bash')) {
      // zsh and other sh-compatible shells: fall back to stdin
      setTimeout(() => {
        try {
          ptyProcess.write(`. "${integration.scriptPath}" && clear\r`)
        } catch {
          // PTY may have already exited
        }
      }, 200)
    }

    ptyProcess.onData((data) => {
      this.dataCallbacks.forEach((cb) => cb(id, data))
    })

    ptyProcess.onExit(({ exitCode }) => {
      this.exitCallbacks.forEach((cb) => cb(id, exitCode))
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
