import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSettingsStore } from './settingsStore'
import { DEFAULT_SETTINGS } from '../types'
import { themes } from '../themes'

// Mock profiles for testing
const mockProfiles = [
  { id: 'default', name: 'Default', shell: 'cmd.exe' },
  { id: 'powershell', name: 'PowerShell', shell: 'powershell.exe' }
]

// Helper to reset store between tests
const resetStore = () => {
  useSettingsStore.setState({
    settings: DEFAULT_SETTINGS,
    profiles: [],
    currentTheme: themes['catppuccin-mocha'],
    isLoaded: false
  })
}

// Helper to reset mocks
const resetMocks = () => {
  vi.mocked(window.electronAPI.config.getSettings).mockResolvedValue(DEFAULT_SETTINGS)
  vi.mocked(window.electronAPI.config.getProfiles).mockResolvedValue(mockProfiles)
  vi.mocked(window.electronAPI.config.updateSettings).mockImplementation(
    (updates) => Promise.resolve({ ...DEFAULT_SETTINGS, ...updates })
  )
  vi.mocked(window.electronAPI.config.resetSettings).mockResolvedValue(DEFAULT_SETTINGS)
  vi.mocked(window.electronAPI.config.addProfile).mockImplementation(
    (profile) => Promise.resolve([...mockProfiles, profile])
  )
  vi.mocked(window.electronAPI.config.updateProfile).mockImplementation(
    (id, updates) => Promise.resolve(mockProfiles.map(p => p.id === id ? { ...p, ...updates } : p))
  )
  vi.mocked(window.electronAPI.config.removeProfile).mockImplementation(
    (id) => Promise.resolve(mockProfiles.filter(p => p.id !== id))
  )
}

