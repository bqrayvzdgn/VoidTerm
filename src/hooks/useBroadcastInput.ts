import { useCallback } from 'react'
import { useTerminalStore } from '../store/terminalStore'
import { collectTerminalIds } from '../utils/pane'

interface UseBroadcastInputProps {
  ptyIds: Map<string, string>
  activePaneTerminalId: string | null
}

/**
 * Broadcast input hook - tüm terminallere girdi gönderme
 */
export const useBroadcastInput = ({
  ptyIds,
  activePaneTerminalId
}: UseBroadcastInputProps) => {
  const { activeTabId, panes } = useTerminalStore()

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

  return {
    handleBroadcastInput
  }
}
