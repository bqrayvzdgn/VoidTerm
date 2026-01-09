import React, { useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { getThemeNames } from '../../themes'
import { TerminalIcon } from '../Icons/TerminalIcons'
import type { Profile, KeyboardShortcuts, Settings as SettingsType } from '../../types'
import { DEFAULT_SETTINGS, DEFAULT_SHORTCUTS } from '../../types'
import { v4 as uuidv4 } from 'uuid'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

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

type SettingsTab = 'appearance' | 'terminal' | 'shortcuts' | 'profiles' | 'backup' | 'about'

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { settings, profiles, updateSettings, setTheme, addProfile, updateProfile, removeProfile } = useSettingsStore()
  const [editingProfile, setEditingProfile] = useState<EditingProfile | null>(null)
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')
  const [editingShortcut, setEditingShortcut] = useState<keyof KeyboardShortcuts | null>(null)

  if (!isOpen) return null

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
      alert('En az bir profil olmalı!')
      return
    }
    removeProfile(profileId)
  }

  const handleCancelEdit = () => {
    setEditingProfile(null)
  }

  const handleShortcutKeyDown = (e: React.KeyboardEvent, key: keyof KeyboardShortcuts) => {
    e.preventDefault()
    const parts: string[] = []
    if (e.ctrlKey) parts.push('Ctrl')
    if (e.shiftKey) parts.push('Shift')
    if (e.altKey) parts.push('Alt')
    if (e.metaKey) parts.push('Meta')

    if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
      const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key
      parts.push(keyName)

      const newShortcut = parts.join('+')
      updateSettings({
        shortcuts: {
          ...settings.shortcuts,
          [key]: newShortcut
        }
      })
      setEditingShortcut(null)
    }
  }

  const handleExportSettings = () => {
    const exportData = {
      settings,
      profiles,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voidterm-settings-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        // Validate top-level structure
        if (typeof data !== 'object' || data === null) {
          throw new Error('Invalid format: expected object')
        }

        // Validate and import settings
        if (data.settings) {
          if (typeof data.settings !== 'object') {
            throw new Error('Invalid settings format')
          }
          // Only update known settings fields with correct types
          const validSettings: Partial<SettingsType> = {}

          if (typeof data.settings.theme === 'string') validSettings.theme = data.settings.theme
          if (typeof data.settings.fontFamily === 'string') validSettings.fontFamily = data.settings.fontFamily
          if (typeof data.settings.fontSize === 'number') validSettings.fontSize = data.settings.fontSize
          if (typeof data.settings.lineHeight === 'number') validSettings.lineHeight = data.settings.lineHeight
          if (typeof data.settings.letterSpacing === 'number') validSettings.letterSpacing = data.settings.letterSpacing
          if (['block', 'underline', 'bar'].includes(data.settings.cursorStyle)) validSettings.cursorStyle = data.settings.cursorStyle
          if (typeof data.settings.cursorBlink === 'boolean') validSettings.cursorBlink = data.settings.cursorBlink
          if (typeof data.settings.scrollback === 'number') validSettings.scrollback = data.settings.scrollback
          if (typeof data.settings.copyOnSelect === 'boolean') validSettings.copyOnSelect = data.settings.copyOnSelect
          if (typeof data.settings.bellSound === 'boolean') validSettings.bellSound = data.settings.bellSound
          if (typeof data.settings.defaultProfile === 'string') validSettings.defaultProfile = data.settings.defaultProfile
          if (typeof data.settings.opacity === 'number') validSettings.opacity = data.settings.opacity
          if (typeof data.settings.blur === 'boolean') validSettings.blur = data.settings.blur
          if (typeof data.settings.backgroundImage === 'string') validSettings.backgroundImage = data.settings.backgroundImage

          // Validate shortcuts
          if (data.settings.shortcuts && typeof data.settings.shortcuts === 'object') {
            const validShortcuts: Partial<KeyboardShortcuts> = {}
            const shortcutKeys: (keyof KeyboardShortcuts)[] = [
              'newTab', 'closeTab', 'splitVertical', 'splitHorizontal',
              'toggleSidebar', 'openSettings', 'nextTab', 'prevTab'
            ]
            for (const key of shortcutKeys) {
              if (typeof data.settings.shortcuts[key] === 'string') {
                validShortcuts[key] = data.settings.shortcuts[key]
              }
            }
            if (Object.keys(validShortcuts).length > 0) {
              validSettings.shortcuts = { ...settings.shortcuts, ...validShortcuts }
            }
          }

          updateSettings(validSettings)
        }

        // Validate and import profiles
        if (data.profiles && Array.isArray(data.profiles)) {
          const validProfiles: Profile[] = []

          for (const profile of data.profiles) {
            if (typeof profile !== 'object' || !profile) continue

            // Required fields
            if (typeof profile.id !== 'string' || !profile.id) continue
            if (typeof profile.name !== 'string' || !profile.name) continue
            if (typeof profile.shell !== 'string' || !profile.shell) continue

            const validProfile: Profile = {
              id: profile.id,
              name: profile.name,
              shell: profile.shell
            }

            // Optional fields
            if (Array.isArray(profile.args) && profile.args.every((a: unknown) => typeof a === 'string')) {
              validProfile.args = profile.args
            }
            if (typeof profile.icon === 'string') validProfile.icon = profile.icon
            if (typeof profile.color === 'string') validProfile.color = profile.color
            if (typeof profile.cwd === 'string') validProfile.cwd = profile.cwd
            if (typeof profile.startupCommand === 'string') validProfile.startupCommand = profile.startupCommand
            if (profile.env && typeof profile.env === 'object') {
              const validEnv: Record<string, string> = {}
              for (const [key, value] of Object.entries(profile.env)) {
                if (typeof value === 'string') validEnv[key] = value
              }
              if (Object.keys(validEnv).length > 0) validProfile.env = validEnv
            }

            validProfiles.push(validProfile)
          }

          for (const profile of validProfiles) {
            const existing = profiles.find(p => p.id === profile.id)
            if (existing) {
              updateProfile(profile.id, profile)
            } else {
              addProfile(profile)
            }
          }
        }

        alert('Ayarlar başarıyla içe aktarıldı!')
      } catch (error) {
        console.error('Import error:', error)
        alert(`Dosya okunamadı: ${error instanceof Error ? error.message : 'Geçerli bir JSON dosyası olduğundan emin olun.'}`)
      }
    }
    input.click()
  }

  const handleResetSettings = () => {
    if (confirm('Tüm ayarlar varsayılana sıfırlanacak. Devam etmek istiyor musunuz?')) {
      updateSettings(DEFAULT_SETTINGS)
    }
  }

  const handleResetShortcuts = () => {
    if (confirm('Klavye kısayolları varsayılana sıfırlanacak. Devam etmek istiyor musunuz?')) {
      updateSettings({ shortcuts: DEFAULT_SHORTCUTS })
    }
  }

  const shortcutLabels: Record<keyof KeyboardShortcuts, string> = {
    newTab: 'Yeni Sekme',
    closeTab: 'Sekmeyi Kapat',
    splitVertical: 'Dikey Böl',
    splitHorizontal: 'Yatay Böl',
    toggleSidebar: 'Kenar Çubuğu',
    openSettings: 'Ayarlar',
    nextTab: 'Sonraki Sekme',
    prevTab: 'Önceki Sekme'
  }

  const tabs: { id: SettingsTab; label: string; icon: JSX.Element }[] = [
    {
      id: 'appearance',
      label: 'Görünüm',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 2v12M2 8h12" strokeOpacity="0.5" />
        </svg>
      )
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="12" height="12" rx="2" />
          <path d="M5 6l2 2-2 2M8 10h3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'shortcuts',
      label: 'Kısayollar',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="4" width="14" height="9" rx="1" />
          <path d="M4 7h1M7 7h2M11 7h1M3 10h10" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: 'profiles',
      label: 'Profiller',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="5" r="3" />
          <path d="M3 14c0-3 2-5 5-5s5 2 5 5" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: 'backup',
      label: 'Yedekleme',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 2v8M5 7l3 3 3-3M3 12h10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'about',
      label: 'Hakkında',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 7v4M8 5v.5" strokeLinecap="round" />
        </svg>
      )
    }
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="settings-layout">
          {/* Sidebar */}
          <div className="settings-sidebar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="settings-content">
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="settings-panel">
                <h3 className="settings-panel-title">Görünüm Ayarları</h3>

                <div className="settings-group">
                  <div className="settings-item">
                    <span className="settings-label">Tema</span>
                    <select
                      className="settings-select"
                      value={settings.theme}
                      onChange={(e) => setTheme(e.target.value)}
                    >
                      {getThemeNames().map((name) => (
                        <option key={name} value={name}>
                          {name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="settings-item">
                    <span className="settings-label">Yazı Tipi</span>
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.fontFamily}
                      onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                    />
                  </div>

                  <div className="settings-item">
                    <span className="settings-label">Yazı Boyutu</span>
                    <input
                      type="number"
                      className="settings-input"
                      value={settings.fontSize}
                      min={8}
                      max={32}
                      onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) || 14 })}
                    />
                  </div>

                  <div className="settings-item">
                    <span className="settings-label">Satır Yüksekliği</span>
                    <input
                      type="number"
                      className="settings-input"
                      value={settings.lineHeight}
                      min={1}
                      max={3}
                      step={0.1}
                      onChange={(e) => updateSettings({ lineHeight: parseFloat(e.target.value) || 1.2 })}
                    />
                  </div>

                  <div className="settings-item">
                    <span className="settings-label">Harf Aralığı</span>
                    <input
                      type="number"
                      className="settings-input"
                      value={settings.letterSpacing}
                      min={-2}
                      max={5}
                      step={0.5}
                      onChange={(e) => updateSettings({ letterSpacing: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="settings-item">
                    <span className="settings-label">İmleç Stili</span>
                    <select
                      className="settings-select"
                      value={settings.cursorStyle}
                      onChange={(e) => updateSettings({ cursorStyle: e.target.value as 'block' | 'underline' | 'bar' })}
                    >
                      <option value="block">Block</option>
                      <option value="underline">Underline</option>
                      <option value="bar">Bar</option>
                    </select>
                  </div>

                  <div className="settings-item">
                    <span className="settings-label">İmleç Yanıp Sönsün</span>
                    <input
                      type="checkbox"
                      checked={settings.cursorBlink}
                      onChange={(e) => updateSettings({ cursorBlink: e.target.checked })}
                    />
                  </div>
                </div>

                <div className="settings-group">
                  <h4 className="settings-subheading">Pencere Efektleri</h4>

                  <div className="settings-item">
                    <span className="settings-label">Saydamlık</span>
                    <div className="settings-slider-wrapper">
                      <input
                        type="range"
                        className="settings-slider"
                        value={settings.opacity}
                        min={0.5}
                        max={1}
                        step={0.05}
                        onChange={(e) => updateSettings({ opacity: parseFloat(e.target.value) })}
                      />
                      <span className="settings-slider-value">{Math.round(settings.opacity * 100)}%</span>
                    </div>
                  </div>

                  <div className="settings-item">
                    <span className="settings-label">Bulanıklık Efekti</span>
                    <input
                      type="checkbox"
                      checked={settings.blur}
                      onChange={(e) => updateSettings({ blur: e.target.checked })}
                    />
                  </div>

                  <div className="settings-item">
                    <span className="settings-label">Arkaplan Resmi</span>
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.backgroundImage}
                      onChange={(e) => updateSettings({ backgroundImage: e.target.value })}
                      placeholder="Dosya yolu veya URL"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Terminal Tab */}
            {activeTab === 'terminal' && (
              <div className="settings-panel">
                <h3 className="settings-panel-title">Terminal Ayarları</h3>

                <div className="settings-group">
                  <div className="settings-item">
                    <span className="settings-label">Varsayılan Profil</span>
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
                    <span className="settings-label">Kaydırma Geçmişi</span>
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
                    <span className="settings-label">Seçince Kopyala</span>
                    <input
                      type="checkbox"
                      checked={settings.copyOnSelect}
                      onChange={(e) => updateSettings({ copyOnSelect: e.target.checked })}
                    />
                  </div>

                  <div className="settings-item">
                    <span className="settings-label">Bip Sesi</span>
                    <input
                      type="checkbox"
                      checked={settings.bellSound}
                      onChange={(e) => updateSettings({ bellSound: e.target.checked })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Shortcuts Tab */}
            {activeTab === 'shortcuts' && (
              <div className="settings-panel">
                <h3 className="settings-panel-title">Klavye Kısayolları</h3>

                <div className="settings-group">
                  {(Object.keys(settings.shortcuts) as (keyof KeyboardShortcuts)[]).map((key) => (
                    <div key={key} className="settings-item shortcut-item">
                      <span className="settings-label">{shortcutLabels[key]}</span>
                      <div className="shortcut-input-wrapper">
                        {editingShortcut === key ? (
                          <input
                            type="text"
                            className="shortcut-input editing"
                            placeholder="Tuş kombinasyonu..."
                            onKeyDown={(e) => handleShortcutKeyDown(e, key)}
                            onBlur={() => setEditingShortcut(null)}
                            autoFocus
                            readOnly
                          />
                        ) : (
                          <button
                            className="shortcut-display"
                            onClick={() => setEditingShortcut(key)}
                          >
                            {settings.shortcuts[key]}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="settings-actions">
                  <button className="btn btn-secondary" onClick={handleResetShortcuts}>
                    Varsayılana Sıfırla
                  </button>
                </div>
              </div>
            )}

            {/* Profiles Tab */}
            {activeTab === 'profiles' && (
              <div className="settings-panel">
                <div className="settings-panel-header">
                  <h3 className="settings-panel-title">Profil Yönetimi</h3>
                  {!editingProfile && (
                    <button className="profile-add-btn" onClick={handleNewProfile}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      Yeni Profil
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
                        <label>Ad</label>
                        <input
                          type="text"
                          value={editingProfile.name}
                          onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                          placeholder="Profil adı"
                        />
                      </div>

                      <div className="profile-edit-row">
                        <label>Simge</label>
                        <input
                          type="text"
                          value={editingProfile.icon}
                          onChange={(e) => setEditingProfile({ ...editingProfile, icon: e.target.value.toUpperCase().slice(0, 4) })}
                          placeholder="Simge (max 4 karakter)"
                          maxLength={4}
                        />
                      </div>

                      <div className="profile-edit-row">
                        <label>Renk</label>
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
                        <label>Kabuk</label>
                        <input
                          type="text"
                          value={editingProfile.shell}
                          onChange={(e) => setEditingProfile({ ...editingProfile, shell: e.target.value })}
                          placeholder="örn: cmd.exe, powershell.exe"
                        />
                      </div>

                      <div className="profile-edit-row">
                        <label>Argümanlar</label>
                        <input
                          type="text"
                          value={editingProfile.args}
                          onChange={(e) => setEditingProfile({ ...editingProfile, args: e.target.value })}
                          placeholder="örn: /k claude"
                        />
                      </div>

                      <div className="profile-edit-row">
                        <label>Çalışma Dizini</label>
                        <input
                          type="text"
                          value={editingProfile.cwd}
                          onChange={(e) => setEditingProfile({ ...editingProfile, cwd: e.target.value })}
                          placeholder="örn: C:\Users\user\projects"
                        />
                      </div>

                      <div className="profile-edit-row">
                        <label>Ortam Değişkenleri</label>
                        <textarea
                          value={editingProfile.env}
                          onChange={(e) => setEditingProfile({ ...editingProfile, env: e.target.value })}
                          placeholder="KEY=value (her satırda bir tane)"
                          rows={3}
                        />
                      </div>

                      <div className="profile-edit-row">
                        <label>Başlangıç Komutu</label>
                        <input
                          type="text"
                          value={editingProfile.startupCommand}
                          onChange={(e) => setEditingProfile({ ...editingProfile, startupCommand: e.target.value })}
                          placeholder="örn: cls && echo Welcome!"
                        />
                      </div>
                    </div>

                    <div className="profile-edit-actions">
                      <button className="btn btn-secondary" onClick={handleCancelEdit}>
                        İptal
                      </button>
                      <button className="btn btn-primary" onClick={handleSaveProfile}>
                        {editingProfile.isNew ? 'Profil Ekle' : 'Kaydet'}
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
                            title="Düzenle"
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M11.5 1.5l3 3L5 14H2v-3l9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="profile-action-btn delete"
                            onClick={() => handleDeleteProfile(profile.id)}
                            title="Sil"
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
            )}

            {/* Backup Tab */}
            {activeTab === 'backup' && (
              <div className="settings-panel">
                <h3 className="settings-panel-title">Yedekleme ve Geri Yükleme</h3>

                <div className="settings-group">
                  <div className="backup-section">
                    <h4 className="settings-subheading">Dışa Aktar</h4>
                    <p className="settings-description">
                      Tüm ayarlarınızı ve profil yapılandırmalarınızı JSON dosyası olarak dışa aktarın.
                    </p>
                    <button className="btn btn-primary" onClick={handleExportSettings}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M7 2v8M4 7l3 3 3-3M2 11h10" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Ayarları Dışa Aktar
                    </button>
                  </div>

                  <div className="backup-section">
                    <h4 className="settings-subheading">İçe Aktar</h4>
                    <p className="settings-description">
                      Daha önce dışa aktarılmış ayarları geri yükleyin.
                    </p>
                    <button className="btn btn-secondary" onClick={handleImportSettings}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M7 10V2M4 5l3-3 3 3M2 11h10" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Ayarları İçe Aktar
                    </button>
                  </div>

                  <div className="backup-section">
                    <h4 className="settings-subheading">Sıfırla</h4>
                    <p className="settings-description">
                      Tüm ayarları varsayılan değerlere döndürün.
                    </p>
                    <button className="btn btn-danger" onClick={handleResetSettings}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 7a5 5 0 1 1 1 3M2 12V7h5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Varsayılana Sıfırla
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="settings-panel">
                <h3 className="settings-panel-title">Hakkında</h3>

                <div className="about-content">
                  <div className="about-logo">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                      <rect x="4" y="4" width="56" height="56" rx="12" stroke="currentColor" strokeWidth="2" />
                      <path d="M16 24l8 8-8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M28 40h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>

                  <h2 className="about-title">VoidTerm</h2>
                  <p className="about-version">Versiyon 1.0.0</p>

                  <p className="about-description">
                    Modern, hızlı ve özelleştirilebilir bir terminal emülatörü.
                    Electron, React ve xterm.js ile oluşturuldu.
                  </p>

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
                      GitHub
                    </a>
                  </div>

                  <div className="about-credits">
                    <p>Electron {window.electronAPI?.versions?.electron || 'N/A'}</p>
                    <p>Node.js {window.electronAPI?.versions?.node || 'N/A'}</p>
                    <p>Chrome {window.electronAPI?.versions?.chrome || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
