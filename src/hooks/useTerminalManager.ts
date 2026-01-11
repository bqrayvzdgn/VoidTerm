import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useTerminalStore } from '../store/terminalStore'
import { useSettingsStore } from '../store/settingsStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { collectTerminalIds, splitPaneAtTerminal, findNextPane, removePaneAtTerminal } from '../utils/pane'
import { TERMINAL_STARTUP_DELAY } from '../constants'

export const useTerminalManager = () => {
  const [ptyIds, setPtyIds] = useState<Map<string, string>>(new Map())
  const [activePaneTerminalId, setActivePaneTerminalId] = useState<string | null>(null)
  const [maximizedPaneId, setMaximizedPaneId] = useState<string | null>(null)

  const { tabs, activeTabId, addTab, removeTab, panes, setPane, setActiveTab, popClosedTab } = useTerminalStore()
  const { settings, profiles } = useSettingsStore()
  const { activeWorkspaceId } = useWorkspaceStore()

  // Create a new terminal process
  const createTerminal = useCallback(async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId) || profiles[0]

    try {
      const ptyId = await window.electronAPI.ptyCreate({
        shell: profile.shell,
        cwd: profile.cwd,
        env: profile.env
      })

      const terminalId = uuidv4()

      setPtyIds(prev => {
        const newMap = new Map(prev)
        newMap.set(terminalId, ptyId)
        return newMap
      })

      // Execute startup command if defined
      if (profile.startupCommand) {
        setTimeout(() => {
          window.electronAPI.ptyWrite(ptyId, profile.startupCommand + '\r')
        }, TERMINAL_STARTUP_DELAY)
      }

      return { terminalId, ptyId }
    } catch (error) {
      console.error('Failed to create terminal:', error)
      throw new Error(`Failed to create terminal: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [profiles])

  // Create a new tab with terminal
  // workspaceId: undefined = use active workspace, null = force no workspace, string = specific workspace
  const handleCreateTab = useCallback(async (profileId?: string, workspaceId?: string | null) => {
    const profileIdToUse = profileId || settings.defaultProfile
    const profile = profiles.find(p => p.id === profileIdToUse) || profiles[0]
    if (!profile) {
      console.error('No profile found for id:', profileIdToUse)
      return
    }

    // null = explicitly unassigned, undefined = use active workspace
    const tabWorkspaceId = workspaceId === null ? undefined : (workspaceId ?? activeWorkspaceId ?? undefined)
    const tabId = addTab(profileIdToUse, profile.name, tabWorkspaceId)

    try {
      const { terminalId } = await createTerminal(profileIdToUse)

      setPane(tabId, {
        id: uuidv4(),
        type: 'terminal',
        terminalId
      })

      setActivePaneTerminalId(terminalId)
      setActiveTab(tabId)
    } catch (error) {
      console.error('Failed to create tab:', error)
      removeTab(tabId)
    }
  }, [addTab, createTerminal, settings.defaultProfile, profiles, setPane, activeWorkspaceId, removeTab, setActiveTab])

  // Close a tab and cleanup
  const handleCloseTab = useCallback((tabId: string) => {
    const pane = panes.get(tabId)
    if (pane) {
      collectTerminalIds(pane).forEach(terminalId => {
        const ptyId = ptyIds.get(terminalId)
        if (ptyId) {
          try {
            window.electronAPI.ptyKill(ptyId)
          } catch (error) {
            console.error('Failed to kill PTY:', error)
          }
          setPtyIds(prev => {
            const newMap = new Map(prev)
            newMap.delete(terminalId)
            return newMap
          })
        }
      })
    }
    removeTab(tabId)
  }, [panes, ptyIds, removeTab])

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
      console.error('Failed to split pane:', error)
    }
  }, [activeTabId, activePaneTerminalId, panes, createTerminal, settings.defaultProfile, setPane])

  // Navigate between panes
  const handleNavigatePane = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!activeTabId || !activePaneTerminalId) return

    const currentPane = panes.get(activeTabId)
    if (!currentPane) return

    const nextTerminalId = findNextPane(currentPane, activePaneTerminalId, direction)
    if (nextTerminalId) {
      setActivePaneTerminalId(nextTerminalId)
    }
  }, [activeTabId, activePaneTerminalId, panes])

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
        console.error('Failed to kill PTY:', error)
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
  }, [activeTabId, activePaneTerminalId, panes, ptyIds, handleCloseTab, setPane])

  // Tab navigation
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
  }, [tabs, activeWorkspaceId, activeTabId, setActiveTab, panes])

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
  }, [tabs, activeWorkspaceId, activeTabId, setActiveTab, panes])

  // Reopen last closed tab
  const handleReopenClosedTab = useCallback(async () => {
    const closedTab = popClosedTab()
    if (!closedTab) return

    await handleCreateTab(closedTab.profileId)
  }, [popClosedTab, handleCreateTab])

  // Toggle maximize pane
  const handleToggleMaximize = useCallback(() => {
    if (maximizedPaneId) {
      setMaximizedPaneId(null)
    } else if (activePaneTerminalId) {
      setMaximizedPaneId(activePaneTerminalId)
    }
  }, [maximizedPaneId, activePaneTerminalId])

  // Broadcast input to all terminals in current tab
  const handleBroadcastInput = useCallback((data: string) => {
    if (!activeTabId || !activePaneTerminalId) return

    const currentPane = panes.get(activeTabId)
    if (!currentPane) return

    const terminalIds = collectTerminalIds(currentPane)

    terminalIds.forEach(terminalId => {
      if (terminalId !== activePaneTerminalId) {
        const ptyId = ptyIds.get(terminalId)
        if (ptyId) {
          window.electronAPI.ptyWrite(ptyId, data)
        }
      }
    })
  }, [activeTabId, activePaneTerminalId, panes, ptyIds])

  // Focus handler
  const handleTerminalFocus = useCallback((terminalId: string) => {
    setActivePaneTerminalId(terminalId)
  }, [])

  return {
    // State
    ptyIds,
    activePaneTerminalId,
    maximizedPaneId,

    // Terminal actions
    createTerminal,
    handleCreateTab,
    handleCloseTab,
    handleSplit,
    handleNavigatePane,
    handleClosePane,
    handleTerminalFocus,
    handleBroadcastInput,

    // Tab actions
    handleNextTab,
    handlePrevTab,
    handleReopenClosedTab,
    handleToggleMaximize,

    // Setters
    setActivePaneTerminalId,
    setPtyIds
  }
}
