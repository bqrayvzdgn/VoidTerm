import * as pty from 'node-pty'
import { v4 as uuidv4 } from 'uuid'
import os from 'os'
import { createLogger } from './logger'

const logger = createLogger('PtyManager')

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

  create(options: PtyCreateOptions = {}): string {
    const id = uuidv4()
    const shell = options.shell || this.getDefaultShell()
    const cwd = options.cwd || os.homedir()

    const env = {
      ...process.env,
      ...options.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor'
    } as Record<string, string>

    const shellArgs = process.platform === 'win32' ? [] : ['--login']

    const ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env
    })

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
      process.pty.kill()
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
