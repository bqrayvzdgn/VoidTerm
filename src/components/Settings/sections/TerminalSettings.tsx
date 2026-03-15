import React, { memo } from 'react'
import { useSettingsStore } from '../../../store/settingsStore'

export const TerminalSettings: React.FC = memo(() => {
  const { settings, profiles, updateSettings } = useSettingsStore()

  return (
    <div className="settings-panel">
      <h3 className="settings-panel-title">Terminal Settings</h3>

      <div className="settings-group">
        <div className="settings-item">
          <span className="settings-label">Default Profile</span>
          <select
            className="settings-select"
            value={settings.defaultProfile}
            onChange={(e) => updateSettings({ defaultProfile: e.target.value })}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>

        <div className="settings-item">
          <span className="settings-label">Terminal Padding</span>
          <div className="settings-slider-wrapper">
            <input
              type="range"
              className="settings-slider"
              value={settings.terminalPadding}
              min={0}
              max={24}
              step={2}
              onChange={(e) => updateSettings({ terminalPadding: parseInt(e.target.value) })}
            />
            <span className="settings-slider-value">{settings.terminalPadding}px</span>
          </div>
        </div>

        <div className="settings-item">
          <span className="settings-label">Scrollback</span>
          <input
            type="number"
            className="settings-input"
            value={settings.scrollback}
            min={100}
            max={100000}
            step={1000}
            onChange={(e) => updateSettings({ scrollback: parseInt(e.target.value) || 10000 })}
          />
        </div>

        <div className="settings-item">
          <span className="settings-label">Copy on Select</span>
          <input
            type="checkbox"
            checked={settings.copyOnSelect}
            onChange={(e) => updateSettings({ copyOnSelect: e.target.checked })}
          />
        </div>

        <div className="settings-item">
          <span className="settings-label">Bell Sound</span>
          <input
            type="checkbox"
            checked={settings.bellSound}
            onChange={(e) => updateSettings({ bellSound: e.target.checked })}
          />
        </div>
      </div>

      <div className="settings-group">
        <h4 className="settings-subheading">Quake Mode</h4>

        <div className="settings-item">
          <span className="settings-label">Enable Quake Mode</span>
          <input
            type="checkbox"
            checked={settings.quakeMode}
            onChange={(e) => updateSettings({ quakeMode: e.target.checked })}
          />
        </div>

        {settings.quakeMode && (
          <>
            <div className="settings-item">
              <span className="settings-label">Shortcut</span>
              <input
                type="text"
                className="settings-input"
                value={settings.quakeShortcut}
                onChange={(e) => updateSettings({ quakeShortcut: e.target.value })}
                placeholder="Ctrl+`"
              />
            </div>

            <div className="settings-item">
              <span className="settings-label">Height</span>
              <div className="settings-slider-wrapper">
                <input
                  type="range"
                  className="settings-slider"
                  value={settings.quakeHeight}
                  min={20}
                  max={80}
                  step={5}
                  onChange={(e) => updateSettings({ quakeHeight: parseInt(e.target.value) })}
                />
                <span className="settings-slider-value">{settings.quakeHeight}%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
})

TerminalSettings.displayName = 'TerminalSettings'
