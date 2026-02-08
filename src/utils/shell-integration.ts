import { v4 as uuidv4 } from 'uuid'
import type { CommandBlock } from '../types'

/**
 * OSC 633 shell integration protocol parser (VS Code compatible).
 *
 * Sequence format: ESC ] 633 ; <command> [; <args>] ST
 * Where ST = ESC \ or BEL (\x07)
 *
 * Commands:
 *   A          → Prompt Start (Mark A)
 *   B          → Prompt End / Command Start (Mark B)
 *   C          → Command Executed (Mark C)
 *   D ; <code> → Command Finished with exit code (Mark D)
 *   E ; <cmd>  → Command Line text
 *   P ; Cwd=<path> → Current Working Directory
 */

export interface ShellIntegrationState {
  commands: CommandBlock[]
  currentCwd: string
  isCommandRunning: boolean
  pendingCommand: string
  promptStartLine: number
  commandStartLine: number
}

export function createInitialState(): ShellIntegrationState {
  return {
    commands: [],
    currentCwd: '',
    isCommandRunning: false,
    pendingCommand: '',
    promptStartLine: -1,
    commandStartLine: -1
  }
}

export type ShellIntegrationEvent =
  | { type: 'prompt-start'; line: number }
  | { type: 'prompt-end' }
  | { type: 'command-start'; line: number }
  | { type: 'command-finished'; exitCode: number; line: number }
  | { type: 'command-line'; command: string }
  | { type: 'cwd-changed'; cwd: string }

/**
 * Parse an OSC 633 payload string into an event.
 * The payload has already been extracted from the escape sequence.
 */
export function parseOsc633(data: string, currentLine: number): ShellIntegrationEvent | null {
  // data is everything after "633;"
  const semicolonIndex = data.indexOf(';')
  const command = semicolonIndex === -1 ? data.trim() : data.substring(0, semicolonIndex).trim()
  const args = semicolonIndex === -1 ? '' : data.substring(semicolonIndex + 1)

  switch (command) {
    case 'A':
      return { type: 'prompt-start', line: currentLine }

    case 'B':
      return { type: 'prompt-end' }

    case 'C':
      return { type: 'command-start', line: currentLine }

    case 'D': {
      const exitCode = parseInt(args.trim(), 10)
      return { type: 'command-finished', exitCode: isNaN(exitCode) ? 0 : exitCode, line: currentLine }
    }

    case 'E':
      return { type: 'command-line', command: decodeCommandLine(args) }

    case 'P': {
      const cwdMatch = args.match(/^Cwd=(.+)/)
      if (cwdMatch) {
        return { type: 'cwd-changed', cwd: cwdMatch[1] }
      }
      return null
    }

    default:
      return null
  }
}

/**
 * Process a shell integration event and return updated state.
 */
export function processEvent(
  state: ShellIntegrationState,
  event: ShellIntegrationEvent
): { state: ShellIntegrationState; completedBlock?: CommandBlock } {
  switch (event.type) {
    case 'prompt-start': {
      return {
        state: {
          ...state,
          promptStartLine: event.line,
          isCommandRunning: false
        }
      }
    }

    case 'prompt-end': {
      return { state }
    }

    case 'command-line': {
      return {
        state: {
          ...state,
          pendingCommand: event.command
        }
      }
    }

    case 'command-start': {
      return {
        state: {
          ...state,
          commandStartLine: event.line,
          isCommandRunning: true
        }
      }
    }

    case 'command-finished': {
      const block: CommandBlock = {
        id: uuidv4(),
        command: state.pendingCommand,
        cwd: state.currentCwd,
        startLine: state.commandStartLine,
        endLine: event.line,
        exitCode: event.exitCode,
        startTime: state.isCommandRunning ? Date.now() : 0,
        endTime: Date.now()
      }

      return {
        state: {
          ...state,
          commands: [...state.commands, block],
          isCommandRunning: false,
          pendingCommand: ''
        },
        completedBlock: block
      }
    }

    case 'cwd-changed': {
      return {
        state: {
          ...state,
          currentCwd: event.cwd
        }
      }
    }
  }
}

/**
 * Decode a command line that may have been escaped in the OSC sequence.
 */
function decodeCommandLine(raw: string): string {
  // The command line in E sequences may use \x3b for semicolons
  return raw.replace(/\\x3b/g, ';').trim()
}

/**
 * Format a duration in milliseconds into a human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}
