import { useCallback } from 'react'
import { useTerminalStore } from '../store/terminalStore'
import { collectTerminalIds, splitPaneAtTerminal, findNextPane, removePaneAtTerminal } from '../utils/pane'
import { createLogger } from '../utils/logger'

const logger = createLogger('PaneOperations')

interface UsePaneOperationsProps {
  ptyIds: Map<string, string>
  setPtyIds: React.Dispatch<React.SetStateAction<Map<string, string>>>
  activePaneTerminalId: string | null
  setActivePaneTerminalId: (id: string | null) => void
  createTerminal: (profileId: string) => Promise<{ terminalId: string; ptyId: string }>
  handleCloseTab: (tabId: string) => void
  settings: { defaultProfile: string }
}

/**
 * Pane islemleri icin hook (split, navigate, close)
 */
export const usePaneOperations = ({
  ptyIds,
  setPtyIds,
  activePaneTerminalId,
  setActivePaneTerminalId,
  createTerminal,
  handleCloseTab,
  settings
}: UsePaneOperationsProps) => {
  const { activeTabId, panes, setPane } = useTerminalStore()

  // Split the current pane
  const handleSplit = useCallback(async (direction: 'horizontal' | 'vertical') => {
    if (!activeTabId || !activePaneTerminalId) return

    const currentPane = panes.get(activeTabId)
    if (!currentPane) return

    try {
      const { terminalId: newTerminalId } = await createTerminal(settings.defaultProfile)
      const newPane = splitPaneAtTerminal(currentPane, activePaneTerminalId, direction, newTerminalId)

      if (newPane) {
        setPane(activeTabId, newPane)
        setActivePaneTerminalId(newTerminalId)
      }
    } catch (error) {
      logger.error('Failed to split pane:', error)
    }
  }, [activeTabId, activePaneTerminalId, panes, createTerminal, settings.defaultProfile, setPane, setActivePaneTerminalId])

  // Navigate between panes
  const handleNavigatePane = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!activeTabId || !activePaneTerminalId) return

    const currentPane = panes.get(activeTabId)
    if (!currentPane) return

    const nextTerminalId = findNextPane(currentPane, activePaneTerminalId, direction)
    if (nextTerminalId) {
      setActivePaneTerminalId(nextTerminalId)
    }
  }, [activeTabId, activePaneTerminalId, panes, setActivePaneTerminalId])

  // Close the active pane
  const handleClosePane = useCallback(() => {
    if (!activeTabId || !activePaneTerminalId) return

    const currentPane = panes.get(activeTabId)
    if (!currentPane) return

    const terminalIds = collectTerminalIds(currentPane)

    // If only one terminal, close the whole tab
    if (terminalIds.length <= 1) {
      handleCloseTab(activeTabId)
      return
    }

    // Kill the PTY for the closing terminal
    const ptyId = ptyIds.get(activePaneTerminalId)
    if (ptyId) {
      try {
        window.electronAPI.ptyKill(ptyId)
      } catch (error) {
        logger.error('Failed to kill PTY:', error)
      }
      setPtyIds(prev => {
        const newMap = new Map(prev)
        newMap.delete(activePaneTerminalId)
        return newMap
      })
    }

    // Remove the pane from the tree
    const newPane = removePaneAtTerminal(currentPane, activePaneTerminalId)
    if (newPane) {
      setPane(activeTabId, newPane)

      // Set focus to a remaining terminal
      const remainingTerminals = collectTerminalIds(newPane)
      if (remainingTerminals.length > 0) {
        setActivePaneTerminalId(remainingTerminals[0])
      }
    }
  }, [activeTabId, activePaneTerminalId, panes, ptyIds, handleCloseTab, setPane, setPtyIds, setActivePaneTerminalId])

  // Focus handler
  const handleTerminalFocus = useCallback((terminalId: string) => {
    setActivePaneTerminalId(terminalId)
  }, [setActivePaneTerminalId])

  return {
    handleSplit,
    handleNavigatePane,
    handleClosePane,
    handleTerminalFocus
  }
}
