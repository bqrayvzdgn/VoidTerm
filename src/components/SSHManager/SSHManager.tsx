import React, { useState, useEffect, useCallback } from 'react'
import type { SSHConnection } from '../../types'

interface SSHManagerProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (connection: SSHConnection) => void
}

const DEFAULT_SSH_CONNECTION: Partial<SSHConnection> = {
  port: 22,
  authMethod: 'key',
  icon: 'SSH'
}

export const SSHManager: React.FC<SSHManagerProps> = ({
  isOpen,
  onClose,
  onConnect
}) => {
  const [connections, setConnections] = useState<SSHConnection[]>([])
  const [editingConnection, setEditingConnection] = useState<Partial<SSHConnection> | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Load saved connections from electron-store
  useEffect(() => {
    if (isOpen) {
      window.electronAPI.config.getSSHConnections()
        .then(setConnections)
        .catch((error: Error) => {
          console.error('Failed to load SSH connections:', error)
        })
    }
  }, [isOpen])

  const handleAddNew = useCallback(() => {
    setEditingConnection({ ...DEFAULT_SSH_CONNECTION, id: crypto.randomUUID() })
    setIsEditing(true)
  }, [])

  const handleEdit = useCallback((connection: SSHConnection) => {
    setEditingConnection({ ...connection })
    setIsEditing(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    try {
      const newConnections = await window.electronAPI.config.removeSSHConnection(id)
      setConnections(newConnections)
    } catch (error) {
      console.error('Failed to delete SSH connection:', error)
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (!editingConnection?.name || !editingConnection?.host || !editingConnection?.username) {
      return
    }

    const connection: SSHConnection = {
      id: editingConnection.id || crypto.randomUUID(),
      name: editingConnection.name,
      host: editingConnection.host,
      port: editingConnection.port || 22,
      username: editingConnection.username,
      authMethod: editingConnection.authMethod || 'key',
      privateKeyPath: editingConnection.privateKeyPath,
      jumpHost: editingConnection.jumpHost,
      color: editingConnection.color,
      icon: editingConnection.icon || 'SSH'
    }

    try {
      const existingIndex = connections.findIndex(c => c.id === connection.id)
      let newConnections: SSHConnection[]

      if (existingIndex >= 0) {
        newConnections = await window.electronAPI.config.updateSSHConnection(connection.id, connection)
      } else {
        newConnections = await window.electronAPI.config.addSSHConnection(connection)
      }

      setConnections(newConnections)
      setIsEditing(false)
      setEditingConnection(null)
    } catch (error) {
      console.error('Failed to save SSH connection:', error)
    }
  }, [editingConnection, connections])

  const handleConnect = useCallback(async (connection: SSHConnection) => {
    // Update last connected time
    try {
      const newConnections = await window.electronAPI.config.updateSSHConnection(connection.id, {
        lastConnected: new Date().toISOString()
      })
      setConnections(newConnections)
    } catch (error) {
      console.error('Failed to update last connected time:', error)
    }

    onConnect(connection)
    onClose()
  }, [onConnect, onClose])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setEditingConnection(null)
  }, [])

  if (!isOpen) return null

  return (
    <>
      <div className="ssh-manager-overlay" onClick={onClose} />
      <div className="ssh-manager">
        <div className="ssh-manager-header">
          <h2>SSH Connections</h2>
          <button className="ssh-manager-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {isEditing ? (
          <div className="ssh-manager-form">
            <div className="ssh-form-group">
              <label>Name</label>
              <input
                type="text"
                value={editingConnection?.name || ''}
                onChange={(e) => setEditingConnection(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Server"
              />
            </div>
            <div className="ssh-form-row">
              <div className="ssh-form-group">
                <label>Host</label>
                <input
                  type="text"
                  value={editingConnection?.host || ''}
                  onChange={(e) => setEditingConnection(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="192.168.1.1 or hostname.com"
                />
              </div>
              <div className="ssh-form-group ssh-form-port">
                <label>Port</label>
                <input
                  type="number"
                  value={editingConnection?.port || 22}
                  onChange={(e) => setEditingConnection(prev => ({ ...prev, port: parseInt(e.target.value) || 22 }))}
                />
              </div>
            </div>
            <div className="ssh-form-group">
              <label>Username</label>
              <input
                type="text"
                value={editingConnection?.username || ''}
                onChange={(e) => setEditingConnection(prev => ({ ...prev, username: e.target.value }))}
                placeholder="root"
              />
            </div>
            <div className="ssh-form-group">
              <label>Authentication</label>
              <select
                value={editingConnection?.authMethod || 'key'}
                onChange={(e) => setEditingConnection(prev => ({ 
                  ...prev, 
                  authMethod: e.target.value as 'password' | 'key' | 'agent' 
                }))}
              >
                <option value="key">Private Key</option>
                <option value="agent">SSH Agent</option>
                <option value="password">Password (not recommended)</option>
              </select>
            </div>
            {editingConnection?.authMethod === 'key' && (
              <div className="ssh-form-group">
                <label>Private Key Path</label>
                <input
                  type="text"
                  value={editingConnection?.privateKeyPath || ''}
                  onChange={(e) => setEditingConnection(prev => ({ ...prev, privateKeyPath: e.target.value }))}
                  placeholder="~/.ssh/id_rsa"
                />
              </div>
            )}
            <div className="ssh-form-group">
              <label>Jump Host (optional)</label>
              <input
                type="text"
                value={editingConnection?.jumpHost || ''}
                onChange={(e) => setEditingConnection(prev => ({ ...prev, jumpHost: e.target.value }))}
                placeholder="user@jumphost.com"
              />
            </div>
            <div className="ssh-form-actions">
              <button className="ssh-btn ssh-btn-secondary" onClick={handleCancel}>Cancel</button>
              <button className="ssh-btn ssh-btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        ) : (
          <>
            <div className="ssh-manager-list">
              {connections.length === 0 ? (
                <div className="ssh-manager-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                  <p>No SSH connections saved</p>
                  <span>Click "Add Connection" to create one</span>
                </div>
              ) : (
                connections.map((connection) => (
                  <div key={connection.id} className="ssh-connection-item">
                    <div className="ssh-connection-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                      </svg>
                    </div>
                    <div className="ssh-connection-info">
                      <span className="ssh-connection-name">{connection.name}</span>
                      <span className="ssh-connection-details">
                        {connection.username}@{connection.host}:{connection.port}
                      </span>
                    </div>
                    <div className="ssh-connection-actions">
                      <button
                        className="ssh-action-btn"
                        onClick={() => handleConnect(connection)}
                        title="Connect"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </button>
                      <button
                        className="ssh-action-btn"
                        onClick={() => handleEdit(connection)}
                        title="Edit"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="ssh-action-btn ssh-action-delete"
                        onClick={() => handleDelete(connection.id)}
                        title="Delete"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="ssh-manager-footer">
              <button className="ssh-btn ssh-btn-primary" onClick={handleAddNew}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Add Connection
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
