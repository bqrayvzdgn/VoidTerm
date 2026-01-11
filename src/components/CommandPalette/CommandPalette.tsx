import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { TerminalIcon } from '../Icons/TerminalIcons'

interface Command {
  id: string
  label: string
  description?: string
  shortcut?: string
  icon?: string
  action: () => void
  category: 'terminal' | 'view' | 'settings' | 'profile' | 'window'
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onNewTab: (profileId?: string) => void
  onSplitVertical: () => void
  onSplitHorizontal: () => void
  onCloseTab: () => void
  onClosePane: () => void
  onToggleSidebar: () => void
  onOpenSettings: () => void
  onNextTab: () => void
  onPrevTab: () => void
  onOpenSSHManager?: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = memo(({
  isOpen,
  onClose,
  onNewTab,
  onSplitVertical,
  onSplitHorizontal,
  onCloseTab,
  onClosePane,
  onToggleSidebar,
  onOpenSettings,
  onNextTab,
  onPrevTab,
  onOpenSSHManager
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const { profiles } = useSettingsStore()

  const commands = useMemo<Command[]>(() => [
    // Terminal commands
    {
      id: 'new-tab',
      label: 'New Terminal',
      description: 'Open a new terminal tab',
      shortcut: 'Ctrl+T',
      icon: 'terminal',
      action: () => onNewTab(),
      category: 'terminal'
    },
    {
      id: 'close-tab',
      label: 'Close Tab',
      description: 'Close the current tab',
      shortcut: 'Ctrl+W',
      action: () => onCloseTab(),
      category: 'terminal'
    },
    {
      id: 'close-pane',
      label: 'Close Pane',
      description: 'Close the current pane',
      shortcut: 'Ctrl+Shift+W',
      action: () => onClosePane(),
      category: 'terminal'
    },
    {
      id: 'split-vertical',
      label: 'Split Vertical',
      description: 'Split the terminal vertically',
      shortcut: 'Ctrl+Shift+D',
      action: () => onSplitVertical(),
      category: 'terminal'
    },
    {
      id: 'split-horizontal',
      label: 'Split Horizontal',
      description: 'Split the terminal horizontally',
      shortcut: 'Ctrl+Shift+E',
      action: () => onSplitHorizontal(),
      category: 'terminal'
    },
    {
      id: 'next-tab',
      label: 'Next Tab',
      description: 'Switch to the next tab',
      shortcut: 'Ctrl+Tab',
      action: () => onNextTab(),
      category: 'terminal'
    },
    {
      id: 'prev-tab',
      label: 'Previous Tab',
      description: 'Switch to the previous tab',
      shortcut: 'Ctrl+Shift+Tab',
      action: () => onPrevTab(),
      category: 'terminal'
    },
    // View commands
    {
      id: 'toggle-sidebar',
      label: 'Toggle Sidebar',
      description: 'Show or hide the sidebar',
      shortcut: 'Ctrl+Shift+S',
      action: () => onToggleSidebar(),
      category: 'view'
    },
    // Window commands
    {
      id: 'toggle-quake-mode',
      label: 'Toggle Quake Mode',
      description: 'Toggle dropdown terminal mode',
      shortcut: 'Ctrl+`',
      action: () => window.electronAPI?.toggleQuakeMode?.(),
      category: 'window'
    },
    {
      id: 'toggle-visibility',
      label: 'Hide/Show Window',
      description: 'Toggle window visibility',
      shortcut: 'F12',
      action: () => {}, // Handled by global shortcut
      category: 'window'
    },
    // Settings commands
    {
      id: 'open-settings',
      label: 'Open Settings',
      description: 'Open the settings panel',
      shortcut: 'Ctrl+,',
      action: () => onOpenSettings(),
      category: 'settings'
    },
    {
      id: 'open-ssh-manager',
      label: 'SSH Manager',
      description: 'Manage SSH connections',
      action: () => onOpenSSHManager?.(),
      category: 'settings'
    },
    // Profile commands
    ...profiles.map(profile => ({
      id: `profile-${profile.id}`,
      label: `New ${profile.name}`,
      description: profile.shell,
      icon: profile.icon,
      action: () => onNewTab(profile.id),
      category: 'profile' as const
    }))
  ], [profiles, onNewTab, onCloseTab, onClosePane, onSplitVertical, onSplitHorizontal, onNextTab, onPrevTab, onToggleSidebar, onOpenSettings])

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands
    
    const lowerQuery = query.toLowerCase()
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.description?.toLowerCase().includes(lowerQuery) ||
      cmd.category.toLowerCase().includes(lowerQuery)
    )
  }, [commands, query])

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const executeCommand = useCallback((command: Command) => {
    onClose()
    command.action()
  }, [onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [filteredCommands, selectedIndex, executeCommand, onClose])

  if (!isOpen) return null

  return (
    <>
      <div className="command-palette-overlay" onClick={onClose} />
      <div className="command-palette">
        <div className="command-palette-input-wrapper">
          <svg className="command-palette-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="command-palette-list" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">No commands found</div>
          ) : (
            filteredCommands.map((command, index) => (
              <button
                key={command.id}
                className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => executeCommand(command)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="command-palette-item-icon">
                  {command.icon ? (
                    <TerminalIcon icon={command.icon} size={18} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="4 17 10 11 4 5" />
                      <line x1="12" y1="19" x2="20" y2="19" />
                    </svg>
                  )}
                </div>
                <div className="command-palette-item-content">
                  <span className="command-palette-item-label">{command.label}</span>
                  {command.description && (
                    <span className="command-palette-item-description">{command.description}</span>
                  )}
                </div>
                {command.shortcut && (
                  <span className="command-palette-item-shortcut">{command.shortcut}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
})

CommandPalette.displayName = 'CommandPalette'
