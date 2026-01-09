import { v4 as uuidv4 } from 'uuid'
import type { Pane } from '../types'

export function collectTerminalIds(pane: Pane): string[] {
  if (pane.type === 'terminal' && pane.terminalId) {
    return [pane.terminalId]
  }
  if (pane.children) {
    return pane.children.flatMap(collectTerminalIds)
  }
  return []
}

export function splitPaneAtTerminal(
  pane: Pane,
  targetTerminalId: string,
  direction: 'horizontal' | 'vertical',
  newTerminalId: string
): Pane | null {
  if (pane.type === 'terminal' && pane.terminalId === targetTerminalId) {
    return {
      id: uuidv4(),
      type: 'split',
      direction,
      ratio: 0.5,
      children: [
        { ...pane },
        {
          id: uuidv4(),
          type: 'terminal',
          terminalId: newTerminalId
        }
      ]
    }
  }

  if (pane.children) {
    const newChildren = pane.children.map(child => {
      const result = splitPaneAtTerminal(child, targetTerminalId, direction, newTerminalId)
      return result || child
    })

    const wasModified = newChildren.some((child, i) => child !== pane.children![i])
    if (wasModified) {
      return { ...pane, children: newChildren }
    }
  }

  return null
}
