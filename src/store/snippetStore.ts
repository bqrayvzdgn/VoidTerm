import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { v4 as uuidv4 } from 'uuid'
import type { Snippet } from '../types'
import { createLogger } from '../utils/logger'

const logger = createLogger('SnippetStore')
const STORAGE_KEY = 'voidterm-snippets'

interface SnippetStore {
  snippets: Snippet[]
  addSnippet: (snippet: Omit<Snippet, 'id' | 'createdAt' | 'usageCount'>) => string
  updateSnippet: (id: string, updates: Partial<Snippet>) => void
  removeSnippet: (id: string) => void
  runSnippet: (id: string, ptyId: string) => void
  importSnippets: (json: string) => { success: boolean; count: number; error?: string }
  exportSnippets: () => string
  searchSnippets: (query: string) => Snippet[]
  loadFromStorage: () => void
  saveToStorage: () => void
}

export const useSnippetStore = create<SnippetStore>()((set, get) => ({
  snippets: [],

  addSnippet: (data) => {
    const id = uuidv4()
    const snippet: Snippet = { ...data, id, createdAt: Date.now(), usageCount: 0 }
    set((state) => ({ snippets: [...state.snippets, snippet] }))
    get().saveToStorage()
    return id
  },

  updateSnippet: (id, updates) => {
    set((state) => ({
      snippets: state.snippets.map((s) => (s.id === id ? { ...s, ...updates } : s))
    }))
    get().saveToStorage()
  },

  removeSnippet: (id) => {
    set((state) => ({ snippets: state.snippets.filter((s) => s.id !== id) }))
    get().saveToStorage()
  },

  runSnippet: (id, ptyId) => {
    const snippet = get().snippets.find((s) => s.id === id)
    if (snippet && window.electronAPI?.ptyWrite) {
      window.electronAPI.ptyWrite(ptyId, snippet.command + '\r')
      set((state) => ({
        snippets: state.snippets.map((s) => (s.id === id ? { ...s, usageCount: s.usageCount + 1 } : s))
      }))
      get().saveToStorage()
    }
  },

  importSnippets: (json) => {
    try {
      const parsed = JSON.parse(json)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      const valid = items.filter(
        (s: unknown): s is Record<string, unknown> =>
          typeof s === 'object' && s !== null && 'name' in s && 'command' in s
      )
      for (const item of valid) {
        get().addSnippet({
          name: item.name as string,
          command: item.command as string,
          description: item.description as string | undefined,
          category: item.category as string | undefined,
          shortcut: item.shortcut as string | undefined
        })
      }
      return { success: true, count: valid.length }
    } catch (e) {
      return { success: false, count: 0, error: e instanceof Error ? e.message : 'Parse error' }
    }
  },

  exportSnippets: () => {
    return JSON.stringify(
      get().snippets.map(({ id: _id, createdAt: _ca, usageCount: _uc, ...rest }) => rest),
      null,
      2
    )
  },

  searchSnippets: (query) => {
    const q = query.toLowerCase()
    return get().snippets.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.command.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q)
    )
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) set({ snippets: JSON.parse(stored) })
    } catch (e) {
      logger.error('Failed to load snippets:', e)
    }
  },

  saveToStorage: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().snippets))
    } catch (e) {
      logger.error('Failed to save snippets:', e)
    }
  }
}))

// Selectors
export const useSnippets = () => useSnippetStore(useShallow((state) => state.snippets))
export const useSnippetActions = () =>
  useSnippetStore(
    useShallow((state) => ({
      addSnippet: state.addSnippet,
      updateSnippet: state.updateSnippet,
      removeSnippet: state.removeSnippet,
      runSnippet: state.runSnippet,
      importSnippets: state.importSnippets,
      exportSnippets: state.exportSnippets,
      searchSnippets: state.searchSnippets,
      loadFromStorage: state.loadFromStorage
    }))
  )

// Load on import
if (typeof localStorage !== 'undefined') {
  useSnippetStore.getState().loadFromStorage()
}
