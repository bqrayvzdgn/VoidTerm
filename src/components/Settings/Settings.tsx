import React, { useState } from 'react'
import { Palette, Terminal, Keyboard, User, Info, X } from 'lucide-react'
import {
  AppearanceSettings,
  TerminalSettings,
  ShortcutsSettings,
  ProfilesSettings,
  AboutSettings
} from './sections'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsTab = 'appearance' | 'terminal' | 'shortcuts' | 'profiles' | 'about'

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')

  if (!isOpen) return null

  const tabs: { id: SettingsTab; label: string; icon: JSX.Element }[] = [
    {
      id: 'appearance',
      label: 'Appearance',
      icon: <Palette size={16} strokeWidth={1.5} />
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: <Terminal size={16} strokeWidth={1.5} />
    },
    {
      id: 'shortcuts',
      label: 'Shortcuts',
      icon: <Keyboard size={16} strokeWidth={1.5} />
    },
    {
      id: 'profiles',
      label: 'Profiles',
      icon: <User size={16} strokeWidth={1.5} />
    },
    {
      id: 'about',
      label: 'About',
      icon: <Info size={16} strokeWidth={1.5} />
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
          <h2 className="modal-title" id="settings-title">
            Settings
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={14} strokeWidth={1.5} aria-hidden="true" />
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
