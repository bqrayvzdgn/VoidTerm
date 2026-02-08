import type { ILinkProvider, ILink, Terminal, IBufferRange } from '@xterm/xterm'

/**
 * Custom link provider that detects file:line:col patterns in terminal output
 * and makes them clickable to open in an external editor.
 *
 * Patterns matched:
 *   file.ts:42:5
 *   file.py:42
 *   ./path/to/file:10
 *   /absolute/path/file.rs:25:1
 *   C:\path\file.ts:10:5  (Windows)
 */

// Match file paths with line (and optional column) numbers
// Captures: (filepath)(line)(col?)
const FILE_LINK_PATTERN = /(?:^|[\s'"([\]])([.\w\-/\\]+(?::[/\\])?[\w\-./\\]*\.\w+):(\d+)(?::(\d+))?/g

export class FileLinkProvider implements ILinkProvider {
  private onClickCallback: (file: string, line: number, col: number) => void
  private terminal: Terminal | null = null

  constructor(onClick: (file: string, line: number, col: number) => void) {
    this.onClickCallback = onClick
  }

  setTerminal(terminal: Terminal): void {
    this.terminal = terminal
  }

  provideLinks(y: number, callback: (links: ILink[] | undefined) => void): void {
    if (!this.terminal) {
      callback(undefined)
      return
    }

    const line = this.terminal.buffer.active.getLine(y - 1)
    if (!line) {
      callback(undefined)
      return
    }

    const text = line.translateToString(true)
    const links: ILink[] = []

    FILE_LINK_PATTERN.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = FILE_LINK_PATTERN.exec(text)) !== null) {
      const filePath = match[1]
      const lineNum = parseInt(match[2], 10)
      const colNum = match[3] ? parseInt(match[3], 10) : 1

      // Skip obvious non-file patterns (pure numbers, very short names)
      if (!filePath || filePath.length < 2) continue
      if (!/\.\w+$/.test(filePath)) continue

      const fullMatch = `${filePath}:${match[2]}${match[3] ? ':' + match[3] : ''}`
      const startIndex = text.indexOf(fullMatch, match.index)
      if (startIndex === -1) continue

      const range: IBufferRange = {
        start: { x: startIndex + 1, y },
        end: { x: startIndex + fullMatch.length + 1, y }
      }

      links.push({
        range,
        text: fullMatch,
        activate: () => {
          this.onClickCallback(filePath, lineNum, colNum)
        }
      })
    }

    callback(links.length > 0 ? links : undefined)
  }
}
