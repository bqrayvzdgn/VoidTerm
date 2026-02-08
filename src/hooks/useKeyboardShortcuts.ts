import { useEffect, useRef } from 'react'

interface KeyboardShortcutHandlers {
  onNewTab: () => void
  onCloseTab: () => void
  onSplitVertical: () => void
  onSplitHorizontal: () => void
  onToggleSidebar: () => void
  onOpenSettings: () => void
  onNextTab?: () => void
  onPrevTab?: () => void
  onNavigatePane?: (direction: 'up' | 'down' | 'left' | 'right') => void
  onClosePane?: () => void
  onCommandPalette?: () => void
  onToggleBroadcast?: () => void
  onReopenClosedTab?: () => void
  onToggleMaximize?: () => void
  onPrevCommand?: () => void
  onNextCommand?: () => void
  onHintsMode?: () => void
  onViMode?: () => void
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const h = handlersRef.current
      const isCtrl = e.ctrlKey || e.metaKey

      if (isCtrl && e.shiftKey) {
        if (e.key === 'D' || e.key === 'd') {
          e.preventDefault()
          h.onSplitVertical()
        } else if (e.key === 'E' || e.key === 'e') {
          e.preventDefault()
          h.onSplitHorizontal()
        } else if (e.key === 'B' || e.key === 'b') {
          e.preventDefault()
          h.onToggleBroadcast?.()
        } else if (e.key === 'S' || e.key === 's') {
          e.preventDefault()
          h.onToggleSidebar()
        } else if (e.key === 'W' || e.key === 'w') {
          e.preventDefault()
          h.onClosePane?.()
        } else if (e.key === 'P' || e.key === 'p') {
          e.preventDefault()
          h.onCommandPalette?.()
        } else if (e.key === 'Tab') {
          e.preventDefault()
          h.onPrevTab?.()
        } else if (e.key === 'T' || e.key === 't') {
          e.preventDefault()
          h.onReopenClosedTab?.()
        } else if (e.key === 'M' || e.key === 'm') {
          e.preventDefault()
          h.onToggleMaximize?.()
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          h.onPrevCommand?.()
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          h.onNextCommand?.()
        } else if (e.key === 'H' || e.key === 'h') {
          e.preventDefault()
          h.onHintsMode?.()
        } else if (e.key === 'X' || e.key === 'x') {
          e.preventDefault()
          h.onViMode?.()
        }
      } else if (isCtrl) {
        if (e.key === 't') {
          e.preventDefault()
          h.onNewTab()
        } else if (e.key === 'w') {
          e.preventDefault()
          h.onCloseTab()
        } else if (e.key === ',') {
          e.preventDefault()
          h.onOpenSettings()
        } else if (e.key === 'Tab') {
          e.preventDefault()
          h.onNextTab?.()
        }
      } else if (e.altKey) {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          h.onNavigatePane?.('up')
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          h.onNavigatePane?.('down')
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          h.onNavigatePane?.('left')
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          h.onNavigatePane?.('right')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
