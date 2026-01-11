import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { Theme } from '../types'
import { themes as builtInThemes } from '../themes'

interface CustomTheme extends Theme {
  id: string
  isCustom: true
}

interface CustomThemeStore {
  customThemes: CustomTheme[]
  
  // Actions
  addCustomTheme: (theme: Omit<CustomTheme, 'id' | 'isCustom'>) => string
  removeCustomTheme: (id: string) => void
  updateCustomTheme: (id: string, updates: Partial<Theme>) => void
  importTheme: (json: string) => { success: boolean; error?: string; themeId?: string }
  exportTheme: (id: string) => string | null
  getTheme: (nameOrId: string) => Theme | undefined
  getAllThemes: () => Record<string, Theme>
  loadFromStorage: () => void
  saveToStorage: () => void
}

const STORAGE_KEY = 'voidterm-custom-themes'

// Validate theme structure
function isValidTheme(obj: unknown): obj is Theme {
  if (typeof obj !== 'object' || obj === null) return false
  
  const theme = obj as Record<string, unknown>
  if (typeof theme.name !== 'string') return false
  if (typeof theme.colors !== 'object' || theme.colors === null) return false
  
  const requiredColors = [
    'background', 'foreground', 'cursor', 'cursorAccent', 'selection',
    'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
    'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
    'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite'
  ]
  
  const colors = theme.colors as Record<string, unknown>
  for (const color of requiredColors) {
    if (typeof colors[color] !== 'string') return false
    // Basic hex color validation
    if (!/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(colors[color] as string)) return false
  }
  
  return true
}

// Generate a unique ID for custom themes
function generateThemeId(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `custom-${slug}-${Date.now().toString(36)}`
}

export const useCustomThemeStore = create<CustomThemeStore>()((set, get) => ({
  customThemes: [],

  addCustomTheme: (themeData) => {
    const id = generateThemeId(themeData.name)
    const customTheme: CustomTheme = {
      ...themeData,
      id,
      isCustom: true
    }

    set((state) => ({
      customThemes: [...state.customThemes, customTheme]
    }))

    get().saveToStorage()
    return id
  },

  removeCustomTheme: (id) => {
    set((state) => ({
      customThemes: state.customThemes.filter(t => t.id !== id)
    }))
    get().saveToStorage()
  },

  updateCustomTheme: (id, updates) => {
    set((state) => ({
      customThemes: state.customThemes.map(t => 
        t.id === id ? { ...t, ...updates } : t
      )
    }))
    get().saveToStorage()
  },

  importTheme: (json) => {
    try {
      const parsed = JSON.parse(json)
      
      // Handle both single theme and array of themes
      const themesToImport = Array.isArray(parsed) ? parsed : [parsed]
      
      const importedIds: string[] = []
      
      for (const theme of themesToImport) {
        if (!isValidTheme(theme)) {
          return { success: false, error: 'Invalid theme format. Ensure all required color properties are present.' }
        }

        // Check for duplicate names in built-in themes
        const existingBuiltIn = Object.values(builtInThemes).find(
          t => t.name.toLowerCase() === theme.name.toLowerCase()
        )
        if (existingBuiltIn) {
          // Append "(Custom)" to avoid confusion
          theme.name = `${theme.name} (Custom)`
        }

        const id = get().addCustomTheme(theme)
        importedIds.push(id)
      }

      return { 
        success: true, 
        themeId: importedIds[0] // Return first imported theme ID
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to parse theme JSON'
      }
    }
  },

  exportTheme: (id) => {
    const theme = get().customThemes.find(t => t.id === id)
    if (!theme) return null

    // Export without internal properties
    const exportTheme = {
      name: theme.name,
      colors: theme.colors
    }

    return JSON.stringify(exportTheme, null, 2)
  },

  getTheme: (nameOrId) => {
    // First check built-in themes
    if (builtInThemes[nameOrId]) {
      return builtInThemes[nameOrId]
    }

    // Then check custom themes by ID
    const customById = get().customThemes.find(t => t.id === nameOrId)
    if (customById) return customById

    // Finally check custom themes by name
    const customByName = get().customThemes.find(
      t => t.name.toLowerCase() === nameOrId.toLowerCase()
    )
    return customByName
  },

  getAllThemes: () => {
    const allThemes: Record<string, Theme> = { ...builtInThemes }
    
    for (const customTheme of get().customThemes) {
      allThemes[customTheme.id] = customTheme
    }

    return allThemes
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const customThemes = JSON.parse(stored) as CustomTheme[]
        set({ customThemes })
      }
    } catch (error) {
      console.error('Failed to load custom themes:', error)
    }
  },

  saveToStorage: () => {
    try {
      const { customThemes } = get()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customThemes))
    } catch (error) {
      console.error('Failed to save custom themes:', error)
    }
  }
}))

// Selectors
export const useCustomThemes = () => useCustomThemeStore(useShallow((state) => state.customThemes))
export const useAllThemes = () => useCustomThemeStore((state) => state.getAllThemes())
export const useCustomThemeActions = () => useCustomThemeStore(useShallow((state) => ({
  addCustomTheme: state.addCustomTheme,
  removeCustomTheme: state.removeCustomTheme,
  updateCustomTheme: state.updateCustomTheme,
  importTheme: state.importTheme,
  exportTheme: state.exportTheme,
  getTheme: state.getTheme,
  loadFromStorage: state.loadFromStorage
})))
