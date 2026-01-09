import React, { useState, useEffect } from 'react'

interface CreateDialogProps {
  open: boolean
  onClose: () => void
  onCreateWorkspace: (name: string) => void
  onCreateTerminal: () => void
}

export const CreateDialog: React.FC<CreateDialogProps> = ({
  open,
  onClose,
  onCreateWorkspace,
  onCreateTerminal
}) => {
  const [step, setStep] = useState<'select' | 'workspace-name'>('select')
  const [workspaceName, setWorkspaceName] = useState('')

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep('select')
      setWorkspaceName('')
    }
  }, [open])

  const handleWorkspaceClick = () => {
    setStep('workspace-name')
  }

  const handleCreateWorkspace = () => {
    onCreateWorkspace(workspaceName.trim() || 'New Workspace')
    setStep('select')
    setWorkspaceName('')
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
              <button className="create-dialog-option" onClick={onCreateTerminal}>
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
