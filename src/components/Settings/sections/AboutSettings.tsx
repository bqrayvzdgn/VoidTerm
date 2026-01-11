import React, { memo } from 'react'
import { useTranslation } from '../../../i18n'

export const AboutSettings: React.FC = memo(() => {
  const { t } = useTranslation()

  return (
    <div className="settings-panel">
      <h3 className="settings-panel-title">{t.settings.about.title}</h3>

      <div className="about-content">
        <div className="about-logo">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="4" y="4" width="56" height="56" rx="12" stroke="currentColor" strokeWidth="2" />
            <path d="M16 24l8 8-8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M28 40h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className="about-title">VoidTerm</h2>
        <p className="about-version">{t.settings.about.version} 1.0.0</p>

        <p className="about-description">{t.settings.about.description}</p>

        <div className="about-links">
          <a
            href="#"
            className="about-link"
            onClick={(e) => {
              e.preventDefault()
              window.electronAPI?.openExternal?.('https://github.com/void/voidterm')
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            {t.settings.about.github}
          </a>
        </div>

        <div className="about-credits">
          <p>Electron {window.electronAPI?.versions?.electron || 'N/A'}</p>
          <p>Node.js {window.electronAPI?.versions?.node || 'N/A'}</p>
          <p>Chrome {window.electronAPI?.versions?.chrome || 'N/A'}</p>
        </div>
      </div>
    </div>
  )
})

AboutSettings.displayName = 'AboutSettings'
