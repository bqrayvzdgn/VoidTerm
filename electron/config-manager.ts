import Store from 'electron-store'
import { app } from 'electron'
import path from 'path'

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
  splitVertical: string
  splitHorizontal: string
  toggleSidebar: string
  openSettings: string
  nextTab: string
  prevTab: string
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
  backgroundImage: string
  shortcuts: KeyboardShortcuts
}

export interface Workspace {
  id: string
  name: string
  icon: string
  color: string
  isActive: boolean
}

export interface AppConfig {
  settings: Settings
  profiles: Profile[]
  workspaces: Workspace[]
  version: number
}

// Default configuration
const DEFAULT_SHORTCUTS: KeyboardShortcuts = {
  newTab: 'Ctrl+T',
  closeTab: 'Ctrl+W',
  splitVertical: 'Ctrl+Shift+D',
  splitHorizontal: 'Ctrl+Shift+E',
  toggleSidebar: 'Ctrl+B',
  openSettings: 'Ctrl+,',
  nextTab: 'Ctrl+Tab',
  prevTab: 'Ctrl+Shift+Tab'
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'catppuccin-mocha',
  fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace",
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
  backgroundImage: '',
  shortcuts: DEFAULT_SHORTCUTS
}

// Platform-specific default profiles
function getDefaultProfiles(): Profile[] {
  const homedir = app.getPath('home')
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

// Create store instance
const store = new Store<AppConfig>({
  name: 'config',
  defaults: DEFAULT_CONFIG,
  clearInvalidConfig: true,
  migrations: {
    // Add migrations here for future config updates
    '1.0.0': (store) => {
      // Initial migration - ensure all fields exist
      const config = store.store
      if (!config.settings) store.set('settings', DEFAULT_SETTINGS)
      if (!config.profiles) store.set('profiles', getDefaultProfiles())
      if (!config.workspaces) store.set('workspaces', DEFAULT_WORKSPACES)
    }
  }
})

// Config Manager class
export class ConfigManager {
  // Get entire config
  getConfig(): AppConfig {
    return store.store
  }

  // Get settings
  getSettings(): Settings {
    return store.get('settings', DEFAULT_SETTINGS)
  }

  // Update settings (partial update)
  updateSettings(updates: Partial<Settings>): Settings {
    const current = this.getSettings()
    const updated = { ...current, ...updates }
    store.set('settings', updated)
    return updated
  }

  // Reset settings to defaults
  resetSettings(): Settings {
    store.set('settings', DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
  }

  // Get profiles
  getProfiles(): Profile[] {
    return store.get('profiles', getDefaultProfiles())
  }

  // Add profile
  addProfile(profile: Profile): Profile[] {
    const profiles = this.getProfiles()
    profiles.push(profile)
    store.set('profiles', profiles)
    return profiles
  }

  // Update profile
  updateProfile(id: string, updates: Partial<Profile>): Profile[] {
    const profiles = this.getProfiles()
    const index = profiles.findIndex(p => p.id === id)
    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...updates }
      store.set('profiles', profiles)
    }
    return profiles
  }

  // Remove profile
  removeProfile(id: string): Profile[] {
    const profiles = this.getProfiles().filter(p => p.id !== id)
    store.set('profiles', profiles)
    return profiles
  }

  // Get workspaces
  getWorkspaces(): Workspace[] {
    return store.get('workspaces', DEFAULT_WORKSPACES)
  }

  // Add workspace
  addWorkspace(workspace: Workspace): Workspace[] {
    const workspaces = this.getWorkspaces()
    workspaces.push(workspace)
    store.set('workspaces', workspaces)
    return workspaces
  }

  // Update workspace
  updateWorkspace(id: string, updates: Partial<Workspace>): Workspace[] {
    const workspaces = this.getWorkspaces()
    const index = workspaces.findIndex(w => w.id === id)
    if (index !== -1) {
      workspaces[index] = { ...workspaces[index], ...updates }
      store.set('workspaces', workspaces)
    }
    return workspaces
  }

  // Remove workspace
  removeWorkspace(id: string): Workspace[] {
    const workspaces = this.getWorkspaces().filter(w => w.id !== id)
    store.set('workspaces', workspaces)
    return workspaces
  }

  // Reset entire config to defaults
  resetConfig(): AppConfig {
    store.clear()
    store.set(DEFAULT_CONFIG)
    return DEFAULT_CONFIG
  }

  // Get config file path (for showing to user)
  getConfigPath(): string {
    return store.path
  }

  // Export config as JSON string
  exportConfig(): string {
    return JSON.stringify(store.store, null, 2)
  }

  // Import config from JSON string
  importConfig(jsonString: string): AppConfig {
    try {
      const config = JSON.parse(jsonString) as Partial<AppConfig>

      // Validate and merge with defaults
      if (config.settings) {
        const validSettings = { ...DEFAULT_SETTINGS, ...config.settings }
        store.set('settings', validSettings)
      }
      if (config.profiles && Array.isArray(config.profiles)) {
        store.set('profiles', config.profiles)
      }
      if (config.workspaces && Array.isArray(config.workspaces)) {
        store.set('workspaces', config.workspaces)
      }

      return this.getConfig()
    } catch (error) {
      throw new Error(`Invalid config JSON: ${error}`)
    }
  }
}

export const configManager = new ConfigManager()
