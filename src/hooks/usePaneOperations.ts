import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useTerminalStore } from '../store/terminalStore'
import { getActivePaneId, setActivePaneId } from '../store/activePaneStore'
import { collectTerminalIds, splitPaneAtTerminal, findNextPane, removePaneAtTerminal } from '../utils/pane'
import { createLogger } from '../utils/logger'
import type { Pane } from '../types'

export type LayoutType = '1x1' | '1x2' | '2x1' | '2x2' | '1x3' | '3x1'

const logger = createLogger('PaneOperations')

interface UsePaneOperationsProps {
  ptyIds: Map<string, string>
  setPtyIds: React.Dispatch<React.SetStateAction<Map<string, string>>>
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
  createTerminal,
  handleCloseTab,
  settings
}: UsePaneOperationsProps) => {
  const { activeTabId, panes, setPane } = useTerminalStore()

  // Resolve the profile of the active tab
  const getActiveTabProfile = useCallback((): string => {
    const state = useTerminalStore.getState()
    const activeTab = state.tabs.find((t) => t.id === state.activeTabId)
    return activeTab?.profileId || settings.defaultProfile
  }, [settings.defaultProfile])

  // Split the current pane (CWD-aware — Phase B)
  const handleSplit = useCallback(
    async (direction: 'horizontal' | 'vertical') => {
      const activePaneTerminalId = getActivePaneId()
      if (!activeTabId || !activePaneTerminalId) return

      const currentPane = panes.get(activeTabId)
      if (!currentPane) return

      try {
        // Read CWD from the current terminal's shell integration state
        const currentCwd = useTerminalStore.getState().terminalCwds.get(activePaneTerminalId)

        const { terminalId: newTerminalId } = await createTerminal(getActiveTabProfile())

        // If we have a CWD from shell integration, change directory in the new terminal
        if (currentCwd) {
          const newPtyId = ptyIds.get(newTerminalId)
          if (newPtyId) {
            // Small delay to let the shell initialize before sending cd
            setTimeout(() => {
              try {
                window.electronAPI.ptyWrite(newPtyId, `cd ${JSON.stringify(currentCwd)}\r`)
              } catch {
                // Best effort
              }
            }, 300)
          }
        }

        const newPane = splitPaneAtTerminal(currentPane, activePaneTerminalId, direction, newTerminalId)

        if (newPane) {
          setPane(activeTabId, newPane)
          setActivePaneId(newTerminalId)
        }
      } catch (error) {
        logger.error('Failed to split pane:', error)
      }
    },
    [activeTabId, panes, ptyIds, createTerminal, getActiveTabProfile, setPane]
  )

  // Navigate between panes
  const handleNavigatePane = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      const activePaneTerminalId = getActivePaneId()
      if (!activeTabId || !activePaneTerminalId) return

      const currentPane = panes.get(activeTabId)
      if (!currentPane) return

      const nextTerminalId = findNextPane(currentPane, activePaneTerminalId, direction)
      if (nextTerminalId) {
        setActivePaneId(nextTerminalId)
      }
    },
    [activeTabId, panes]
  )

  // Close the active pane
  const handleClosePane = useCallback(() => {
    const activePaneTerminalId = getActivePaneId()
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
      setPtyIds((prev) => {
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
        setActivePaneId(remainingTerminals[0])
      }
    }
  }, [activeTabId, panes, ptyIds, handleCloseTab, setPane, setPtyIds])

  // Reset to single pane, keeping the active terminal
  // Reads fresh state from the store to avoid stale closure issues
  const resetToSinglePane = useCallback(() => {
    const activePaneTerminalId = getActivePaneId()
    const state = useTerminalStore.getState()
    const currentActiveTabId = state.activeTabId
    if (!currentActiveTabId || !activePaneTerminalId) return false

    const currentPane = state.panes.get(currentActiveTabId)
    if (!currentPane) return false

    // If already a single terminal, nothing to reset
    const allTerminals = collectTerminalIds(currentPane)
    if (allTerminals.length <= 1) return true

    // Collect terminal IDs to kill
    const toKill = allTerminals.filter((tid) => tid !== activePaneTerminalId)

    // Kill all PTYs except the active one
    for (const tid of toKill) {
      const ptyId = ptyIds.get(tid)
      if (ptyId) {
        try { window.electronAPI.ptyKill(ptyId) } catch { /* best effort */ }
      }
    }

    // Batch remove all killed terminals from ptyIds
    setPtyIds((prev) => {
      const m = new Map(prev)
      toKill.forEach((tid) => m.delete(tid))
      return m
    })

    // Clean up terminal store entries and CWDs for killed terminals
    for (const tid of toKill) {
      state.removeTerminal(tid)
    }

    setPane(currentActiveTabId, { id: uuidv4(), type: 'terminal', terminalId: activePaneTerminalId })
    setActivePaneId(activePaneTerminalId)
    return true
  }, [ptyIds, setPane, setPtyIds])

  const handleApplyLayout = useCallback(
    async (layout: LayoutType, profileId?: string) => {
      const profile = profileId || getActiveTabProfile()

      // Always reset to single pane first
      resetToSinglePane()

      if (layout === '1x1') return

      const activePaneTerminalId = getActivePaneId()
      const currentActiveTabId = useTerminalStore.getState().activeTabId
      if (!currentActiveTabId || !activePaneTerminalId) return

      try {
        const counts: Record<string, number> = { '1x2': 2, '2x1': 2, '2x2': 4, '1x3': 3, '3x1': 3 }
        const total = counts[layout]

        const termIds = [activePaneTerminalId]
        for (let i = 1; i < total; i++) {
          const { terminalId } = await createTerminal(profile)
          termIds.push(terminalId)
        }

        const mkTerm = (tid: string): Pane => ({ id: uuidv4(), type: 'terminal', terminalId: tid })
        const mkSplit = (dir: 'horizontal' | 'vertical', children: Pane[], ratio?: number): Pane => ({
          id: uuidv4(),
          type: 'split',
          direction: dir,
          children,
          ...(ratio != null && { ratio })
        })

        let newPane: Pane
        switch (layout) {
          case '1x2':
            newPane = mkSplit('vertical', [mkTerm(termIds[0]), mkTerm(termIds[1])])
            break
          case '2x1':
            newPane = mkSplit('horizontal', [mkTerm(termIds[0]), mkTerm(termIds[1])])
            break
          case '2x2':
            newPane = mkSplit('vertical', [
              mkSplit('horizontal', [mkTerm(termIds[0]), mkTerm(termIds[1])]),
              mkSplit('horizontal', [mkTerm(termIds[2]), mkTerm(termIds[3])])
            ])
            break
          case '1x3':
            newPane = mkSplit('vertical', [
              mkTerm(termIds[0]),
              mkSplit('vertical', [mkTerm(termIds[1]), mkTerm(termIds[2])])
            ], 1 / 3)
            break
          case '3x1':
            newPane = mkSplit('horizontal', [
              mkTerm(termIds[0]),
              mkSplit('horizontal', [mkTerm(termIds[1]), mkTerm(termIds[2])])
            ], 1 / 3)
            break
          default:
            return
        }

        setPane(currentActiveTabId, newPane)
        setActivePaneId(activePaneTerminalId)
      } catch (error) {
        logger.error('Failed to apply layout:', error)
      }
    },
    [createTerminal, getActiveTabProfile, setPane, resetToSinglePane]
  )

  return {
    handleSplit,
    handleNavigatePane,
    handleClosePane,
    handleApplyLayout
  }
}
