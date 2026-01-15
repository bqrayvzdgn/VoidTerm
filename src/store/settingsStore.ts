import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { Settings, Profile, Theme } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { themes } from '../themes'
import { resolveTheme } from '../utils/theme'
import { createLogger } from '../utils/logger'

const logger = createLogger('SettingsStore')

interface SettingsStore {
  settings: Settings
  profiles: Profile[]
  currentTheme: Theme
  isLoaded: boolean

  // Actions
  loadFromConfig: () => Promise<void>
  updateSettings: (settings: Partial<Settings>) => Promise<void>
  resetSettings: () => Promise<void>
  setTheme: (themeName: string) => void
  getTheme: () => Theme

  // Profile actions
  addProfile: (profile: Profile) => Promise<void>
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>
  removeProfile: (id: string) => Promise<void>
  getProfile: (id: string) => Profile | undefined
}

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  settings: DEFAULT_SETTINGS,
  profiles: [],
  currentTheme: themes['catppuccin-mocha'],
  isLoaded: false,

  loadFromConfig: async () => {
    try {
      const [settings, profiles] = await Promise.all([
        window.electronAPI.config.getSettings(),
        window.electronAPI.config.getProfiles()
      ])

      set({
        settings,
        profiles,
        currentTheme: resolveTheme(settings.theme),
        isLoaded: true
      })
    } catch (error) {
      logger.error('Failed to load config:', error)
      set({ isLoaded: true })
    }
  },

  updateSettings: async (updates) => {
    try {
      const newSettings = await window.electronAPI.config.updateSettings(updates)
      set({ settings: newSettings, currentTheme: resolveTheme(newSettings.theme) })
    } catch (error) {
      logger.error('Failed to update settings:', error)
    }
  },

  resetSettings: async () => {
    try {
      const settings = await window.electronAPI.config.resetSettings()
      set({ settings, currentTheme: resolveTheme(settings.theme) })
    } catch (error) {
      logger.error('Failed to reset settings:', error)
    }
  },

  setTheme: (themeName) => {
    const theme = resolveTheme(themeName)
    set({ currentTheme: theme })
    get().updateSettings({ theme: themeName })
  },

  getTheme: () => get().currentTheme,

  addProfile: async (profile) => {
    try {
      const profiles = await window.electronAPI.config.addProfile(profile)
      set({ profiles })
    } catch (error) {
      logger.error('Failed to add profile:', error)
    }
  },

  updateProfile: async (id, updates) => {
    try {
      const profiles = await window.electronAPI.config.updateProfile(id, updates)
      set({ profiles })
    } catch (error) {
      logger.error('Failed to update profile:', error)
    }
  },

  removeProfile: async (id) => {
    try {
      const profiles = await window.electronAPI.config.removeProfile(id)
      set({ profiles })
    } catch (error) {
      logger.error('Failed to remove profile:', error)
    }
  },

  getProfile: (id) => {
    return get().profiles.find(p => p.id === id)
  }
}))

// Selectors for performance optimization
export const useSettings = () => useSettingsStore(useShallow((state) => state.settings))
export const useProfiles = () => useSettingsStore(useShallow((state) => state.profiles))
export const useCurrentTheme = () => useSettingsStore((state) => state.currentTheme)
export const useIsConfigLoaded = () => useSettingsStore((state) => state.isLoaded)
export const useSettingsActions = () => useSettingsStore(useShallow((state) => ({
  loadFromConfig: state.loadFromConfig,
  updateSettings: state.updateSettings,
  resetSettings: state.resetSettings,
  addProfile: state.addProfile,
  updateProfile: state.updateProfile,
  removeProfile: state.removeProfile,
  getProfile: state.getProfile,
  setTheme: state.setTheme,
  getTheme: state.getTheme
})))
