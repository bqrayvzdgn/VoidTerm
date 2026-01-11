import React, { useState, useMemo, memo } from 'react'
import { useSettingsStore } from '../../../store/settingsStore'
import { useTranslation } from '../../../i18n'
import type { KeyboardShortcuts } from '../../../types'
import { DEFAULT_SHORTCUTS } from '../../../types'

type ShortcutCategory = 'tabs' | 'panes' | 'navigation' | 'terminal' | 'general'

interface ShortcutConfig {
  key: keyof KeyboardShortcuts
  category: ShortcutCategory
}

/**
 * Kısayol tuşlarını kategorilere göre gruplar
 */
const SHORTCUT_CONFIGS: ShortcutConfig[] = [
  // Sekmeler
  { key: 'newTab', category: 'tabs' },
  { key: 'closeTab', category: 'tabs' },
  { key: 'nextTab', category: 'tabs' },
  { key: 'prevTab', category: 'tabs' },
  // Paneller
  { key: 'closePane', category: 'panes' },
  { key: 'splitVertical', category: 'panes' },
  { key: 'splitHorizontal', category: 'panes' },
  { key: 'focusLeft', category: 'panes' },
  { key: 'focusRight', category: 'panes' },
  { key: 'focusUp', category: 'panes' },
  { key: 'focusDown', category: 'panes' },
  // Terminal
  { key: 'toggleSearch', category: 'terminal' },
  { key: 'clearTerminal', category: 'terminal' },
  { key: 'copyText', category: 'terminal' },
  { key: 'pasteText', category: 'terminal' },
  // Genel
  { key: 'toggleSidebar', category: 'general' },
  { key: 'openSettings', category: 'general' },
  { key: 'openCommandPalette', category: 'general' },
  { key: 'openSSHManager', category: 'general' }
]

/**
 * Kısayol tuşunu görsel olarak formatlar
 * Örn: "Ctrl+Shift+D" -> ["Ctrl", "Shift", "D"]
 */
const formatShortcut = (shortcut: string | undefined): string[] => {
  if (!shortcut) return ['—']
  return shortcut.split('+')
}

