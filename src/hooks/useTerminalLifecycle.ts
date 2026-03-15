import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useTerminalStore } from '../store/terminalStore'
import { useSettingsStore } from '../store/settingsStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { collectTerminalIds } from '../utils/pane'
import { createLogger } from '../utils/logger'

const logger = createLogger('TerminalLifecycle')

/**
 * Terminal lifecycle hook - terminal and tab creation/deletion
 */
export const useTerminalLifecycle = () => {
  const [ptyIds, setPtyIds] = useState<Map<string, string>>(new Map())

  const { addTab, removeTab, panes, setPane, setActiveTab } = useTerminalStore()
  const { settings, profiles } = useSettingsStore()
  const { activeWorkspaceId } = useWorkspaceStore()

  // Create a new terminal process
  const createTerminal = useCallback(
    async (profileId: string, cwd?: string) => {
      const profile = profiles.find((p) => p.id === profileId) || profiles[0]

      try {
        const ptyOptions: Record<string, unknown> = {
          shell: profile.shell,
          cwd: cwd || profile.cwd,
          env: profile.env
        }

        // Pass SSH options for SSH profiles
        if (profile.type === 'ssh' && profile.sshHost) {
          ptyOptions.sshHost = profile.sshHost
          ptyOptions.sshPort = profile.sshPort
          ptyOptions.sshUsername = profile.sshUsername
          ptyOptions.sshAuthMethod = profile.sshAuthMethod
          ptyOptions.sshKeyPath = profile.sshKeyPath
        }

        const ptyId = await window.electronAPI.ptyCreate(ptyOptions as Parameters<typeof window.electronAPI.ptyCreate>[0])

        const terminalId = uuidv4()

        setPtyIds((prev) => {
          const newMap = new Map(prev)
          newMap.set(terminalId, ptyId)
          return newMap
        })

        // Execute startup command after shell is ready (wait for first PTY output)
        if (profile.startupCommand) {
          const startupCmd = profile.startupCommand
          const removeListener = window.electronAPI.onPtyData((id, _data) => {
            if (id === ptyId) {
              removeListener()
              clearTimeout(startupTimeout)
              // Small delay after first output to ensure prompt is ready
              setTimeout(() => {
                window.electronAPI.ptyWrite(ptyId, startupCmd + '\r')
              }, 100)
            }
          })
          // Clean up listener if PTY never sends data (e.g. process dies immediately)
          const startupTimeout = setTimeout(() => {
            removeListener()
          }, 10000)
        }

        return { terminalId, ptyId }
      } catch (error) {
        logger.error('Failed to create terminal:', error)
        throw new Error(`Failed to create terminal: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },
    [profiles]
  )

  // Create a new tab with terminal
  // workspaceId: undefined = use active workspace, null = force no workspace, string = specific workspace
  const handleCreateTab = useCallback(
    async (profileId?: string, workspaceId?: string | null, onTerminalCreated?: (terminalId: string) => void) => {
      const profileIdToUse = profileId || settings.defaultProfile
      const profile = profiles.find((p) => p.id === profileIdToUse) || profiles[0]
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
    },
    [addTab, createTerminal, settings.defaultProfile, profiles, setPane, activeWorkspaceId, removeTab, setActiveTab]
  )

  // Close a tab and cleanup
  const handleCloseTab = useCallback(
    (tabId: string) => {
      const pane = panes.get(tabId)
      if (pane) {
        const terminalIds = collectTerminalIds(pane)
        // Kill all PTYs first, then update state
        for (const tid of terminalIds) {
          const ptyId = ptyIds.get(tid)
          if (ptyId) {
            try {
              window.electronAPI.ptyKill(ptyId)
            } catch (error) {
              logger.error('Failed to kill PTY:', error)
            }
          }
        }
        // Batch state update: remove all PTY mappings at once
        setPtyIds((prev) => {
          const newMap = new Map(prev)
          terminalIds.forEach((tid) => newMap.delete(tid))
          return newMap
        })
      }
      removeTab(tabId)
    },
    [panes, ptyIds, removeTab]
  )

  return {
    ptyIds,
    setPtyIds,
    createTerminal,
    handleCreateTab,
    handleCloseTab,
    settings
  }
}
