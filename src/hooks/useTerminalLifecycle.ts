import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useTerminalStore } from '../store/terminalStore'
import { useSettingsStore } from '../store/settingsStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { collectTerminalIds } from '../utils/pane'
import { TERMINAL_STARTUP_DELAY } from '../constants'
import { createLogger } from '../utils/logger'

const logger = createLogger('TerminalLifecycle')

/**
 * Terminal yaşam döngüsü hook'u - terminal ve tab oluşturma/silme işlemleri
 */
export const useTerminalLifecycle = () => {
  const [ptyIds, setPtyIds] = useState<Map<string, string>>(new Map())

  const { addTab, removeTab, panes, setPane, setActiveTab } = useTerminalStore()
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
      logger.error('Failed to create terminal:', error)
      throw new Error(`Failed to create terminal: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [profiles])

  // Create a new tab with terminal
  // workspaceId: undefined = use active workspace, null = force no workspace, string = specific workspace
  const handleCreateTab = useCallback(async (
    profileId?: string,
    workspaceId?: string | null,
    onTerminalCreated?: (terminalId: string) => void
  ) => {
    const profileIdToUse = profileId || settings.defaultProfile
    const profile = profiles.find(p => p.id === profileIdToUse) || profiles[0]
    if (!profile) {
      logger.error('No profile found for id:', profileIdToUse)
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

      onTerminalCreated?.(terminalId)
      setActiveTab(tabId)
    } catch (error) {
      logger.error('Failed to create tab:', error)
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
            logger.error('Failed to kill PTY:', error)
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

  return {
    ptyIds,
    setPtyIds,
    createTerminal,
    handleCreateTab,
    handleCloseTab,
    settings
  }
}
