import React, { memo, useCallback } from 'react'
import { useSettingsStore } from '../../../store/settingsStore'
import { useToastStore } from '../../../store/toastStore'
import { getThemeNames } from '../../../themes'

export const AppearanceSettings: React.FC = memo(() => {
  const { settings, updateSettings, setTheme } = useSettingsStore()
  const toast = useToastStore()

  const handleSelectBackgroundImage = useCallback(async () => {
    try {
      const dataUri = await window.electronAPI.selectBackgroundImage()
      if (dataUri) {
        updateSettings({ backgroundImage: dataUri })
      }
    } catch {
      toast.error('Failed to select background image')
    }
  }, [updateSettings, toast])

  const handleClearBackgroundImage = useCallback(() => {
    updateSettings({ backgroundImage: '' })
  }, [updateSettings])

  return (
    <div className="settings-panel">
      <h3 className="settings-panel-title">Appearance Settings</h3>

      <div className="settings-group">
        <div className="settings-item">
          <span className="settings-label">Theme</span>
          <select className="settings-select" value={settings.theme} onChange={(e) => setTheme(e.target.value)}>
            {getThemeNames().map((name) => (
              <option key={name} value={name}>
                {name
                  .split('-')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="settings-item">
          <span className="settings-label">Font Family</span>
          <input
            type="text"
            className="settings-input"
            value={settings.fontFamily}
            onChange={(e) => updateSettings({ fontFamily: e.target.value })}
          />
        </div>

        <div className="settings-item">
          <span className="settings-label">Font Size</span>
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
          <span className="settings-label">Line Height</span>
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
          <span className="settings-label">Letter Spacing</span>
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
          <span className="settings-label">Cursor Style</span>
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
          <span className="settings-label">Cursor Blink</span>
          <input
            type="checkbox"
            checked={settings.cursorBlink}
            onChange={(e) => updateSettings({ cursorBlink: e.target.checked })}
          />
        </div>
      </div>

      <div className="settings-group">
        <h4 className="settings-subheading">Window Effects</h4>

        <div className="settings-item">
          <span className="settings-label">Opacity</span>
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
          <span className="settings-label">Blur Effect</span>
          <input type="checkbox" checked={settings.blur} onChange={(e) => updateSettings({ blur: e.target.checked })} />
        </div>
      </div>

      <div className="settings-group">
        <h4 className="settings-subheading">Background Image</h4>

        <div className="settings-item">
          <span className="settings-label">Image</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="settings-button settings-button-primary" onClick={handleSelectBackgroundImage}>
              {settings.backgroundImage ? 'Change Image' : 'Select Image'}
            </button>
            {settings.backgroundImage && (
              <button className="settings-button" onClick={handleClearBackgroundImage}>
                Clear
              </button>
            )}
          </div>
        </div>

        {settings.backgroundImage && (
          <>
            <div className="settings-item">
              <span className="settings-label">Opacity</span>
              <div className="settings-slider-wrapper">
                <input
                  type="range"
                  className="settings-slider"
                  value={settings.backgroundOpacity}
                  min={0.05}
                  max={0.5}
                  step={0.05}
                  onChange={(e) => updateSettings({ backgroundOpacity: parseFloat(e.target.value) })}
                />
                <span className="settings-slider-value">{Math.round(settings.backgroundOpacity * 100)}%</span>
              </div>
            </div>

            <div className="settings-item">
              <span className="settings-label">Blur</span>
              <div className="settings-slider-wrapper">
                <input
                  type="range"
                  className="settings-slider"
                  value={settings.backgroundBlur}
                  min={0}
                  max={20}
                  step={1}
                  onChange={(e) => updateSettings({ backgroundBlur: parseInt(e.target.value) })}
                />
                <span className="settings-slider-value">{settings.backgroundBlur}px</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
})

AppearanceSettings.displayName = 'AppearanceSettings'