describe('settingsStore', () => {
  beforeEach(() => {
    resetStore()
    resetMocks()
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have default settings', () => {
      const state = useSettingsStore.getState()
      expect(state.settings).toEqual(DEFAULT_SETTINGS)
      expect(state.isLoaded).toBe(false)
    })

    it('should have default theme as catppuccin-mocha', () => {
      const state = useSettingsStore.getState()
      expect(state.currentTheme.name).toBe('Catppuccin Mocha')
    })

    it('should have empty profiles initially', () => {
      const state = useSettingsStore.getState()
      expect(state.profiles).toEqual([])
    })
  })

  describe('loadFromConfig', () => {
    it('should load settings and profiles from config', async () => {
      const store = useSettingsStore.getState()
      await store.loadFromConfig()

      const state = useSettingsStore.getState()
      expect(state.settings).toEqual(DEFAULT_SETTINGS)
      expect(state.profiles).toEqual(mockProfiles)
      expect(state.isLoaded).toBe(true)
    })

    it('should set theme based on settings', async () => {
      const customSettings = { ...DEFAULT_SETTINGS, theme: 'dracula' }
      vi.mocked(window.electronAPI.config.getSettings).mockResolvedValue(customSettings)

      const store = useSettingsStore.getState()
      await store.loadFromConfig()

      const state = useSettingsStore.getState()
      expect(state.currentTheme.name).toBe('Dracula')
    })

    it('should fallback to catppuccin-mocha for unknown theme', async () => {
      const customSettings = { ...DEFAULT_SETTINGS, theme: 'unknown-theme' }
      vi.mocked(window.electronAPI.config.getSettings).mockResolvedValue(customSettings)

      const store = useSettingsStore.getState()
      await store.loadFromConfig()

      const state = useSettingsStore.getState()
      expect(state.currentTheme.name).toBe('Catppuccin Mocha')
    })

    it('should handle errors gracefully and set isLoaded to true', async () => {
      vi.mocked(window.electronAPI.config.getSettings).mockRejectedValue(new Error('Config error'))

      const store = useSettingsStore.getState()
      await store.loadFromConfig()

      const state = useSettingsStore.getState()
      expect(state.isLoaded).toBe(true)
    })
  })

  describe('updateSettings', () => {
    it('should update settings', async () => {
      const store = useSettingsStore.getState()
      await store.updateSettings({ fontSize: 16, cursorBlink: false })

      const state = useSettingsStore.getState()
      expect(state.settings.fontSize).toBe(16)
      expect(state.settings.cursorBlink).toBe(false)
    })

    it('should update theme when theme setting changes', async () => {
      const store = useSettingsStore.getState()
      await store.updateSettings({ theme: 'nord' })

      const state = useSettingsStore.getState()
      expect(state.currentTheme.name).toBe('Nord')
    })

    it('should handle errors silently', async () => {
      vi.mocked(window.electronAPI.config.updateSettings).mockRejectedValue(new Error('Update failed'))

      const store = useSettingsStore.getState()
      const originalSettings = { ...store.settings }

      // Should not throw
      await store.updateSettings({ fontSize: 20 })

      // Settings should remain unchanged
      const state = useSettingsStore.getState()
      expect(state.settings).toEqual(originalSettings)
    })
  })

  describe('resetSettings', () => {
    it('should reset settings to defaults', async () => {
      // First update settings
      useSettingsStore.setState({
        settings: { ...DEFAULT_SETTINGS, fontSize: 20, theme: 'dracula' }
      })

      const store = useSettingsStore.getState()
      await store.resetSettings()

      const state = useSettingsStore.getState()
      expect(state.settings).toEqual(DEFAULT_SETTINGS)
    })

    it('should reset theme to default', async () => {
      useSettingsStore.setState({
        currentTheme: themes['dracula']
      })

      const store = useSettingsStore.getState()
      await store.resetSettings()

      const state = useSettingsStore.getState()
      expect(state.currentTheme.name).toBe('Catppuccin Mocha')
    })
  })

  describe('setTheme', () => {
    it('should set theme by name', () => {
      const store = useSettingsStore.getState()
      store.setTheme('tokyo-night')

      const state = useSettingsStore.getState()
      expect(state.currentTheme.name).toBe('Tokyo Night')
    })

    it('should call updateSettings with new theme', async () => {
      const store = useSettingsStore.getState()
      store.setTheme('nord')

      expect(window.electronAPI.config.updateSettings).toHaveBeenCalledWith({ theme: 'nord' })
    })

    it('should not change theme for invalid theme name', () => {
      const store = useSettingsStore.getState()
      const originalTheme = store.currentTheme

      store.setTheme('non-existent-theme')

      const state = useSettingsStore.getState()
      expect(state.currentTheme).toBe(originalTheme)
    })
  })

  describe('getTheme', () => {
    it('should return current theme', () => {
      const store = useSettingsStore.getState()
      const theme = store.getTheme()

      expect(theme).toBe(store.currentTheme)
    })
  })

  describe('Profile Management', () => {
    describe('addProfile', () => {
      it('should add a new profile', async () => {
        const newProfile = { id: 'git-bash', name: 'Git Bash', shell: 'bash.exe' }

        const store = useSettingsStore.getState()
        await store.addProfile(newProfile)

        const state = useSettingsStore.getState()
        expect(state.profiles).toContainEqual(newProfile)
      })

      it('should call config API with new profile', async () => {
        const newProfile = { id: 'wsl', name: 'WSL', shell: 'wsl.exe' }

        const store = useSettingsStore.getState()
        await store.addProfile(newProfile)

        expect(window.electronAPI.config.addProfile).toHaveBeenCalledWith(newProfile)
      })
    })

    describe('updateProfile', () => {
      it('should update an existing profile', async () => {
        // Set initial profiles
        useSettingsStore.setState({ profiles: [...mockProfiles] })

        const store = useSettingsStore.getState()
        await store.updateProfile('default', { name: 'Updated Default' })

        expect(window.electronAPI.config.updateProfile).toHaveBeenCalledWith(
          'default',
          { name: 'Updated Default' }
        )
      })
    })

    describe('removeProfile', () => {
      it('should remove a profile', async () => {
        // Set initial profiles
        useSettingsStore.setState({ profiles: [...mockProfiles] })

        const store = useSettingsStore.getState()
        await store.removeProfile('powershell')

        const state = useSettingsStore.getState()
        expect(state.profiles.find(p => p.id === 'powershell')).toBeUndefined()
      })

      it('should call config API with profile id', async () => {
        const store = useSettingsStore.getState()
        await store.removeProfile('default')

        expect(window.electronAPI.config.removeProfile).toHaveBeenCalledWith('default')
      })
    })

    describe('getProfile', () => {
      it('should return profile by id', () => {
        useSettingsStore.setState({ profiles: [...mockProfiles] })

        const store = useSettingsStore.getState()
        const profile = store.getProfile('default')

        expect(profile?.name).toBe('Default')
      })

      it('should return undefined for non-existent profile', () => {
        useSettingsStore.setState({ profiles: [...mockProfiles] })

        const store = useSettingsStore.getState()
        const profile = store.getProfile('non-existent')

        expect(profile).toBeUndefined()
      })
    })
  })

  describe('Theme Validation', () => {
    it('should have all expected themes available', () => {
      const expectedThemes = [
        'catppuccin-mocha',
        'dracula',
        'one-dark',
        'tokyo-night',
        'nord',
        'github-dark',
        'windows-terminal',
        'gruvbox-dark',
        'solarized-dark',
        'monokai',
        'material'
      ]

      expectedThemes.forEach(themeName => {
        expect(themes[themeName]).toBeDefined()
        expect(themes[themeName].name).toBeTruthy()
        expect(themes[themeName].colors).toBeDefined()
      })
    })

    it('should have all required color properties in each theme', () => {
      const requiredColors = [
        'background', 'foreground', 'cursor', 'cursorAccent', 'selection',
        'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
        'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
        'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite'
      ]

      Object.values(themes).forEach(theme => {
        requiredColors.forEach(colorName => {
          expect(theme.colors[colorName as keyof typeof theme.colors]).toBeDefined()
        })
      })
    })
  })
})
