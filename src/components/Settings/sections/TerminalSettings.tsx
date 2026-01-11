import React, { memo } from 'react'
import { useSettingsStore } from '../../../store/settingsStore'
import { useTranslation } from '../../../i18n'

export const TerminalSettings: React.FC = memo(() => {
  const { t } = useTranslation()
  const { settings, profiles, updateSettings } = useSettingsStore()

  return (
    <div className="settings-panel">
      <h3 className="settings-panel-title">{t.settings.terminal.title}</h3>

      <div className="settings-group">
        <div className="settings-item">
          <span className="settings-label">{t.settings.terminal.defaultProfile}</span>
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
          <span className="settings-label">{t.settings.terminal.scrollback}</span>
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
          <span className="settings-label">{t.settings.terminal.copyOnSelect}</span>
          <input
            type="checkbox"
            checked={settings.copyOnSelect}
            onChange={(e) => updateSettings({ copyOnSelect: e.target.checked })}
          />
        </div>

        <div className="settings-item">
          <span className="settings-label">{t.settings.terminal.bellSound}</span>
          <input
            type="checkbox"
            checked={settings.bellSound}
            onChange={(e) => updateSettings({ bellSound: e.target.checked })}
          />
        </div>
      </div>
    </div>
  )
})

TerminalSettings.displayName = 'TerminalSettings'
