import type { Terminal } from '@xterm/xterm'

export type ViModeType = 'NORMAL' | 'VISUAL' | 'VISUAL_LINE' | 'SEARCH'

export interface ViModeState {
  mode: ViModeType
  cursorX: number
  cursorY: number
  anchorX: number
  anchorY: number
  searchQuery: string
  active: boolean
}

export function createInitialViState(): ViModeState {
  return {
    mode: 'NORMAL',
    cursorX: 0,
    cursorY: 0,
    anchorX: 0,
    anchorY: 0,
    searchQuery: '',
    active: false
  }
}

/**
 * Get the total number of lines in the terminal buffer.
 */
function getBufferLength(terminal: Terminal): number {
  return terminal.buffer.active.length
}

/**
 * Get text content of a line from the buffer.
 */
function getLineText(terminal: Terminal, y: number): string {
  const line = terminal.buffer.active.getLine(y)
  return line ? line.translateToString(true) : ''
}

/**
 * Process a vi mode key event and return the new state.
 */
export function processViKey(
  state: ViModeState,
  key: string,
  terminal: Terminal
): { state: ViModeState; action?: 'yank' | 'exit' | 'search-start' } {
  if (!state.active) return { state }

  const bufferLen = getBufferLength(terminal)
  const lineText = getLineText(terminal, state.cursorY)
  const lineLen = lineText.length

  // Handle ESC / q in all modes
  if (key === 'Escape' || (state.mode === 'NORMAL' && key === 'q')) {
    return { state: { ...createInitialViState() }, action: 'exit' }
  }

  if (state.mode === 'NORMAL' || state.mode === 'VISUAL' || state.mode === 'VISUAL_LINE') {
    const newState = { ...state }

    switch (key) {
      // Movement
      case 'h':
        newState.cursorX = Math.max(0, state.cursorX - 1)
        break
      case 'l':
        newState.cursorX = Math.min(lineLen - 1, state.cursorX + 1)
        break
      case 'j':
        newState.cursorY = Math.min(bufferLen - 1, state.cursorY + 1)
        newState.cursorX = Math.min(getLineText(terminal, newState.cursorY).length - 1, newState.cursorX)
        break
      case 'k':
        newState.cursorY = Math.max(0, state.cursorY - 1)
        newState.cursorX = Math.min(getLineText(terminal, newState.cursorY).length - 1, newState.cursorX)
        break

      // Word movement
      case 'w': {
        const rest = lineText.substring(state.cursorX)
        const match = rest.match(/^\S*\s+/)
        if (match) {
          newState.cursorX = Math.min(lineLen - 1, state.cursorX + match[0].length)
        } else if (state.cursorY < bufferLen - 1) {
          newState.cursorY = state.cursorY + 1
          newState.cursorX = 0
        }
        break
      }
      case 'b': {
        if (state.cursorX === 0 && state.cursorY > 0) {
          newState.cursorY = state.cursorY - 1
          const prevLine = getLineText(terminal, newState.cursorY)
          newState.cursorX = Math.max(0, prevLine.length - 1)
        } else {
          const before = lineText.substring(0, state.cursorX)
          const match = before.match(/\s+\S*$/)
          if (match) {
            newState.cursorX = state.cursorX - match[0].length
          } else {
            newState.cursorX = 0
          }
        }
        break
      }

      // Line start/end
      case '0':
        newState.cursorX = 0
        break
      case '$':
        newState.cursorX = Math.max(0, lineLen - 1)
        break

      // Buffer top/bottom
      case 'g':
        // gg handled via key combo detection outside
        newState.cursorY = 0
        newState.cursorX = 0
        break
      case 'G':
        newState.cursorY = bufferLen - 1
        newState.cursorX = 0
        break

      // Half-page scroll
      case 'u': // Ctrl+U handled externally
        newState.cursorY = Math.max(0, state.cursorY - Math.floor(terminal.rows / 2))
        break
      case 'd': // Ctrl+D handled externally
        newState.cursorY = Math.min(bufferLen - 1, state.cursorY + Math.floor(terminal.rows / 2))
        break

      // Mode switches
      case 'v':
        if (state.mode === 'VISUAL') {
          newState.mode = 'NORMAL'
        } else {
          newState.mode = 'VISUAL'
          newState.anchorX = state.cursorX
          newState.anchorY = state.cursorY
        }
        break
      case 'V':
        if (state.mode === 'VISUAL_LINE') {
          newState.mode = 'NORMAL'
        } else {
          newState.mode = 'VISUAL_LINE'
          newState.anchorX = 0
          newState.anchorY = state.cursorY
        }
        break

      // Yank
      case 'y':
        if (state.mode === 'VISUAL' || state.mode === 'VISUAL_LINE') {
          return { state: { ...newState, mode: 'NORMAL' }, action: 'yank' }
        }
        break

      // Search
      case '/':
        return { state: { ...newState, mode: 'SEARCH', searchQuery: '' }, action: 'search-start' }

      default:
        break
    }

    // Ensure cursor stays within bounds
    newState.cursorX = Math.max(0, newState.cursorX)
    newState.cursorY = Math.max(0, Math.min(bufferLen - 1, newState.cursorY))

    return { state: newState }
  }

  return { state }
}

/**
 * Get the selected text in visual mode.
 */
export function getVisualSelection(state: ViModeState, terminal: Terminal): string {
  if (state.mode === 'VISUAL_LINE') {
    const startY = Math.min(state.anchorY, state.cursorY)
    const endY = Math.max(state.anchorY, state.cursorY)
    const lines: string[] = []
    for (let y = startY; y <= endY; y++) {
      lines.push(getLineText(terminal, y))
    }
    return lines.join('\n')
  }

  if (state.mode === 'VISUAL') {
    let startY = state.anchorY
    let startX = state.anchorX
    let endY = state.cursorY
    let endX = state.cursorX

    if (startY > endY || (startY === endY && startX > endX)) {
      [startY, startX, endY, endX] = [endY, endX, startY, startX]
    }

    if (startY === endY) {
      return getLineText(terminal, startY).substring(startX, endX + 1)
    }

    const lines: string[] = []
    lines.push(getLineText(terminal, startY).substring(startX))
    for (let y = startY + 1; y < endY; y++) {
      lines.push(getLineText(terminal, y))
    }
    lines.push(getLineText(terminal, endY).substring(0, endX + 1))
    return lines.join('\n')
  }

  return ''
}
