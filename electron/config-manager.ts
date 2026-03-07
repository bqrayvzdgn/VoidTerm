import Store from 'electron-store'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { createLogger } from './logger'

const logger = createLogger('ConfigManager')

// Config schema types
export interface Profile {
  id: string
  name: string
  shell: string
  args?: string[]
  icon?: string
  color?: string
  cwd?: string
  env?: Record<string, string>
  startupCommand?: string
}

export interface KeyboardShortcuts {
  newTab: string
  closeTab: string
  closePane: string
  splitVertical: string
  splitHorizontal: string
  focusLeft: string
  focusRight: string
  focusUp: string
  focusDown: string
  toggleSidebar: string
  openSettings: string
  openCommandPalette: string
  nextTab: string
  prevTab: string
  toggleSearch: string
  clearTerminal: string
  copyText: string
  pasteText: string
  openSnippets: string
}

export interface Settings {
  theme: string
  fontFamily: string
  fontSize: number
  lineHeight: number
  letterSpacing: number
  cursorStyle: 'block' | 'underline' | 'bar'
  cursorBlink: boolean
  scrollback: number
  copyOnSelect: boolean
  bellSound: boolean
  defaultProfile: string
  opacity: number
  blur: boolean
  enableImages: boolean
  enableClipboard: boolean
  shellIntegration: boolean
  shortcuts: KeyboardShortcuts
}

export interface Workspace {
  id: string
  name: string
  icon: string
  color: string
  isActive: boolean
}

export interface SessionTab {
  id: string
  profileId: string
  workspaceId?: string
  title: string
}

export interface Session {
  tabs: SessionTab[]
  activeTabId: string | null
  activeWorkspaceId?: string
}

export interface AppConfig {
  settings: Settings
  profiles: Profile[]
  workspaces: Workspace[]
  session?: Session
  version: number
}

export interface BackupInfo {
  filename: string
  timestamp: number
  date: string
  size: number
}

// Default configuration
const DEFAULT_SHORTCUTS: KeyboardShortcuts = {
  newTab: 'Ctrl+T',
  closeTab: 'Ctrl+W',
  closePane: 'Ctrl+Shift+W',
  splitVertical: 'Ctrl+Shift+D',
  splitHorizontal: 'Ctrl+Shift+E',
  focusLeft: 'Ctrl+Alt+Left',
  focusRight: 'Ctrl+Alt+Right',
  focusUp: 'Ctrl+Alt+Up',
  focusDown: 'Ctrl+Alt+Down',
  toggleSidebar: 'Ctrl+Shift+B',
  openSettings: 'Ctrl+,',
  openCommandPalette: 'Ctrl+Shift+P',
  nextTab: 'Ctrl+Tab',
  prevTab: 'Ctrl+Shift+Tab',
  toggleSearch: 'Ctrl+F',
  clearTerminal: 'Ctrl+L',
  copyText: 'Ctrl+Shift+C',
  pasteText: 'Ctrl+Shift+V',
  openSnippets: 'Ctrl+Shift+N'
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  fontFamily: "'Cascadia Code', monospace",
  fontSize: 14,
  lineHeight: 1.2,
  letterSpacing: 0,
  cursorStyle: 'block',
  cursorBlink: true,
  scrollback: 10000,
  copyOnSelect: false,
  bellSound: false,
  defaultProfile: 'powershell',
  opacity: 1,
  blur: false,
  enableImages: true,
  enableClipboard: true,
  shellIntegration: true,
  shortcuts: DEFAULT_SHORTCUTS
}

