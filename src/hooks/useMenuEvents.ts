import { useEffect } from 'react'

interface MenuEventHandlers {
  onNewTab: () => void
  onCloseTab: () => void
  onOpenSettings: () => void
  onSplitVertical: () => void
  onSplitHorizontal: () => void
}

export function useMenuEvents(handlers: MenuEventHandlers) {
  useEffect(() => {
    const removeNewTab = window.electronAPI.onNewTab(handlers.onNewTab)
    const removeCloseTab = window.electronAPI.onCloseTab(handlers.onCloseTab)
    const removeOpenSettings = window.electronAPI.onOpenSettings(handlers.onOpenSettings)
    const removeSplitVertical = window.electronAPI.onSplitVertical(handlers.onSplitVertical)
    const removeSplitHorizontal = window.electronAPI.onSplitHorizontal(handlers.onSplitHorizontal)

    return () => {
      removeNewTab()
      removeCloseTab()
      removeOpenSettings()
      removeSplitVertical()
      removeSplitHorizontal()
    }
  }, [handlers])
}
