import { useCallback, useMemo } from 'react'
import { useTerminalStore } from '../store/terminalStore'
import type { CommandBlock } from '../types'
import { terminalRegistry } from '../utils/terminalRegistry'

/**
 * Hook for managing command blocks within a terminal.
 * Provides navigation and data access for command block decorations.
 */
export function useCommandBlocks(terminalId: string | null) {
  const commandBlocks = useTerminalStore((state) =>
    terminalId ? state.commandBlocks.get(terminalId) || [] : []
  )

  const scrollToCommand = useCallback((blockId: string) => {
    if (!terminalId) return
    const block = commandBlocks.find((b: CommandBlock) => b.id === blockId)
    if (!block) return

    const terminal = terminalRegistry.get(terminalId)
    if (!terminal) return

    terminal.scrollToLine(block.startLine)
  }, [terminalId, commandBlocks])

  const navigateCommand = useCallback((direction: 'prev' | 'next') => {
    if (!terminalId || commandBlocks.length === 0) return

    const terminal = terminalRegistry.get(terminalId)
    if (!terminal) return

    const viewportTopLine = terminal.buffer.active.viewportY

    if (direction === 'prev') {
      // Find the last command block that starts before the current viewport
      for (let i = commandBlocks.length - 1; i >= 0; i--) {
        if (commandBlocks[i].startLine < viewportTopLine) {
          terminal.scrollToLine(commandBlocks[i].startLine)
          return
        }
      }
      // If no previous, scroll to the first
      if (commandBlocks.length > 0) {
        terminal.scrollToLine(commandBlocks[0].startLine)
      }
    } else {
      // Find the first command block that starts after the current viewport
      for (const block of commandBlocks) {
        if (block.startLine > viewportTopLine) {
          terminal.scrollToLine(block.startLine)
          return
        }
      }
    }
  }, [terminalId, commandBlocks])

  const currentCommand = useMemo((): CommandBlock | null => {
    if (!terminalId || commandBlocks.length === 0) return null

    const terminal = terminalRegistry.get(terminalId)
    if (!terminal) return null

    const viewportTopLine = terminal.buffer.active.viewportY

    // Find the command block whose output is visible in the viewport
    for (let i = commandBlocks.length - 1; i >= 0; i--) {
      if (commandBlocks[i].startLine <= viewportTopLine) {
        return commandBlocks[i]
      }
    }
    return null
  }, [terminalId, commandBlocks])

  return {
    commandBlocks,
    scrollToCommand,
    navigateCommand,
    currentCommand
  }
}
