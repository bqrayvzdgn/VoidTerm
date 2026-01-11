import React, { memo, useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../../../store/settingsStore'
import { useToastStore } from '../../../store/toastStore'
import { useTranslation } from '../../../i18n'
import type { Profile, KeyboardShortcuts, Settings as SettingsType } from '../../../types'
import { DEFAULT_SETTINGS } from '../../../types'

interface BackupInfo {
  filename: string
  timestamp: number
  date: string
  size: number
}

/**
 * Yedekleme ve geri yükleme ayarları bölümü.
 * Tüm ayarları veya sadece profilleri dışa/içe aktarma imkanı sunar.
 */
export const BackupSettings: React.FC = memo(() => {
  const { t } = useTranslation()
  const { settings, profiles, updateSettings, addProfile, updateProfile, loadFromConfig } = useSettingsStore()
  const toast = useToastStore()
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [loadingBackups, setLoadingBackups] = useState(true)

  // Load backups on mount
  const loadBackups = useCallback(async () => {
    try {
      setLoadingBackups(true)
      const backupList = await window.electronAPI.config.backup.list()
      setBackups(backupList)
    } catch (error) {
      console.error('Failed to load backups:', error)
    } finally {
      setLoadingBackups(false)
    }
  }, [])

  useEffect(() => {
    loadBackups()
  }, [loadBackups])

  // Create a backup manually
  const handleCreateBackup = async () => {
    try {
      await window.electronAPI.config.backup.create()
      toast.success(t.settings.backup.backupCreated)
      loadBackups()
    } catch (error) {
      console.error('Failed to create backup:', error)
      toast.error(t.settings.backup.restoreError)
    }
  }

  // Restore a backup
  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(t.settings.backup.restoreConfirm)) return

    try {
      const success = await window.electronAPI.config.backup.restore(filename)
      if (success) {
        toast.success(t.settings.backup.restoreSuccess)
        // Reload settings from config
        await loadFromConfig()
        loadBackups()
      } else {
        toast.error(t.settings.backup.restoreError)
      }
    } catch (error) {
      console.error('Failed to restore backup:', error)
      toast.error(t.settings.backup.restoreError)
    }
  }

  // Delete a backup
  const handleDeleteBackup = async (filename: string) => {
    try {
      await window.electronAPI.config.backup.delete(filename)
      loadBackups()
    } catch (error) {
      console.error('Failed to delete backup:', error)
    }
  }

  // Format date for display
  const formatBackupDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // Format file size for display
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  /**
   * Tüm ayarları JSON olarak dışa aktarır
   */
  const handleExportSettings = () => {
    const exportData = {
      settings,
      profiles,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
    downloadJSON(exportData, `voidterm-settings-${getDateString()}.json`)
  }

  /**
   * Sadece profilleri JSON olarak dışa aktarır
   */
  const handleExportProfiles = () => {
    const exportData = {
      profiles,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      type: 'profiles'
    }
    downloadJSON(exportData, `voidterm-profiles-${getDateString()}.json`)
  }

  /**
   * JSON dosyasını indirir
   */
  const downloadJSON = (data: object, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Tarih string'i oluşturur (YYYY-MM-DD formatında)
   */
  const getDateString = () => new Date().toISOString().split('T')[0]

  /**
   * Profili doğrular ve geçerli bir Profile nesnesine dönüştürür
   */
  const validateProfile = (profile: unknown): Profile | null => {
    if (typeof profile !== 'object' || !profile) return null
    const p = profile as Record<string, unknown>
    
    if (typeof p.id !== 'string' || !p.id) return null
    if (typeof p.name !== 'string' || !p.name) return null
    if (typeof p.shell !== 'string' || !p.shell) return null

    const validProfile: Profile = {
      id: p.id,
      name: p.name,
      shell: p.shell
    }

    if (Array.isArray(p.args) && p.args.every((a: unknown) => typeof a === 'string')) {
      validProfile.args = p.args as string[]
    }
    if (typeof p.icon === 'string') validProfile.icon = p.icon
    if (typeof p.color === 'string') validProfile.color = p.color
    if (typeof p.cwd === 'string') validProfile.cwd = p.cwd
    if (typeof p.startupCommand === 'string') validProfile.startupCommand = p.startupCommand
    if (p.env && typeof p.env === 'object') {
      const validEnv: Record<string, string> = {}
      for (const [key, value] of Object.entries(p.env as Record<string, unknown>)) {
        if (typeof value === 'string') validEnv[key] = value
      }
      if (Object.keys(validEnv).length > 0) validProfile.env = validEnv
    }

    return validProfile
  }

  /**
   * Profilleri içe aktarır ve store'a kaydeder
   */
  const importProfiles = (profilesData: unknown[]): number => {
    let importedCount = 0
    
    for (const profile of profilesData) {
      const validProfile = validateProfile(profile)
      if (!validProfile) continue

      const existing = profiles.find(p => p.id === validProfile.id)
      if (existing) {
        updateProfile(validProfile.id, validProfile)
      } else {
        addProfile(validProfile)
      }
      importedCount++
    }
    
    return importedCount
  }

  /**
   * Tüm ayarları JSON dosyasından içe aktarır
   */
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

        if (typeof data !== 'object' || data === null) {
          throw new Error('Invalid format: expected object')
        }

        // Ayarları içe aktar
        if (data.settings) {
          if (typeof data.settings !== 'object') {
            throw new Error('Invalid settings format')
          }
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

          // Kısayolları içe aktar
          if (data.settings.shortcuts && typeof data.settings.shortcuts === 'object') {
            const validShortcuts: Partial<KeyboardShortcuts> = {}
            const shortcutKeys: (keyof KeyboardShortcuts)[] = [
              'newTab', 'closeTab', 'closePane', 'splitVertical', 'splitHorizontal',
              'toggleSidebar', 'openSettings', 'nextTab', 'prevTab',
              'focusLeft', 'focusRight', 'focusUp', 'focusDown',
              'toggleSearch', 'clearTerminal', 'copyText', 'pasteText',
              'openCommandPalette', 'openSSHManager'
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

        // Profilleri içe aktar
        if (data.profiles && Array.isArray(data.profiles)) {
          importProfiles(data.profiles)
        }

        toast.success(t.settings.backup.importSuccess)
      } catch (error) {
        console.error('Import error:', error)
        toast.error(t.settings.backup.importError)
      }
    }
    input.click()
  }

  /**
   * Sadece profilleri JSON dosyasından içe aktarır
   */
  const handleImportProfiles = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        if (typeof data !== 'object' || data === null) {
          throw new Error('Invalid format: expected object')
        }

        if (!data.profiles || !Array.isArray(data.profiles)) {
          throw new Error('Invalid format: profiles array not found')
        }

        const importedCount = importProfiles(data.profiles)
        toast.success(`${importedCount} ${t.settings.backup.profileImportCount}`)
      } catch (error) {
        console.error('Profile import error:', error)
        toast.error(t.settings.backup.importError)
      }
    }
    input.click()
  }

  /**
   * Tüm ayarları varsayılana sıfırlar
   */
  const handleResetSettings = () => {
    if (confirm(t.settings.backup.resetConfirm)) {
      updateSettings(DEFAULT_SETTINGS)
    }
  }

  return (
    <div className="settings-panel">
      <h3 className="settings-panel-title">{t.settings.backup.title}</h3>

      <div className="settings-group">
        {/* Tüm Ayarları Dışa Aktar */}
        <div className="backup-section">
          <h4 className="settings-subheading">{t.settings.backup.exportTitle}</h4>
          <p className="settings-description">{t.settings.backup.exportDescription}</p>
          <button className="btn btn-primary" onClick={handleExportSettings}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 2v8M4 7l3 3 3-3M2 11h10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.settings.backup.exportButton}
          </button>
        </div>

        {/* Tüm Ayarları İçe Aktar */}
        <div className="backup-section">
          <h4 className="settings-subheading">{t.settings.backup.importTitle}</h4>
          <p className="settings-description">{t.settings.backup.importDescription}</p>
          <button className="btn btn-secondary" onClick={handleImportSettings}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 10V2M4 5l3-3 3 3M2 11h10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.settings.backup.importButton}
          </button>
        </div>

        {/* Sadece Profilleri Dışa Aktar */}
        <div className="backup-section">
          <h4 className="settings-subheading">{t.settings.backup.exportProfilesTitle}</h4>
          <p className="settings-description">{t.settings.backup.exportProfilesDescription}</p>
          <button className="btn btn-primary" onClick={handleExportProfiles}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="4" r="2.5" />
              <path d="M3 12c0-2.5 1.5-4 4-4s4 1.5 4 4" strokeLinecap="round" />
            </svg>
            {t.settings.backup.exportProfilesButton}
          </button>
        </div>

        {/* Sadece Profilleri İçe Aktar */}
        <div className="backup-section">
          <h4 className="settings-subheading">{t.settings.backup.importProfilesTitle}</h4>
          <p className="settings-description">{t.settings.backup.importProfilesDescription}</p>
          <button className="btn btn-secondary" onClick={handleImportProfiles}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="4" r="2.5" />
              <path d="M3 12c0-2.5 1.5-4 4-4s4 1.5 4 4" strokeLinecap="round" />
              <path d="M11 7v3M9.5 8.5h3" strokeLinecap="round" />
            </svg>
            {t.settings.backup.importProfilesButton}
          </button>
        </div>

        {/* Sıfırla */}
        <div className="backup-section">
          <h4 className="settings-subheading">{t.settings.backup.resetTitle}</h4>
          <p className="settings-description">{t.settings.backup.resetDescription}</p>
          <button className="btn btn-danger" onClick={handleResetSettings}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 7a5 5 0 1 1 1 3M2 12V7h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.settings.backup.resetButton}
          </button>
        </div>

        {/* Otomatik Yedekler */}
        <div className="backup-section">
          <h4 className="settings-subheading">{t.settings.backup.autoBackupsTitle}</h4>
          <p className="settings-description">{t.settings.backup.autoBackupsDescription}</p>

          <button className="btn btn-secondary" onClick={handleCreateBackup} style={{ marginBottom: '12px' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 3v8M3 7h8" strokeLinecap="round" />
            </svg>
            {t.settings.backup.createBackup}
          </button>

          {loadingBackups ? (
            <div className="backup-loading">Loading...</div>
          ) : backups.length === 0 ? (
            <div className="backup-empty">{t.settings.backup.noBackups}</div>
          ) : (
            <div className="backup-list">
              {backups.map((backup) => (
                <div key={backup.filename} className="backup-item">
                  <div className="backup-item-info">
                    <span className="backup-item-date">{formatBackupDate(backup.timestamp)}</span>
                    <span className="backup-item-size">{formatSize(backup.size)}</span>
                  </div>
                  <div className="backup-item-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleRestoreBackup(backup.filename)}
                      title={t.settings.backup.restoreBackup}
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 7a5 5 0 1 1 1 3M2 12V7h5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t.settings.backup.restoreBackup}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteBackup(backup.filename)}
                      title={t.settings.backup.deleteBackup}
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 4h8M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M6 7v4M8 7v4M4 4l.5 7.5a1 1 0 0 0 1 .5h3a1 1 0 0 0 1-.5L10 4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

BackupSettings.displayName = 'BackupSettings'