// Platform-specific default profiles
function getDefaultProfiles(): Profile[] {
  const homedir = os.homedir()
  const platform = process.platform

  if (platform === 'win32') {
    return [
      {
        id: 'powershell',
        name: 'PowerShell',
        shell: 'powershell.exe',
        icon: 'PS',
        color: '#012456',
        cwd: homedir
      },
      {
        id: 'cmd',
        name: 'Command Prompt',
        shell: 'cmd.exe',
        icon: 'CMD',
        color: '#0C0C0C',
        cwd: homedir
      },
      {
        id: 'gitbash',
        name: 'Git Bash',
        shell: 'C:\\Program Files\\Git\\bin\\bash.exe',
        args: ['--login', '-i'],
        icon: 'GIT',
        color: '#f14e32',
        cwd: homedir
      },
      {
        id: 'wsl',
        name: 'WSL',
        shell: 'wsl.exe',
        icon: 'WSL',
        color: '#e95420',
        cwd: '~'
      }
    ]
  } else if (platform === 'darwin') {
    return [
      {
        id: 'zsh',
        name: 'Zsh',
        shell: '/bin/zsh',
        icon: 'ZSH',
        color: '#4EAA25',
        cwd: homedir
      },
      {
        id: 'bash',
        name: 'Bash',
        shell: '/bin/bash',
        icon: 'BASH',
        color: '#3E474A',
        cwd: homedir
      }
    ]
  } else {
    // Linux
    return [
      {
        id: 'bash',
        name: 'Bash',
        shell: '/bin/bash',
        icon: 'BASH',
        color: '#3E474A',
        cwd: homedir
      },
      {
        id: 'zsh',
        name: 'Zsh',
        shell: '/usr/bin/zsh',
        icon: 'ZSH',
        color: '#4EAA25',
        cwd: homedir
      },
      {
        id: 'fish',
        name: 'Fish',
        shell: '/usr/bin/fish',
        icon: 'FISH',
        color: '#54a7d8',
        cwd: homedir
      }
    ]
  }
}

const DEFAULT_WORKSPACES: Workspace[] = []

const DEFAULT_CONFIG: AppConfig = {
  settings: DEFAULT_SETTINGS,
  profiles: getDefaultProfiles(),
  workspaces: DEFAULT_WORKSPACES,
  version: 1
}

// Backup configuration
const MAX_BACKUPS = 5
const BACKUP_PREFIX = 'config.backup.'
const BACKUP_FILENAME_REGEX = /^config\.backup\.\d+\.json$/

function isValidBackupFilename(filename: string): boolean {
  return (
    BACKUP_FILENAME_REGEX.test(filename) &&
    !filename.includes('..') &&
    !filename.includes('/') &&
    !filename.includes('\\')
  )
}

// Create store instance
const store = new Store<AppConfig>({
  name: 'config',
  defaults: DEFAULT_CONFIG,
  clearInvalidConfig: true,
  migrations: {
    '1.0.0': (store) => {
      const config = store.store
      if (!config.settings) store.set('settings', DEFAULT_SETTINGS)
      if (!config.profiles) store.set('profiles', getDefaultProfiles())
      if (!config.workspaces) store.set('workspaces', DEFAULT_WORKSPACES)
    }
  }
})

// Get the config directory
function getConfigDir(): string {
  return path.dirname(store.path)
}

// Config Manager class
export class ConfigManager {
  getConfig(): AppConfig {
    return store.store
  }

  getSettings(): Settings {
    return store.get('settings', DEFAULT_SETTINGS)
  }

  updateSettings(updates: Partial<Settings>): Settings {
    const current = this.getSettings()
    const updated = { ...current, ...updates }
    store.set('settings', updated)
    return updated
  }

