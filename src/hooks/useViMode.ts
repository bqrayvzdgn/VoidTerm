import { useState, useCallback, useRef, useEffect } from 'react'
import type { Terminal } from '@xterm/xterm'
import {
  type ViModeState,
  createInitialViState,
  processViKey,
  getVisualSelection
} from '../utils/vi-mode'
import { terminalLogger } from '../utils/logger'

/**
 * Hook to manage vi mode (copy mode) for a terminal.
 * When active, intercepts all keyboard input and provides
 * vim-like navigation and selection.
 */
export function useViMode(terminal: Terminal | null) {
  const [viState, setViState] = useState<ViModeState>(createInitialViState())
  const terminalRef = useRef<Terminal | null>(null)
  terminalRef.current = terminal

  const activate = useCallback(() => {
    if (!terminalRef.current) return
    const buffer = terminalRef.current.buffer.active
    setViState({
      ...createInitialViState(),
      active: true,
      cursorY: buffer.viewportY + Math.floor(terminalRef.current.rows / 2),
      cursorX: 0
    })
  }, [])

  const deactivate = useCallback(() => {
    setViState(createInitialViState())
    if (terminalRef.current) {
      terminalRef.current.clearSelection()
    }
  }, [])

  const toggle = useCallback(() => {
    if (viState.active) {
      deactivate()
    } else {
      activate()
    }
  }, [viState.active, activate, deactivate])

  const handleKeyEvent = useCallback((e: KeyboardEvent): boolean => {
    if (!viState.active || !terminalRef.current) return true

    // Prevent default for all keys in vi mode
    e.preventDefault()
    e.stopPropagation()

    let key = e.key

    // Map Ctrl+key combos
    if (e.ctrlKey) {
      if (key === 'u') key = 'u'
      else if (key === 'd') key = 'd'
      else return false
    }

    const { state: newState, action } = processViKey(viState, key, terminalRef.current)

    if (action === 'exit') {
      deactivate()
      return false
    }

    if (action === 'yank') {
      const text = getVisualSelection(viState, terminalRef.current)
      if (text) {
        navigator.clipboard.writeText(text).catch((error) => {
          terminalLogger.warn('Failed to copy vi selection:', error)
        })
      }
      setViState(newState)
      return false
    }

    setViState(newState)

    // Update terminal selection in visual mode
    if (terminalRef.current && (newState.mode === 'VISUAL' || newState.mode === 'VISUAL_LINE')) {
      const startY = Math.min(newState.anchorY, newState.cursorY)
      const startX = newState.mode === 'VISUAL_LINE' ? 0 : Math.min(newState.anchorX, newState.cursorX)
      const endY = Math.max(newState.anchorY, newState.cursorY)
      const endX = newState.mode === 'VISUAL_LINE'
        ? terminalRef.current.cols
        : Math.max(newState.anchorX, newState.cursorX) + 1

      terminalRef.current.select(startX, startY, (endY - startY) * terminalRef.current.cols + (endX - startX))
    } else if (terminalRef.current) {
      terminalRef.current.clearSelection()
    }

    // Scroll to make cursor visible
    if (terminalRef.current) {
      terminalRef.current.scrollToLine(Math.max(0, newState.cursorY - Math.floor(terminalRef.current.rows / 2)))
    }

    return false
  }, [viState, deactivate])

  // Attach/detach key handler
  useEffect(() => {
    if (!viState.active) return

    const handler = (e: KeyboardEvent) => {
      handleKeyEvent(e)
    }

    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [viState.active, handleKeyEvent])

  return {
    viState,
    isActive: viState.active,
    toggle,
    activate,
    deactivate
  }
}
