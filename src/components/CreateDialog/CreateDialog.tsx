import React, { useState, useEffect } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { TerminalIcon } from '../Icons/TerminalIcons'

interface CreateDialogProps {
  open: boolean
  onClose: () => void
  onCreateWorkspace: (name: string) => void
  onCreateTerminal: (profileId?: string) => void
}

export const CreateDialog: React.FC<CreateDialogProps> = ({
  open,
  onClose,
  onCreateWorkspace,
  onCreateTerminal
}) => {
  const [step, setStep] = useState<'select' | 'workspace-name' | 'terminal-select'>('select')
  const [workspaceName, setWorkspaceName] = useState('')
  const { profiles } = useSettingsStore()

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep('select')
      setWorkspaceName('')
    }
  }, [open])

  const handleTerminalClick = () => {
    setStep('terminal-select')
  }

  const handleSelectProfile = (profileId: string) => {
    onCreateTerminal(profileId)
    onClose()
  }

  const handleWorkspaceClick = () => {
    setStep('workspace-name')
  }

  const handleCreateWorkspace = () => {
    onCreateWorkspace(workspaceName.trim() || 'New Workspace')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateWorkspace()
    } else if (e.key === 'Escape') {
      setStep('select')
      setWorkspaceName('')
    }
  }

  const handleBack = () => {
    setStep('select')
    setWorkspaceName('')
  }

  if (!open) return null

  return (
    <>
      <div className="dialog-overlay" onClick={onClose} />
      <div className="create-dialog">
        {step === 'select' ? (
          <>
            <div className="create-dialog-header">What do you want to create?</div>
            <div className="create-dialog-options">
              <button className="create-dialog-option" onClick={handleWorkspaceClick}>
                <div className="create-dialog-icon workspace">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </div>
                <div className="create-dialog-text">
                  <span className="create-dialog-title">Workspace</span>
                  <span className="create-dialog-desc">Create a new workspace to organize terminals</span>
                </div>
              </button>
              <button className="create-dialog-option" onClick={handleTerminalClick}>
                <div className="create-dialog-icon terminal">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 17l6-6-6-6M12 19h8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="create-dialog-text">
                  <span className="create-dialog-title">Terminal</span>
                  <span className="create-dialog-desc">Open a new terminal tab</span>
                </div>
              </button>
            </div>
          </>
        ) : step === 'terminal-select' ? (
          <>
            <div className="create-dialog-header">
              <button className="create-dialog-back" onClick={handleBack}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 12L6 8L10 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span>Select Terminal Type</span>
            </div>
            <div className="create-dialog-profiles">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  className="create-dialog-profile"
                  onClick={() => handleSelectProfile(profile.id)}
                >
                  <div className="create-dialog-profile-icon">
                    <TerminalIcon icon={profile.icon} size={24} />
                  </div>
                  <div className="create-dialog-profile-info">
                    <span className="create-dialog-profile-name">{profile.name}</span>
                    <span className="create-dialog-profile-path">{profile.shell}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="create-dialog-header">
              <button className="create-dialog-back" onClick={handleBack}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 12L6 8L10 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span>Create Workspace</span>
            </div>
            <div className="create-dialog-form">
              <label className="create-dialog-label">Workspace Name</label>
              <input
                type="text"
                className="create-dialog-input"
                placeholder="Enter workspace name..."
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <button
                className="create-dialog-submit"
                onClick={handleCreateWorkspace}
              >
                Create Workspace
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
