import { useState, useCallback } from 'react'
import { useTerminalStore } from '../store/terminalStore'
import { getActivePaneId, setActivePaneId } from '../store/activePaneStore'
import { useTerminalLifecycle } from './useTerminalLifecycle'
import { usePaneOperations } from './usePaneOperations'
import { useTabOperations } from './useTabOperations'

/**
 * Terminal Manager - Tüm terminal işlemlerini yöneten ana hook
 *
 * NOTE: This hook does NOT subscribe to activePaneId to avoid re-rendering
 * the entire App tree on pane focus change. Components that need the active
 * pane ID should use useActivePaneId() directly.
 */
export const useTerminalManager = () => {
  const setActivePaneTerminalId = setActivePaneId
  const [maximizedPaneId, setMaximizedPaneId] = useState<string | null>(null)

  const { panes } = useTerminalStore()

  // Terminal lifecycle hook
  const {
    ptyIds,
    setPtyIds,
    createTerminal,
    handleCreateTab: createTab,
    handleCloseTab,
    settings
  } = useTerminalLifecycle()

  // Wrap handleCreateTab to update activePaneTerminalId
  const handleCreateTab = useCallback(
    async (profileId?: string, workspaceId?: string | null) => {
      await createTab(profileId, workspaceId, (terminalId) => {
        setActivePaneTerminalId(terminalId)
      })
    },
    [createTab, setActivePaneTerminalId]
  )

  // Pane operations hook
  const { handleSplit, handleNavigatePane, handleClosePane, handleApplyLayout } = usePaneOperations({
    ptyIds,
    setPtyIds,
    createTerminal,
    handleCloseTab,
    settings
  })

  // Tab navigation hook
  const { handleNextTab, handlePrevTab, handleReopenClosedTab } = useTabOperations({
    panes,
    setActivePaneTerminalId,
    handleCreateTab
  })

  // Toggle maximize pane
  const handleToggleMaximize = useCallback(() => {
    if (maximizedPaneId) {
      setMaximizedPaneId(null)
    } else {
      const activeId = getActivePaneId()
      if (activeId) setMaximizedPaneId(activeId)
    }
  }, [maximizedPaneId])

  return {
    ptyIds,
    maximizedPaneId,
    createTerminal,
    handleCreateTab,
    handleCloseTab,
    handleSplit,
    handleApplyLayout,
    handleNavigatePane,
    handleClosePane,
    handleNextTab,
    handlePrevTab,
    handleReopenClosedTab,
    handleToggleMaximize,
    setActivePaneTerminalId,
    setPtyIds
  }
}
