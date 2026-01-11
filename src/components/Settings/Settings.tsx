import React, { useState } from 'react'
import { useTranslation } from '../../i18n'
import {
  AppearanceSettings,
  TerminalSettings,
  ShortcutsSettings,
  ProfilesSettings,
  BackupSettings,
  AboutSettings
} from './sections'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsTab = 'appearance' | 'terminal' | 'shortcuts' | 'profiles' | 'backup' | 'about'

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')

  if (!isOpen) return null

  const tabs: { id: SettingsTab; label: string; icon: JSX.Element }[] = [
    {
      id: 'appearance',
      label: t.settings.tabs.appearance,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 2v12M2 8h12" strokeOpacity="0.5" />
        </svg>
      )
    },
    {
      id: 'terminal',
      label: t.settings.tabs.terminal,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="12" height="12" rx="2" />
          <path d="M5 6l2 2-2 2M8 10h3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'shortcuts',
      label: t.settings.tabs.shortcuts,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="4" width="14" height="9" rx="1" />
          <path d="M4 7h1M7 7h2M11 7h1M3 10h10" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: 'profiles',
      label: t.settings.tabs.profiles,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="5" r="3" />
          <path d="M3 14c0-3 2-5 5-5s5 2 5 5" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: 'backup',
      label: t.settings.tabs.backup,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 2v8M5 7l3 3 3-3M3 12h10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'about',
      label: t.settings.tabs.about,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 7v4M8 5v.5" strokeLinecap="round" />
        </svg>
      )
    }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'appearance':
        return <AppearanceSettings />
      case 'terminal':
        return <TerminalSettings />
      case 'shortcuts':
        return <ShortcutsSettings />
      case 'profiles':
        return <ProfilesSettings />
      case 'backup':
        return <BackupSettings />
      case 'about':
        return <AboutSettings />
      default:
        return null
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" id="settings-title">{t.settings.title}</h2>
          <button className="modal-close" onClick={onClose} aria-label={t.common.close}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="settings-layout">
          <nav className="settings-sidebar" role="tablist" aria-label="Settings categories">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`settings-panel-${tab.id}`}
                id={`settings-tab-${tab.id}`}
                className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div 
            className="settings-content" 
            role="tabpanel" 
            id={`settings-panel-${activeTab}`}
            aria-labelledby={`settings-tab-${activeTab}`}
          >
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
