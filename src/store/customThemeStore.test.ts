import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCustomThemeStore } from './customThemeStore'

// Valid test theme
const validThemeColors = {
  background: '#1e1e2e',
  foreground: '#cdd6f4',
  cursor: '#f5e0dc',
  cursorAccent: '#1e1e2e',
  selection: '#45475a',
  black: '#45475a',
  red: '#f38ba8',
  green: '#a6e3a1',
  yellow: '#f9e2af',
  blue: '#89b4fa',
  magenta: '#f5c2e7',
  cyan: '#94e2d5',
  white: '#bac2de',
  brightBlack: '#585b70',
  brightRed: '#f38ba8',
  brightGreen: '#a6e3a1',
  brightYellow: '#f9e2af',
  brightBlue: '#89b4fa',
  brightMagenta: '#f5c2e7',
  brightCyan: '#94e2d5',
  brightWhite: '#a6adc8'
}

describe('customThemeStore', () => {
  beforeEach(() => {
    useCustomThemeStore.setState({ customThemes: [] })
    vi.clearAllMocks()
  })

  describe('addCustomTheme', () => {
    it('should add a custom theme with generated id', () => {
      const store = useCustomThemeStore.getState()
      const id = store.addCustomTheme({
        name: 'My Theme',
        colors: validThemeColors
      })

      expect(id).toBeDefined()
      expect(id).toMatch(/^custom-/)

      const { customThemes } = useCustomThemeStore.getState()
      expect(customThemes).toHaveLength(1)
      expect(customThemes[0].name).toBe('My Theme')
      expect(customThemes[0].isCustom).toBe(true)
    })
  })

  describe('removeCustomTheme', () => {
    it('should remove theme by id', () => {
      const store = useCustomThemeStore.getState()
      const id = store.addCustomTheme({ name: 'Remove Me', colors: validThemeColors })

      expect(useCustomThemeStore.getState().customThemes).toHaveLength(1)

      store.removeCustomTheme(id)

      expect(useCustomThemeStore.getState().customThemes).toHaveLength(0)
    })

    it('should not affect other themes', () => {
      const store = useCustomThemeStore.getState()
      const id1 = store.addCustomTheme({ name: 'Theme 1', colors: validThemeColors })
      const id2 = store.addCustomTheme({ name: 'Theme 2', colors: validThemeColors })

      store.removeCustomTheme(id1)

      const { customThemes } = useCustomThemeStore.getState()
      expect(customThemes).toHaveLength(1)
      expect(customThemes[0].id).toBe(id2)
    })
  })

  describe('updateCustomTheme', () => {
    it('should update theme properties', () => {
      const store = useCustomThemeStore.getState()
      const id = store.addCustomTheme({ name: 'Old Name', colors: validThemeColors })

      store.updateCustomTheme(id, { name: 'New Name' })

      const theme = useCustomThemeStore.getState().customThemes[0]
      expect(theme.name).toBe('New Name')
    })
  })

  describe('importTheme', () => {
    it('should import valid theme JSON', () => {
      const store = useCustomThemeStore.getState()
      const json = JSON.stringify({
        name: 'Imported Theme',
        colors: validThemeColors
      })

      const result = store.importTheme(json)

      expect(result.success).toBe(true)
      expect(result.themeId).toBeDefined()
      expect(useCustomThemeStore.getState().customThemes).toHaveLength(1)
    })

    it('should import array of themes', () => {
      const store = useCustomThemeStore.getState()
      const json = JSON.stringify([
        { name: 'Theme A', colors: validThemeColors },
        { name: 'Theme B', colors: validThemeColors }
      ])

      const result = store.importTheme(json)

      expect(result.success).toBe(true)
      expect(useCustomThemeStore.getState().customThemes).toHaveLength(2)
    })

    it('should reject invalid theme format', () => {
      const store = useCustomThemeStore.getState()
      const result = store.importTheme('{"name": "Bad", "colors": {}}')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject invalid JSON', () => {
      const store = useCustomThemeStore.getState()
      const result = store.importTheme('not-json')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject theme with invalid hex colors', () => {
      const store = useCustomThemeStore.getState()
      const badColors = { ...validThemeColors, background: 'not-a-color' }
      const json = JSON.stringify({ name: 'Bad Colors', colors: badColors })

      const result = store.importTheme(json)

      expect(result.success).toBe(false)
    })
  })

  describe('exportTheme', () => {
    it('should export theme as JSON without internal properties', () => {
      const store = useCustomThemeStore.getState()
      const id = store.addCustomTheme({ name: 'Export Me', colors: validThemeColors })

      const json = store.exportTheme(id)
      expect(json).not.toBeNull()

      const parsed = JSON.parse(json!)
      expect(parsed.name).toBe('Export Me')
      expect(parsed.colors).toBeDefined()
      // Should not include internal properties
      expect(parsed.id).toBeUndefined()
      expect(parsed.isCustom).toBeUndefined()
    })

    it('should return null for non-existent theme', () => {
      const store = useCustomThemeStore.getState()
      expect(store.exportTheme('non-existent')).toBeNull()
    })
  })

  describe('getTheme', () => {
    it('should find custom theme by id', () => {
      const store = useCustomThemeStore.getState()
      const id = store.addCustomTheme({ name: 'Find Me', colors: validThemeColors })

      const theme = store.getTheme(id)
      expect(theme?.name).toBe('Find Me')
    })

    it('should find custom theme by name (case-insensitive)', () => {
      const store = useCustomThemeStore.getState()
      store.addCustomTheme({ name: 'Case Test', colors: validThemeColors })

      expect(store.getTheme('case test')?.name).toBe('Case Test')
      expect(store.getTheme('CASE TEST')?.name).toBe('Case Test')
    })

    it('should return undefined for non-existent theme', () => {
      const store = useCustomThemeStore.getState()
      expect(store.getTheme('does-not-exist')).toBeUndefined()
    })
  })

  describe('getAllThemes', () => {
    it('should include both built-in and custom themes', () => {
      const store = useCustomThemeStore.getState()
      store.addCustomTheme({ name: 'Custom 1', colors: validThemeColors })

      const allThemes = store.getAllThemes()

      // Should contain built-in themes plus custom
      const keys = Object.keys(allThemes)
      expect(keys.length).toBeGreaterThan(1)

      // Should contain our custom theme
      const customTheme = Object.values(allThemes).find(t => t.name === 'Custom 1')
      expect(customTheme).toBeDefined()
    })
  })
})
