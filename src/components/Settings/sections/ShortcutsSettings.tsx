import React, { useState, useMemo, memo } from 'react'
import { useSettingsStore } from '../../../store/settingsStore'
import type { KeyboardShortcuts } from '../../../types'
import { DEFAULT_SHORTCUTS } from '../../../types'

type ShortcutCategory = 'tabs' | 'panes' | 'navigation' | 'terminal' | 'general'

interface ShortcutConfig {
  key: keyof KeyboardShortcuts
  category: ShortcutCategory
}

const SHORTCUT_CONFIGS: ShortcutConfig[] = [
  { key: 'newTab', category: 'tabs' },
  { key: 'closeTab', category: 'tabs' },
  { key: 'nextTab', category: 'tabs' },
  { key: 'prevTab', category: 'tabs' },
  { key: 'closePane', category: 'panes' },
  { key: 'splitVertical', category: 'panes' },
  { key: 'splitHorizontal', category: 'panes' },
  { key: 'focusLeft', category: 'panes' },
  { key: 'focusRight', category: 'panes' },
  { key: 'focusUp', category: 'panes' },
  { key: 'focusDown', category: 'panes' },
  { key: 'toggleSearch', category: 'terminal' },
  { key: 'clearTerminal', category: 'terminal' },
  { key: 'copyText', category: 'terminal' },
  { key: 'pasteText', category: 'terminal' },
  { key: 'toggleSidebar', category: 'general' },
  { key: 'openSettings', category: 'general' },
  { key: 'openCommandPalette', category: 'general' }
]

const formatShortcut = (shortcut: string | undefined): string[] => {
  if (!shortcut) return ['—']
  return shortcut.split('+')
}

const SHORTCUT_LABELS: Record<keyof KeyboardShortcuts, string> = {
  newTab: 'New Tab',
  closeTab: 'Close Tab',
  closePane: 'Close Pane',
  splitVertical: 'Split Vertical',
  splitHorizontal: 'Split Horizontal',
  toggleSidebar: 'Toggle Sidebar',
  openSettings: 'Settings',
  nextTab: 'Next Tab',
  prevTab: 'Previous Tab',
  focusLeft: 'Focus Left Pane',
  focusRight: 'Focus Right Pane',
  focusUp: 'Focus Up Pane',
  focusDown: 'Focus Down Pane',
  toggleSearch: 'Toggle Search',
  clearTerminal: 'Clear Terminal',
  copyText: 'Copy',
  pasteText: 'Paste',
  openCommandPalette: 'Command Palette'
}

const CATEGORY_TITLES: Record<ShortcutCategory, string> = {
  tabs: 'Tabs',
  panes: 'Panes',
  navigation: 'Navigation',
  terminal: 'Terminal',
  general: 'General'
}

export const ShortcutsSettings: React.FC = memo(() => {
  const { settings, updateSettings } = useSettingsStore()
  const [editingShortcut, setEditingShortcut] = useState<keyof KeyboardShortcuts | null>(null)
  const [conflictKey, setConflictKey] = useState<keyof KeyboardShortcuts | null>(null)

  const findConflict = (newShortcut: string, currentKey: keyof KeyboardShortcuts): keyof KeyboardShortcuts | null => {
    for (const [key, value] of Object.entries(settings.shortcuts)) {
      if (key !== currentKey && value === newShortcut) {
        return key as keyof KeyboardShortcuts
      }
    }
    return null
  }

  const groupedShortcuts = useMemo(() => {
    const groups: Record<ShortcutCategory, ShortcutConfig[]> = {
      tabs: [],
      panes: [],
      navigation: [],
      terminal: [],
      general: []
    }

    SHORTCUT_CONFIGS.forEach((config) => {
      groups[config.category].push(config)
    })

    return groups
  }, [])

  const handleShortcutKeyDown = (e: React.KeyboardEvent, key: keyof KeyboardShortcuts) => {
    e.preventDefault()
    const parts: string[] = []
    if (e.ctrlKey) parts.push('Ctrl')
    if (e.shiftKey) parts.push('Shift')
    if (e.altKey) parts.push('Alt')
    if (e.metaKey) parts.push('Meta')

    if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
      const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key
      parts.push(keyName)

      const newShortcut = parts.join('+')

      const conflict = findConflict(newShortcut, key)
      if (conflict) {
        setConflictKey(conflict)
        setTimeout(() => setConflictKey(null), 3000)
        return
      }

      updateSettings({
        shortcuts: {
          ...settings.shortcuts,
          [key]: newShortcut
        }
      })
      setEditingShortcut(null)
    }
  }

  const handleResetShortcuts = () => {
    if (confirm('Keyboard shortcuts will be reset to default. Continue?')) {
      updateSettings({ shortcuts: DEFAULT_SHORTCUTS })
    }
  }

  const renderShortcutItem = (config: ShortcutConfig) => {
    const { key } = config
    const isEditing = editingShortcut === key
    const isConflict = conflictKey === key
    const shortcutParts = formatShortcut(settings.shortcuts[key])

    return (
      <div key={key} className={`settings-item shortcut-item ${isConflict ? 'conflict' : ''}`}>
        <span className="settings-label">{SHORTCUT_LABELS[key]}</span>
        <div className="shortcut-input-wrapper">
          {isEditing ? (
            <input
              type="text"
              className="shortcut-input editing"
              placeholder="Press keys..."
              onKeyDown={(e) => handleShortcutKeyDown(e, key)}
              onBlur={() => setEditingShortcut(null)}
              autoFocus
              readOnly
            />
          ) : (
            <button className="shortcut-display" onClick={() => setEditingShortcut(key)}>
              <div className="shortcut-keys">
                {shortcutParts.map((part, index) => (
                  <React.Fragment key={index}>
                    <kbd className="shortcut-key">{part}</kbd>
                    {index < shortcutParts.length - 1 && <span className="shortcut-separator">+</span>}
                  </React.Fragment>
                ))}
              </div>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="settings-panel">
      <h3 className="settings-panel-title">Keyboard Shortcuts</h3>

      {conflictKey && (
        <div className="shortcut-conflict-warning">This shortcut is already in use: {SHORTCUT_LABELS[conflictKey]}</div>
      )}

      <div className="settings-category">
        <h4 className="settings-category-title">{CATEGORY_TITLES.tabs}</h4>
        <div className="settings-group">{groupedShortcuts.tabs.map(renderShortcutItem)}</div>
      </div>

      <div className="settings-category">
        <h4 className="settings-category-title">{CATEGORY_TITLES.panes}</h4>
        <div className="settings-group">{groupedShortcuts.panes.map(renderShortcutItem)}</div>
      </div>

      <div className="settings-category">
        <h4 className="settings-category-title">{CATEGORY_TITLES.terminal}</h4>
        <div className="settings-group">{groupedShortcuts.terminal.map(renderShortcutItem)}</div>
      </div>

      <div className="settings-category">
        <h4 className="settings-category-title">{CATEGORY_TITLES.general}</h4>
        <div className="settings-group">{groupedShortcuts.general.map(renderShortcutItem)}</div>
      </div>

      <div className="settings-actions">
        <button className="btn btn-secondary" onClick={handleResetShortcuts}>
          Reset to Default
        </button>
      </div>
    </div>
  )
})

ShortcutsSettings.displayName = 'ShortcutsSettings'
