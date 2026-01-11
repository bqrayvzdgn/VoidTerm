import { useEffect } from 'react'

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
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey

      if (isCtrl && e.shiftKey) {
        if (e.key === 'D' || e.key === 'd') {
          e.preventDefault()
          handlers.onSplitVertical()
        } else if (e.key === 'E' || e.key === 'e') {
          e.preventDefault()
          handlers.onSplitHorizontal()
        } else if (e.key === 'B' || e.key === 'b') {
          // Ctrl+Shift+B - Toggle broadcast mode
          e.preventDefault()
          handlers.onToggleBroadcast?.()
        } else if (e.key === 'S' || e.key === 's') {
          // Ctrl+Shift+S - Toggle sidebar
          e.preventDefault()
          handlers.onToggleSidebar()
        } else if (e.key === 'W' || e.key === 'w') {
          // Ctrl+Shift+W - Close active pane
          e.preventDefault()
          handlers.onClosePane?.()
        } else if (e.key === 'P' || e.key === 'p') {
          // Ctrl+Shift+P - Command palette
          e.preventDefault()
          handlers.onCommandPalette?.()
        } else if (e.key === 'Tab') {
          // Ctrl+Shift+Tab - Previous tab
          e.preventDefault()
          handlers.onPrevTab?.()
        }
      } else if (isCtrl) {
        if (e.key === 't') {
          e.preventDefault()
          handlers.onNewTab()
        } else if (e.key === 'w') {
          e.preventDefault()
          handlers.onCloseTab()
        } else if (e.key === ',') {
          e.preventDefault()
          handlers.onOpenSettings()
        } else if (e.key === 'Tab') {
          // Ctrl+Tab - Next tab
          e.preventDefault()
          handlers.onNextTab?.()
        }
      } else if (e.altKey) {
        // Alt+Arrow - Navigate between panes
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          handlers.onNavigatePane?.('up')
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          handlers.onNavigatePane?.('down')
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          handlers.onNavigatePane?.('left')
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          handlers.onNavigatePane?.('right')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
