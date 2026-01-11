import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { v4 as uuidv4 } from 'uuid'
import type { Snippet } from '../types'

const STORAGE_KEY = 'voidterm-snippets'

interface SnippetStore {
  snippets: Snippet[]
  categories: string[]
  isLoaded: boolean

  // CRUD işlemleri
  loadSnippets: () => void
  addSnippet: (snippet: Omit<Snippet, 'id' | 'createdAt' | 'usageCount'>) => string
  updateSnippet: (id: string, updates: Partial<Snippet>) => void
  deleteSnippet: (id: string) => void
  
  // Kullanım
  incrementUsage: (id: string) => void
  getSnippetByShortcut: (shortcut: string) => Snippet | undefined
  
  // Kategori işlemleri
  addCategory: (category: string) => void
  removeCategory: (category: string) => void
  
  // Import/Export
  exportSnippets: () => string
  importSnippets: (json: string) => boolean
}

/**
 * localStorage'a kaydet
 */
const saveToStorage = (snippets: Snippet[], categories: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ snippets, categories }))
  } catch (e) {
    console.error('Failed to save snippets:', e)
  }
}

/**
 * localStorage'dan yükle
 */
const loadFromStorage = (): { snippets: Snippet[], categories: string[] } => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      return {
        snippets: Array.isArray(parsed.snippets) ? parsed.snippets : [],
        categories: Array.isArray(parsed.categories) ? parsed.categories : ['General', 'Git', 'Docker', 'SSH']
      }
    }
  } catch (e) {
    console.error('Failed to load snippets:', e)
  }
  return { 
    snippets: [], 
    categories: ['General', 'Git', 'Docker', 'SSH'] 
  }
}

export const useSnippetStore = create<SnippetStore>((set, get) => ({
  snippets: [],
  categories: ['General', 'Git', 'Docker', 'SSH'],
  isLoaded: false,

  loadSnippets: () => {
    const { snippets, categories } = loadFromStorage()
    set({ snippets, categories, isLoaded: true })
  },

  addSnippet: (snippetData) => {
    const id = uuidv4()
    const snippet: Snippet = {
      ...snippetData,
      id,
      createdAt: Date.now(),
      usageCount: 0
    }

    set((state) => {
      const newSnippets = [...state.snippets, snippet]
      saveToStorage(newSnippets, state.categories)
      return { snippets: newSnippets }
    })

    return id
  },

  updateSnippet: (id, updates) => {
    set((state) => {
      const newSnippets = state.snippets.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
      saveToStorage(newSnippets, state.categories)
      return { snippets: newSnippets }
    })
  },

  deleteSnippet: (id) => {
    set((state) => {
      const newSnippets = state.snippets.filter(s => s.id !== id)
      saveToStorage(newSnippets, state.categories)
      return { snippets: newSnippets }
    })
  },

  incrementUsage: (id) => {
    set((state) => {
      const newSnippets = state.snippets.map(s => 
        s.id === id ? { ...s, usageCount: s.usageCount + 1 } : s
      )
      saveToStorage(newSnippets, state.categories)
      return { snippets: newSnippets }
    })
  },

  getSnippetByShortcut: (shortcut) => {
    return get().snippets.find(s => s.shortcut === shortcut)
  },

  addCategory: (category) => {
    set((state) => {
      if (state.categories.includes(category)) return state
      const newCategories = [...state.categories, category]
      saveToStorage(state.snippets, newCategories)
      return { categories: newCategories }
    })
  },

  removeCategory: (category) => {
    set((state) => {
      const newCategories = state.categories.filter(c => c !== category)
      // Kategorisi silinen snippet'ları "General" kategorisine taşı
      const newSnippets = state.snippets.map(s => 
        s.category === category ? { ...s, category: 'General' } : s
      )
      saveToStorage(newSnippets, newCategories)
      return { categories: newCategories, snippets: newSnippets }
    })
  },

  exportSnippets: () => {
    const { snippets, categories } = get()
    return JSON.stringify({ snippets, categories, exportedAt: new Date().toISOString() }, null, 2)
  },

  importSnippets: (json) => {
    try {
      const data = JSON.parse(json)
      if (!data.snippets || !Array.isArray(data.snippets)) {
        return false
      }

      const validSnippets: Snippet[] = data.snippets.filter((s: unknown) => {
        if (typeof s !== 'object' || !s) return false
        const snippet = s as Record<string, unknown>
        return (
          typeof snippet.id === 'string' &&
          typeof snippet.name === 'string' &&
          typeof snippet.command === 'string'
        )
      }).map((s: Snippet) => ({
        ...s,
        id: s.id || uuidv4(),
        createdAt: s.createdAt || Date.now(),
        usageCount: s.usageCount || 0
      }))

      const validCategories = Array.isArray(data.categories) 
        ? data.categories.filter((c: unknown) => typeof c === 'string')
        : get().categories

      set({ snippets: validSnippets, categories: validCategories })
      saveToStorage(validSnippets, validCategories)
      return true
    } catch {
      return false
    }
  }
}))

// Selectors
export const useSnippets = () => useSnippetStore(useShallow((state) => state.snippets))
export const useSnippetCategories = () => useSnippetStore(useShallow((state) => state.categories))
export const useSnippetActions = () => useSnippetStore(useShallow((state) => ({
  loadSnippets: state.loadSnippets,
  addSnippet: state.addSnippet,
  updateSnippet: state.updateSnippet,
  deleteSnippet: state.deleteSnippet,
  incrementUsage: state.incrementUsage,
  getSnippetByShortcut: state.getSnippetByShortcut,
  addCategory: state.addCategory,
  removeCategory: state.removeCategory,
  exportSnippets: state.exportSnippets,
  importSnippets: state.importSnippets
})))