export const ShortcutsSettings: React.FC = memo(() => {
  const { t } = useTranslation()
  const { settings, updateSettings } = useSettingsStore()
  const [editingShortcut, setEditingShortcut] = useState<keyof KeyboardShortcuts | null>(null)
  const [conflictKey, setConflictKey] = useState<keyof KeyboardShortcuts | null>(null)

  /**
   * Kısayol çakışmalarını kontrol eder
   */
  const findConflict = (newShortcut: string, currentKey: keyof KeyboardShortcuts): keyof KeyboardShortcuts | null => {
    for (const [key, value] of Object.entries(settings.shortcuts)) {
      if (key !== currentKey && value === newShortcut) {
        return key as keyof KeyboardShortcuts
      }
    }
    return null
  }

  /**
   * Kısayol label'larını çevirilerden alır
   */
  const getShortcutLabel = (key: keyof KeyboardShortcuts): string => {
    const labels: Record<keyof KeyboardShortcuts, string> = {
      newTab: t.settings.shortcuts.newTab,
      closeTab: t.settings.shortcuts.closeTab,
      closePane: t.settings.shortcuts.closePane,
      splitVertical: t.settings.shortcuts.splitVertical,
      splitHorizontal: t.settings.shortcuts.splitHorizontal,
      toggleSidebar: t.settings.shortcuts.toggleSidebar,
      openSettings: t.settings.shortcuts.openSettings,
      nextTab: t.settings.shortcuts.nextTab,
      prevTab: t.settings.shortcuts.prevTab,
      focusLeft: t.settings.shortcuts.focusLeft,
      focusRight: t.settings.shortcuts.focusRight,
      focusUp: t.settings.shortcuts.focusUp,
      focusDown: t.settings.shortcuts.focusDown,
      toggleSearch: t.settings.shortcuts.toggleSearch,
      clearTerminal: t.settings.shortcuts.clearTerminal,
      copyText: t.settings.shortcuts.copyText,
      pasteText: t.settings.shortcuts.pasteText,
      openCommandPalette: t.settings.shortcuts.openCommandPalette,
      openSSHManager: t.settings.shortcuts.openSSHManager
    }
    return labels[key]
  }

  /**
   * Kategori başlıklarını alır
   */
  const getCategoryTitle = (category: ShortcutCategory): string => {
    const titles: Record<ShortcutCategory, string> = {
      tabs: t.settings.shortcuts.categorySections,
      panes: t.settings.shortcuts.categoryPanes,
      navigation: t.settings.shortcuts.categoryNavigation,
      terminal: t.settings.shortcuts.categoryTerminal,
      general: t.settings.shortcuts.categoryGeneral
    }
    return titles[category]
  }

  /**
   * Kısayolları kategorilere göre gruplar
   */
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
      
      // Çakışma kontrolü
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
    if (confirm(t.settings.shortcuts.resetConfirm)) {
      updateSettings({ shortcuts: DEFAULT_SHORTCUTS })
    }
  }

  const renderShortcutItem = (config: ShortcutConfig) => {
    const { key } = config
    const isEditing = editingShortcut === key
    const isConflict = conflictKey === key
    const shortcutParts = formatShortcut(settings.shortcuts[key])

    return (
      <div 
        key={key} 
        className={`settings-item shortcut-item ${isConflict ? 'conflict' : ''}`}
      >
        <span className="settings-label">{getShortcutLabel(key)}</span>
        <div className="shortcut-input-wrapper">
          {isEditing ? (
            <input
              type="text"
              className="shortcut-input editing"
              placeholder={t.settings.shortcuts.pressKeys}
              onKeyDown={(e) => handleShortcutKeyDown(e, key)}
              onBlur={() => setEditingShortcut(null)}
              autoFocus
              readOnly
            />
          ) : (
            <button
              className="shortcut-display"
              onClick={() => setEditingShortcut(key)}
            >
              <div className="shortcut-keys">
                {shortcutParts.map((part, index) => (
                  <React.Fragment key={index}>
                    <kbd className="shortcut-key">{part}</kbd>
                    {index < shortcutParts.length - 1 && (
                      <span className="shortcut-separator">+</span>
                    )}
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
      <h3 className="settings-panel-title">{t.settings.shortcuts.title}</h3>

      {conflictKey && (
        <div className="shortcut-conflict-warning">
          {t.settings.shortcuts.conflictWarning} {getShortcutLabel(conflictKey)}
        </div>
      )}

      {/* Sekmeler */}
      <div className="settings-category">
        <h4 className="settings-category-title">{getCategoryTitle('tabs')}</h4>
        <div className="settings-group">
          {groupedShortcuts.tabs.map(renderShortcutItem)}
        </div>
      </div>

      {/* Paneller */}
      <div className="settings-category">
        <h4 className="settings-category-title">{getCategoryTitle('panes')}</h4>
        <div className="settings-group">
          {groupedShortcuts.panes.map(renderShortcutItem)}
        </div>
      </div>

      {/* Terminal */}
      <div className="settings-category">
        <h4 className="settings-category-title">{getCategoryTitle('terminal')}</h4>
        <div className="settings-group">
          {groupedShortcuts.terminal.map(renderShortcutItem)}
        </div>
      </div>

      {/* Genel */}
      <div className="settings-category">
        <h4 className="settings-category-title">{getCategoryTitle('general')}</h4>
        <div className="settings-group">
          {groupedShortcuts.general.map(renderShortcutItem)}
        </div>
      </div>

      <div className="settings-actions">
        <button className="btn btn-secondary" onClick={handleResetShortcuts}>
          {t.settings.shortcuts.resetToDefault}
        </button>
      </div>
    </div>
  )
})

ShortcutsSettings.displayName = 'ShortcutsSettings'
