import React, { useState, memo } from 'react'
import { useSettingsStore } from '../../../store/settingsStore'
import { useTranslation } from '../../../i18n'
import { TerminalIcon } from '../../Icons/TerminalIcons'
import type { Profile } from '../../../types'
import { v4 as uuidv4 } from 'uuid'

interface EditingProfile {
  id: string
  name: string
  shell: string
  args: string
  icon: string
  color: string
  cwd: string
  env: string
  startupCommand: string
  isNew?: boolean
}

export const ProfilesSettings: React.FC = memo(() => {
  const { t } = useTranslation()
  const { profiles, addProfile, updateProfile, removeProfile } = useSettingsStore()
  const [editingProfile, setEditingProfile] = useState<EditingProfile | null>(null)

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile({
      id: profile.id,
      name: profile.name,
      shell: profile.shell,
      args: profile.args?.join(' ') || '',
      icon: profile.icon || '',
      color: profile.color || '#666666',
      cwd: profile.cwd || '',
      env: profile.env ? Object.entries(profile.env).map(([k, v]) => `${k}=${v}`).join('\n') : '',
      startupCommand: profile.startupCommand || ''
    })
  }

  const handleNewProfile = () => {
    setEditingProfile({
      id: uuidv4(),
      name: 'New Profile',
      shell: 'cmd.exe',
      args: '',
      icon: 'NEW',
      color: '#666666',
      cwd: '',
      env: '',
      startupCommand: '',
      isNew: true
    })
  }

  const handleSaveProfile = () => {
    if (!editingProfile) return

    const envObj: Record<string, string> = {}
    if (editingProfile.env.trim()) {
      editingProfile.env.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          envObj[key.trim()] = valueParts.join('=').trim()
        }
      })
    }

    const profileData: Profile = {
      id: editingProfile.id,
      name: editingProfile.name,
      shell: editingProfile.shell,
      args: editingProfile.args ? editingProfile.args.split(' ').filter(a => a) : undefined,
      icon: editingProfile.icon,
      color: editingProfile.color,
      cwd: editingProfile.cwd || undefined,
      env: Object.keys(envObj).length > 0 ? envObj : undefined,
      startupCommand: editingProfile.startupCommand || undefined
    }

    if (editingProfile.isNew) {
      addProfile(profileData)
    } else {
      updateProfile(editingProfile.id, profileData)
    }

    setEditingProfile(null)
  }

  const handleDeleteProfile = (profileId: string) => {
    if (profiles.length <= 1) {
      alert(t.settings.profiles.minProfileError)
      return
    }
    removeProfile(profileId)
  }

  const handleCancelEdit = () => {
    setEditingProfile(null)
  }

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <h3 className="settings-panel-title">{t.settings.profiles.title}</h3>
        {!editingProfile && (
          <button className="profile-add-btn" onClick={handleNewProfile}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {t.settings.profiles.newProfile}
          </button>
        )}
      </div>

      {editingProfile ? (
        <div className="profile-edit-form">
          <div className="profile-edit-preview">
            <div className="profile-icon-wrapper large">
              <TerminalIcon icon={editingProfile.icon} size={48} />
            </div>
          </div>

          <div className="profile-edit-fields">
            <div className="profile-edit-row">
              <label>{t.settings.profiles.name}</label>
              <input
                type="text"
                value={editingProfile.name}
                onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                placeholder={t.settings.profiles.namePlaceholder}
              />
            </div>

            <div className="profile-edit-row">
              <label>{t.settings.profiles.icon}</label>
              <input
                type="text"
                value={editingProfile.icon}
                onChange={(e) => setEditingProfile({ ...editingProfile, icon: e.target.value.toUpperCase().slice(0, 4) })}
                placeholder={t.settings.profiles.iconPlaceholder}
                maxLength={4}
              />
            </div>

            <div className="profile-edit-row">
              <label>{t.settings.profiles.color}</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={editingProfile.color}
                  onChange={(e) => setEditingProfile({ ...editingProfile, color: e.target.value })}
                />
                <input
                  type="text"
                  value={editingProfile.color}
                  onChange={(e) => setEditingProfile({ ...editingProfile, color: e.target.value })}
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="profile-edit-row">
              <label>{t.settings.profiles.shell}</label>
              <input
                type="text"
                value={editingProfile.shell}
                onChange={(e) => setEditingProfile({ ...editingProfile, shell: e.target.value })}
                placeholder={t.settings.profiles.shellPlaceholder}
              />
            </div>

            <div className="profile-edit-row">
              <label>{t.settings.profiles.arguments}</label>
              <input
                type="text"
                value={editingProfile.args}
                onChange={(e) => setEditingProfile({ ...editingProfile, args: e.target.value })}
                placeholder={t.settings.profiles.argumentsPlaceholder}
              />
            </div>

            <div className="profile-edit-row">
              <label>{t.settings.profiles.workingDirectory}</label>
              <input
                type="text"
                value={editingProfile.cwd}
                onChange={(e) => setEditingProfile({ ...editingProfile, cwd: e.target.value })}
                placeholder={t.settings.profiles.workingDirectoryPlaceholder}
              />
            </div>

            <div className="profile-edit-row">
              <label>{t.settings.profiles.envVariables}</label>
              <textarea
                value={editingProfile.env}
                onChange={(e) => setEditingProfile({ ...editingProfile, env: e.target.value })}
                placeholder={t.settings.profiles.envVariablesPlaceholder}
                rows={3}
              />
            </div>

            <div className="profile-edit-row">
              <label>{t.settings.profiles.startupCommand}</label>
              <input
                type="text"
                value={editingProfile.startupCommand}
                onChange={(e) => setEditingProfile({ ...editingProfile, startupCommand: e.target.value })}
                placeholder={t.settings.profiles.startupCommandPlaceholder}
              />
            </div>
          </div>

          <div className="profile-edit-actions">
            <button className="btn btn-secondary" onClick={handleCancelEdit}>
              {t.common.cancel}
            </button>
            <button className="btn btn-primary" onClick={handleSaveProfile}>
              {editingProfile.isNew ? t.settings.profiles.addProfile : t.common.save}
            </button>
          </div>
        </div>
      ) : (
        <div className="profile-list">
          {profiles.map((profile) => (
            <div key={profile.id} className="profile-item">
              <div className="profile-icon-wrapper">
                <TerminalIcon icon={profile.icon} size={28} />
              </div>
              <div className="profile-info">
                <div className="profile-name">{profile.name}</div>
                <div className="profile-path">{profile.shell} {profile.args?.join(' ')}</div>
              </div>
              <div className="profile-actions">
                <button
                  className="profile-action-btn"
                  onClick={() => handleEditProfile(profile)}
                  title={t.common.edit}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M11.5 1.5l3 3L5 14H2v-3l9.5-9.5z" />
                  </svg>
                </button>
                <button
                  className="profile-action-btn delete"
                  onClick={() => handleDeleteProfile(profile.id)}
                  title={t.common.delete}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 2V1h5v1h4v1h-1v11H2.5V3h-1V2h4zm1 2v9h1V4h-1zm3 0v9h1V4h-1z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

ProfilesSettings.displayName = 'ProfilesSettings'
