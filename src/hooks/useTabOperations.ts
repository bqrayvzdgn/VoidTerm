import { useCallback } from 'react'
import { useTerminalStore } from '../store/terminalStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { collectTerminalIds } from '../utils/pane'

interface UseTabOperationsProps {
  panes: Map<string, any>
  setActivePaneTerminalId: (id: string | null) => void
  handleCreateTab: (profileId?: string, workspaceId?: string) => Promise<void>
}

/**
 * Tab navigasyonu icin hook (next, prev, reopen)
 */
export const useTabOperations = ({
  panes,
  setActivePaneTerminalId,
  handleCreateTab
}: UseTabOperationsProps) => {
  const { tabs, activeTabId, setActiveTab, popClosedTab } = useTerminalStore()
  const { activeWorkspaceId } = useWorkspaceStore()

  // Tab navigation - next
  const handleNextTab = useCallback(() => {
    const workspaceTabs = tabs.filter(tab =>
      activeWorkspaceId ? tab.workspaceId === activeWorkspaceId : !tab.workspaceId
    )
    if (workspaceTabs.length <= 1) return

    const currentIndex = workspaceTabs.findIndex(t => t.id === activeTabId)
    const nextIndex = (currentIndex + 1) % workspaceTabs.length
    const nextTab = workspaceTabs[nextIndex]

    setActiveTab(nextTab.id)
    const pane = panes.get(nextTab.id)
    if (pane) {
      const terminalIds = collectTerminalIds(pane)
      if (terminalIds.length > 0) {
        setActivePaneTerminalId(terminalIds[0])
      }
    }
  }, [tabs, activeWorkspaceId, activeTabId, setActiveTab, panes, setActivePaneTerminalId])

  // Tab navigation - previous
  const handlePrevTab = useCallback(() => {
    const workspaceTabs = tabs.filter(tab =>
      activeWorkspaceId ? tab.workspaceId === activeWorkspaceId : !tab.workspaceId
    )
    if (workspaceTabs.length <= 1) return

    const currentIndex = workspaceTabs.findIndex(t => t.id === activeTabId)
    const prevIndex = (currentIndex - 1 + workspaceTabs.length) % workspaceTabs.length
    const prevTab = workspaceTabs[prevIndex]

    setActiveTab(prevTab.id)
    const pane = panes.get(prevTab.id)
    if (pane) {
      const terminalIds = collectTerminalIds(pane)
      if (terminalIds.length > 0) {
        setActivePaneTerminalId(terminalIds[0])
      }
    }
  }, [tabs, activeWorkspaceId, activeTabId, setActiveTab, panes, setActivePaneTerminalId])

  // Reopen last closed tab
  const handleReopenClosedTab = useCallback(async () => {
    const closedTab = popClosedTab()
    if (!closedTab) return

    await handleCreateTab(closedTab.profileId)
  }, [popClosedTab, handleCreateTab])

  return {
    handleNextTab,
    handlePrevTab,
    handleReopenClosedTab
  }
}
