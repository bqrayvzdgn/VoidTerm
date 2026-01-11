import { useState, useCallback } from 'react'
import { useTerminalStore } from '../store/terminalStore'
import { useTerminalLifecycle } from './useTerminalLifecycle'
import { usePaneOperations } from './usePaneOperations'
import { useTabOperations } from './useTabOperations'
import { useBroadcastInput } from './useBroadcastInput'

/**
 * Terminal Manager - Tüm terminal işlemlerini yöneten ana hook
 *
 * Bu hook, daha küçük ve odaklı hook'ları compose ederek çalışır:
 * - useTerminalLifecycle: Terminal/tab oluşturma ve silme
 * - usePaneOperations: Pane split/navigate/close
 * - useTabOperations: Tab navigasyonu
 * - useBroadcastInput: Broadcast modu
 */
export const useTerminalManager = () => {
  // Active pane state - shared across hooks
  const [activePaneTerminalId, setActivePaneTerminalId] = useState<string | null>(null)
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
  const handleCreateTab = useCallback(async (profileId?: string, workspaceId?: string | null) => {
    await createTab(profileId, workspaceId, (terminalId) => {
      setActivePaneTerminalId(terminalId)
    })
  }, [createTab])

  // Pane operations hook
  const {
    handleSplit,
    handleNavigatePane,
    handleClosePane,
    handleTerminalFocus
  } = usePaneOperations({
    ptyIds,
    setPtyIds,
    activePaneTerminalId,
    setActivePaneTerminalId,
    createTerminal,
    handleCloseTab,
    settings
  })

  // Tab navigation hook
  const {
    handleNextTab,
    handlePrevTab,
    handleReopenClosedTab
  } = useTabOperations({
    panes,
    setActivePaneTerminalId,
    handleCreateTab
  })

  // Broadcast input hook
  const { handleBroadcastInput } = useBroadcastInput({
    ptyIds,
    activePaneTerminalId
  })

  // Toggle maximize pane
  const handleToggleMaximize = useCallback(() => {
    if (maximizedPaneId) {
      setMaximizedPaneId(null)
    } else if (activePaneTerminalId) {
      setMaximizedPaneId(activePaneTerminalId)
    }
  }, [maximizedPaneId, activePaneTerminalId])

  return {
    // State
    ptyIds,
    activePaneTerminalId,
    maximizedPaneId,

    // Terminal lifecycle
    createTerminal,
    handleCreateTab,
    handleCloseTab,

    // Pane operations
    handleSplit,
    handleNavigatePane,
    handleClosePane,
    handleTerminalFocus,

    // Tab operations
    handleNextTab,
    handlePrevTab,
    handleReopenClosedTab,

    // Broadcast
    handleBroadcastInput,

    // Maximize
    handleToggleMaximize,

    // Setters (for external use)
    setActivePaneTerminalId,
    setPtyIds
  }
}
