import { useCallback } from 'react'
import { useTerminalStore } from '../store/terminalStore'
import { setActivePaneId } from '../store/activePaneStore'
import { useTerminalLifecycle } from './useTerminalLifecycle'
import { usePaneOperations } from './usePaneOperations'
import { useTabOperations } from './useTabOperations'

/**
 * Terminal Manager - Main hook orchestrating all terminal operations
 *
 * NOTE: This hook does NOT subscribe to activePaneId to avoid re-rendering
 * the entire App tree on pane focus change. Components that need the active
 * pane ID should use useActivePaneId() directly.
 */
export const useTerminalManager = () => {
  const setActivePaneTerminalId = setActivePaneId

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

  return {
    ptyIds,
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
    setActivePaneTerminalId,
    setPtyIds
  }
}
