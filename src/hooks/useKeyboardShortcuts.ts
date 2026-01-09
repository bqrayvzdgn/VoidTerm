import { useEffect } from 'react'

interface KeyboardShortcutHandlers {
  onNewTab: () => void
  onCloseTab: () => void
  onSplitVertical: () => void
  onSplitHorizontal: () => void
  onToggleSidebar: () => void
  onOpenSettings: () => void
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
          e.preventDefault()
          handlers.onToggleSidebar()
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
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