  resetSettings(): Settings {
    store.set('settings', DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
  }

  getProfiles(): Profile[] {
    return store.get('profiles', getDefaultProfiles())
  }

  addProfile(profile: Profile): Profile[] {
    const profiles = this.getProfiles()
    profiles.push(profile)
    store.set('profiles', profiles)
    return profiles
  }

  updateProfile(id: string, updates: Partial<Profile>): Profile[] {
    const profiles = this.getProfiles()
    const index = profiles.findIndex((p) => p.id === id)
    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...updates }
      store.set('profiles', profiles)
    }
    return profiles
  }

  removeProfile(id: string): Profile[] {
    const profiles = this.getProfiles().filter((p) => p.id !== id)
    store.set('profiles', profiles)
    return profiles
  }

  getWorkspaces(): Workspace[] {
    return store.get('workspaces', DEFAULT_WORKSPACES)
  }

  addWorkspace(workspace: Workspace): Workspace[] {
    const workspaces = this.getWorkspaces()
    workspaces.push(workspace)
    store.set('workspaces', workspaces)
    return workspaces
  }

  updateWorkspace(id: string, updates: Partial<Workspace>): Workspace[] {
    const workspaces = this.getWorkspaces()
    const index = workspaces.findIndex((w) => w.id === id)
    if (index !== -1) {
      workspaces[index] = { ...workspaces[index], ...updates }
      store.set('workspaces', workspaces)
    }
    return workspaces
  }

  removeWorkspace(id: string): Workspace[] {
    const workspaces = this.getWorkspaces().filter((w) => w.id !== id)
    store.set('workspaces', workspaces)
    return workspaces
  }

  resetConfig(): AppConfig {
    store.clear()
    store.set(DEFAULT_CONFIG)
    return DEFAULT_CONFIG
  }

  getConfigPath(): string {
    return store.path
  }

  // Session management
  getSession(): Session | undefined {
    return store.get('session')
  }

  saveSession(session: Session): void {
    store.set('session', session)
  }

  clearSession(): void {
    store.delete('session')
  }

  // Backup methods
  createBackup(): string {
    const timestamp = Date.now()
    const filename = `${BACKUP_PREFIX}${timestamp}.json`
    const backupPath = path.join(getConfigDir(), filename)

    try {
      const config = this.getConfig()
      fs.writeFileSync(backupPath, JSON.stringify(config, null, 2), 'utf-8')
      this.cleanupOldBackups()
      logger.info(`Backup created: ${filename}`)
      return filename
    } catch (error) {
      logger.error('Failed to create backup:', error)
      throw error
    }
  }

  listBackups(): BackupInfo[] {
    const configDir = getConfigDir()

    try {
      const files = fs.readdirSync(configDir)
      const backups: BackupInfo[] = []

      for (const file of files) {
        if (file.startsWith(BACKUP_PREFIX) && file.endsWith('.json')) {
          const filePath = path.join(configDir, file)
          const stats = fs.statSync(filePath)
          const timestampStr = file.replace(BACKUP_PREFIX, '').replace('.json', '')
          const timestamp = parseInt(timestampStr, 10)

          if (!isNaN(timestamp)) {
            backups.push({
              filename: file,
              timestamp,
              date: new Date(timestamp).toISOString(),
              size: stats.size
            })
          }
        }
      }

      return backups.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      logger.error('Failed to list backups:', error)
      return []
    }
  }

  restoreBackup(filename: string): boolean {
    if (!isValidBackupFilename(filename)) {
      logger.error('Invalid backup filename:', filename)
      return false
    }

    const backupPath = path.join(getConfigDir(), filename)

    try {
      if (!fs.existsSync(backupPath)) {
        logger.error('Backup file not found:', filename)
        return false
      }

      try {
        this.createBackup()
      } catch {
        // Continue even if backup fails
      }

      const backupContent = fs.readFileSync(backupPath, 'utf-8')
      const backupConfig = JSON.parse(backupContent) as AppConfig

      if (backupConfig.settings) {
        store.set('settings', { ...DEFAULT_SETTINGS, ...backupConfig.settings })
      }
      if (backupConfig.profiles && Array.isArray(backupConfig.profiles)) {
        store.set('profiles', backupConfig.profiles)
      }
      if (backupConfig.workspaces && Array.isArray(backupConfig.workspaces)) {
        store.set('workspaces', backupConfig.workspaces)
      }

      logger.info(`Config restored from: ${filename}`)
      return true
    } catch (error) {
      logger.error('Failed to restore backup:', error)
      return false
    }
  }

  deleteBackup(filename: string): boolean {
    if (!isValidBackupFilename(filename)) {
      logger.error('Invalid backup filename:', filename)
      return false
    }

    const backupPath = path.join(getConfigDir(), filename)

    try {
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath)
        logger.debug(`Backup deleted: ${filename}`)
        return true
      }
      return false
    } catch (error) {
      logger.error('Failed to delete backup:', error)
      return false
    }
  }

  private cleanupOldBackups(): void {
    const backups = this.listBackups()

    if (backups.length > MAX_BACKUPS) {
      const toDelete = backups.slice(MAX_BACKUPS)
      for (const backup of toDelete) {
        this.deleteBackup(backup.filename)
      }
    }
  }

  validateConfig(): boolean {
    try {
      const config = this.getConfig()
      if (!config.settings || typeof config.settings !== 'object') return false
      if (!config.profiles || !Array.isArray(config.profiles)) return false
      if (!config.workspaces || !Array.isArray(config.workspaces)) return false

      const requiredSettingsFields = ['theme', 'fontFamily', 'fontSize', 'cursorStyle']
      for (const field of requiredSettingsFields) {
        if (!(field in config.settings)) return false
      }

      return true
    } catch {
      return false
    }
  }

  exportConfig(): string {
    return JSON.stringify(store.store, null, 2)
  }

  importConfig(jsonString: string): AppConfig {
    try {
      const config = JSON.parse(jsonString) as Partial<AppConfig>

      if (config.settings) {
        const s = config.settings
        if (s.fontSize !== undefined && (typeof s.fontSize !== 'number' || s.fontSize < 6 || s.fontSize > 72)) {
          throw new Error('Invalid fontSize: must be a number between 6 and 72')
        }
        if (
          s.lineHeight !== undefined &&
          (typeof s.lineHeight !== 'number' || s.lineHeight < 0.5 || s.lineHeight > 3)
        ) {
          throw new Error('Invalid lineHeight: must be a number between 0.5 and 3')
        }
        if (
          s.letterSpacing !== undefined &&
          (typeof s.letterSpacing !== 'number' || s.letterSpacing < -5 || s.letterSpacing > 10)
        ) {
          throw new Error('Invalid letterSpacing: must be a number between -5 and 10')
        }
        if (
          s.scrollback !== undefined &&
          (typeof s.scrollback !== 'number' || s.scrollback < 0 || s.scrollback > 100000)
        ) {
          throw new Error('Invalid scrollback: must be a number between 0 and 100000')
        }
        if (s.opacity !== undefined && (typeof s.opacity !== 'number' || s.opacity < 0.3 || s.opacity > 1)) {
          throw new Error('Invalid opacity: must be a number between 0.3 and 1')
        }
        if (s.cursorStyle !== undefined && !['block', 'underline', 'bar'].includes(s.cursorStyle)) {
          throw new Error('Invalid cursorStyle: must be block, underline, or bar')
        }
        if (s.theme !== undefined && typeof s.theme !== 'string') {
          throw new Error('Invalid theme: must be a string')
        }
        if (s.fontFamily !== undefined && typeof s.fontFamily !== 'string') {
          throw new Error('Invalid fontFamily: must be a string')
        }
        const validSettings = { ...DEFAULT_SETTINGS, ...s }
        store.set('settings', validSettings)
      }

      if (config.profiles && Array.isArray(config.profiles)) {
        const shellMetachars = /[;&|`$(){}[\]<>!]/

        for (const profile of config.profiles) {
          if (!profile.id || typeof profile.id !== 'string') throw new Error('Invalid profile: missing or invalid id')
          if (!profile.name || typeof profile.name !== 'string')
            throw new Error('Invalid profile: missing or invalid name')
          if (!profile.shell || typeof profile.shell !== 'string')
            throw new Error('Invalid profile: missing or invalid shell')

          const shellLower = profile.shell.toLowerCase()
          const isKnownShell = [
            'powershell.exe',
            'pwsh.exe',
            'cmd.exe',
            'bash.exe',
            'wsl.exe',
            '/bin/bash',
            '/bin/zsh',
            '/bin/sh',
            '/usr/bin/zsh',
            '/usr/bin/fish',
            '/usr/bin/bash',
            '/usr/local/bin/bash',
            '/usr/local/bin/zsh',
            '/usr/local/bin/fish'
          ].some((known) => shellLower === known || shellLower.endsWith(path.sep + known))
          if (!isKnownShell && !path.isAbsolute(profile.shell)) {
            throw new Error(`Invalid profile shell: "${profile.shell}" must be an absolute path or a known shell`)
          }

          if (profile.startupCommand && typeof profile.startupCommand === 'string') {
            if (shellMetachars.test(profile.startupCommand)) {
              throw new Error(`Invalid profile startupCommand: contains shell metacharacters`)
            }
          }
        }
        store.set('profiles', config.profiles)
      }

      if (config.workspaces && Array.isArray(config.workspaces)) {
        for (const workspace of config.workspaces) {
          if (!workspace.id || typeof workspace.id !== 'string')
            throw new Error('Invalid workspace: missing or invalid id')
          if (!workspace.name || typeof workspace.name !== 'string')
            throw new Error('Invalid workspace: missing or invalid name')
        }
        store.set('workspaces', config.workspaces)
      }

      return this.getConfig()
    } catch (error) {
      throw new Error(`Invalid config JSON: ${error}`)
    }
  }
}

export const configManager = new ConfigManager()
