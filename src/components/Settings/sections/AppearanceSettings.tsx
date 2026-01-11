import React, { memo, useRef, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../../../store/settingsStore'
import { getThemeNames } from '../../../themes'
import { useCustomThemeStore, useCustomThemes } from '../../../store/customThemeStore'
import { useToastStore } from '../../../store/toastStore'
import { useTranslation } from '../../../i18n'

export const AppearanceSettings: React.FC = memo(() => {
  const { t } = useTranslation()
  const { settings, updateSettings, setTheme } = useSettingsStore()
  const customThemes = useCustomThemes()
  const { importTheme, removeCustomTheme, exportTheme, loadFromStorage } = useCustomThemeStore()
  const toast = useToastStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load custom themes on mount
  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const result = importTheme(content)
      
      if (result.success) {
        toast.success(t.settings.appearance.themeImportSuccess)
        // Optionally switch to the imported theme
        if (result.themeId) {
          setTheme(result.themeId)
        }
      } else {
        toast.error(`${t.settings.appearance.themeImportError}: ${result.error}`)
      }
    }
    reader.readAsText(file)
    
    // Reset input
    e.target.value = ''
  }, [importTheme, setTheme, toast, t])

  const handleExportTheme = useCallback((id: string) => {
    const json = exportTheme(id)
    if (!json) return

    const theme = customThemes.find(th => th.id === id)
    const filename = `${theme?.name || 'theme'}.json`.replace(/[^a-z0-9.-]/gi, '_')
    
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [exportTheme, customThemes])

  const handleDeleteTheme = useCallback((id: string) => {
    if (confirm(t.settings.appearance.themeDeleteConfirm)) {
      // If the deleted theme is currently active, switch to default
      if (settings.theme === id) {
        setTheme('catppuccin-mocha')
      }
      removeCustomTheme(id)
    }
  }, [removeCustomTheme, settings.theme, setTheme, t])

  return (
    <div className="settings-panel">
      <h3 className="settings-panel-title">{t.settings.appearance.title}</h3>

      <div className="settings-group">
        <div className="settings-item">
          <span className="settings-label">{t.settings.appearance.theme}</span>
          <select
            className="settings-select"
            value={settings.theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <optgroup label={t.settings.appearance.builtInThemes}>
              {getThemeNames().map((name) => (
                <option key={name} value={name}>
                  {name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </option>
              ))}
            </optgroup>
            {customThemes.length > 0 && (
              <optgroup label={t.settings.appearance.customThemesList}>
                {customThemes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div className="settings-item">
          <span className="settings-label">{t.settings.appearance.fontFamily}</span>
          <input
            type="text"
            className="settings-input"
            value={settings.fontFamily}
            onChange={(e) => updateSettings({ fontFamily: e.target.value })}
          />
        </div>

        <div className="settings-item">
          <span className="settings-label">{t.settings.appearance.fontSize}</span>
          <input
            type="number"
            className="settings-input"
            value={settings.fontSize}
            min={8}
            max={32}
            onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) || 14 })}
          />
        </div>

        <div className="settings-item">
          <span className="settings-label">{t.settings.appearance.lineHeight}</span>
          <input
            type="number"
            className="settings-input"
            value={settings.lineHeight}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => updateSettings({ lineHeight: parseFloat(e.target.value) || 1.2 })}
          />
        </div>

        <div className="settings-item">
          <span className="settings-label">{t.settings.appearance.letterSpacing}</span>
          <input
            type="number"
            className="settings-input"
            value={settings.letterSpacing}
            min={-2}
            max={5}
            step={0.5}
            onChange={(e) => updateSettings({ letterSpacing: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="settings-item">
          <span className="settings-label">{t.settings.appearance.cursorStyle}</span>
          <select
            className="settings-select"
            value={settings.cursorStyle}
            onChange={(e) => updateSettings({ cursorStyle: e.target.value as 'block' | 'underline' | 'bar' })}
          >
            <option value="block">Block</option>
            <option value="underline">Underline</option>
            <option value="bar">Bar</option>
          </select>
        </div>

        <div className="settings-item">
          <span className="settings-label">{t.settings.appearance.cursorBlink}</span>
          <input
            type="checkbox"
            checked={settings.cursorBlink}
            onChange={(e) => updateSettings({ cursorBlink: e.target.checked })}
          />
        </div>
      </div>

      <div className="settings-group">
        <h4 className="settings-subheading">{t.settings.appearance.windowEffects}</h4>

        <div className="settings-item">
          <span className="settings-label">{t.settings.appearance.opacity}</span>
          <div className="settings-slider-wrapper">
            <input
              type="range"
              className="settings-slider"
              value={settings.opacity}
              min={0.5}
              max={1}
              step={0.05}
              onChange={(e) => updateSettings({ opacity: parseFloat(e.target.value) })}
            />
            <span className="settings-slider-value">{Math.round(settings.opacity * 100)}%</span>
          </div>
        </div>

        <div className="settings-item">
          <span className="settings-label">{t.settings.appearance.blur}</span>
          <input
            type="checkbox"
            checked={settings.blur}
            onChange={(e) => updateSettings({ blur: e.target.checked })}
          />
        </div>

        <div className="settings-item">
          <span className="settings-label">{t.settings.appearance.backgroundImage}</span>
          <input
            type="text"
            className="settings-input"
            value={settings.backgroundImage}
            onChange={(e) => updateSettings({ backgroundImage: e.target.value })}
            placeholder={t.settings.appearance.backgroundImagePlaceholder}
          />
        </div>
      </div>

      <div className="settings-group">
        <h4 className="settings-subheading">{t.settings.appearance.customThemes}</h4>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        
        <div className="settings-item">
          <button 
            className="settings-button settings-button-primary"
            onClick={handleImportClick}
          >
            {t.settings.appearance.importTheme}
          </button>
        </div>

        {customThemes.length === 0 ? (
          <p className="settings-description">{t.settings.appearance.noCustomThemes}</p>
        ) : (
          <div className="custom-themes-list">
            {customThemes.map((theme) => (
              <div key={theme.id} className="custom-theme-item">
                <div 
                  className="custom-theme-preview"
                  style={{ backgroundColor: theme.colors.background }}
                >
                  <span style={{ color: theme.colors.foreground }}>{theme.name}</span>
                </div>
                <div className="custom-theme-actions">
                  <button
                    className="settings-button settings-button-small"
                    onClick={() => setTheme(theme.id)}
                  >
                    {t.common.save}
                  </button>
                  <button
                    className="settings-button settings-button-small"
                    onClick={() => handleExportTheme(theme.id)}
                  >
                    {t.settings.appearance.exportTheme}
                  </button>
                  <button
                    className="settings-button settings-button-small settings-button-danger"
                    onClick={() => handleDeleteTheme(theme.id)}
                  >
                    {t.settings.appearance.deleteTheme}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

AppearanceSettings.displayName = 'AppearanceSettings'
