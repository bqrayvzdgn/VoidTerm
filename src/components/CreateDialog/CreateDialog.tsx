import React, { useState, useEffect, useCallback, useRef } from 'react'
import { LayoutGrid, Terminal } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { TerminalIcon } from '../Icons/TerminalIcons'

interface CreateDialogProps {
  open: boolean
  onClose: () => void
  onCreateWorkspace: (name: string) => void
  onCreateTerminal: (profileId?: string) => void
}

export const CreateDialog: React.FC<CreateDialogProps> = ({ open, onClose, onCreateWorkspace, onCreateTerminal }) => {
  const [step, setStep] = useState<'select' | 'workspace-name' | 'terminal-select'>('select')
  const [workspaceName, setWorkspaceName] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(0)
  const { profiles } = useSettingsStore()
  const optionsRef = useRef<HTMLDivElement>(null)

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep('select')
      setWorkspaceName('')
      setFocusedIndex(0)
    }
  }, [open])

  // Focus the first option button when step changes
  useEffect(() => {
    if (!open) return
    setFocusedIndex(0)
    // Defer focus to next frame so DOM is updated
    requestAnimationFrame(() => {
      const buttons = optionsRef.current?.querySelectorAll<HTMLButtonElement>('.create-dialog-option')
      buttons?.[0]?.focus()
    })
  }, [step, open])

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

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
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

  // Arrow key navigation for option lists
  const handleOptionsKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const buttons = optionsRef.current?.querySelectorAll<HTMLButtonElement>('.create-dialog-option')
      if (!buttons || buttons.length === 0) return

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        const next = (focusedIndex + 1) % buttons.length
        setFocusedIndex(next)
        buttons[next]?.focus()
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const prev = (focusedIndex - 1 + buttons.length) % buttons.length
        setFocusedIndex(prev)
        buttons[prev]?.focus()
      } else if (e.key === 'Escape') {
        if (step === 'select') {
          onClose()
        } else {
          handleBack()
        }
      }
    },
    [focusedIndex, step, onClose]
  )

  if (!open) return null

  return (
    <>
      <div className="dialog-overlay" onClick={onClose} />
      <div className="create-dialog">
        {step === 'select' ? (
          <>
            <div className="create-dialog-header">What do you want to create?</div>
            <div className="create-dialog-options" ref={optionsRef} onKeyDown={handleOptionsKeyDown}>
              <button className="create-dialog-option" onClick={handleWorkspaceClick}>
                <div className="create-dialog-icon workspace">
                  <LayoutGrid size={20} strokeWidth={1.5} />
                </div>
                <div className="create-dialog-text">
                  <span className="create-dialog-title">Workspace</span>
                  <span className="create-dialog-desc">Create a new workspace to organize terminals</span>
                </div>
              </button>
              <button className="create-dialog-option" onClick={handleTerminalClick}>
                <div className="create-dialog-icon terminal">
                  <Terminal size={20} strokeWidth={1.5} />
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
                  <path d="M10 12L6 8L10 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span>Select Terminal Type</span>
            </div>
            <div className="create-dialog-options" ref={optionsRef} onKeyDown={handleOptionsKeyDown}>
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  className="create-dialog-option"
                  onClick={() => handleSelectProfile(profile.id)}
                >
                  <div className="create-dialog-icon">
                    <TerminalIcon icon={profile.icon} size={20} />
                  </div>
                  <div className="create-dialog-text">
                    <span className="create-dialog-title">{profile.name}</span>
                    <span className="create-dialog-desc">{profile.shell}</span>
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
                  <path d="M10 12L6 8L10 4" strokeLinecap="round" strokeLinejoin="round" />
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
                onKeyDown={handleInputKeyDown}
                autoFocus
              />
              <button className="create-dialog-submit" onClick={handleCreateWorkspace}>
                Create Workspace
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
