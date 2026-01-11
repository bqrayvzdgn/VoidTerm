import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { SSHConnection, Pane } from '../types'
import { useTerminalStore } from '../store/terminalStore'
import { useSettingsStore } from '../store/settingsStore'
import { useWorkspaceStore } from '../store/workspaceStore'

interface UseSSHManagerProps {
  setPtyIds: React.Dispatch<React.SetStateAction<Map<string, string>>>
  setActivePaneTerminalId: (id: string) => void
}

export const useSSHManager = ({ setPtyIds, setActivePaneTerminalId }: UseSSHManagerProps) => {
  const [sshManagerOpen, setSSHManagerOpen] = useState(false)
  
  const { addTab, setPane } = useTerminalStore()
  const { profiles } = useSettingsStore()
  const { activeWorkspaceId } = useWorkspaceStore()

  const handleSSHConnect = useCallback(async (connection: SSHConnection) => {
    // Create SSH connection command
    let sshCommand = `ssh ${connection.username}@${connection.host}`

    if (connection.port !== 22) {
      sshCommand += ` -p ${connection.port}`
    }

    if (connection.authMethod === 'key' && connection.privateKeyPath) {
      sshCommand += ` -i "${connection.privateKeyPath}"`
    }

    if (connection.jumpHost) {
      sshCommand += ` -J ${connection.jumpHost}`
    }

    // Find or create SSH profile
    let sshProfile = profiles.find(p => p.shell.toLowerCase().includes('ssh'))
    if (!sshProfile) {
      sshProfile = profiles[0]
    }

    // Create a new tab with SSH profile
    const tabId = addTab(sshProfile?.id || 'default', `SSH: ${connection.name}`, activeWorkspaceId || undefined)

    try {
      const ptyId = await window.electronAPI.ptyCreate({
        shell: sshProfile?.shell || 'cmd.exe',
        cwd: sshProfile?.cwd,
        env: sshProfile?.env
      })

      const terminalId = uuidv4()

      setPtyIds(prev => {
        const newMap = new Map(prev)
        newMap.set(terminalId, ptyId)
        return newMap
      })

      const pane: Pane = {
        id: uuidv4(),
        type: 'terminal',
        terminalId
      }

      setPane(tabId, pane)
      setActivePaneTerminalId(terminalId)

      // Execute SSH command after shell is ready
      setTimeout(() => {
        window.electronAPI.ptyWrite(ptyId, sshCommand + '\r')
      }, 500)

    } catch (error) {
      console.error('Failed to create SSH terminal:', error)
    }
  }, [profiles, addTab, activeWorkspaceId, setPane, setPtyIds, setActivePaneTerminalId])

  return {
    sshManagerOpen,
    setSSHManagerOpen,
    handleSSHConnect
  }
}
