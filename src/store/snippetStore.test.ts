import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSnippetStore } from './snippetStore'

describe('snippetStore', () => {
  beforeEach(() => {
    // Reset store state
    useSnippetStore.setState({
      snippets: [],
      categories: ['General', 'Git', 'Docker', 'SSH'],
      isLoaded: false
    })
    vi.clearAllMocks()
  })

  describe('addSnippet', () => {
    it('should add a snippet with generated id and metadata', () => {
      const store = useSnippetStore.getState()
      const id = store.addSnippet({
        name: 'List files',
        command: 'ls -la',
        category: 'General',
        description: 'List all files',
        shortcut: 'll'
      })

      expect(id).toBeDefined()
      expect(typeof id).toBe('string')

      const { snippets } = useSnippetStore.getState()
      expect(snippets).toHaveLength(1)
      expect(snippets[0].name).toBe('List files')
      expect(snippets[0].command).toBe('ls -la')
      expect(snippets[0].usageCount).toBe(0)
      expect(snippets[0].createdAt).toBeGreaterThan(0)
    })

    it('should add multiple snippets', () => {
      const store = useSnippetStore.getState()
      store.addSnippet({ name: 'First', command: 'echo 1', category: 'General' })
      store.addSnippet({ name: 'Second', command: 'echo 2', category: 'Git' })

      const { snippets } = useSnippetStore.getState()
      expect(snippets).toHaveLength(2)
    })
  })

  describe('updateSnippet', () => {
    it('should update snippet fields', () => {
      const store = useSnippetStore.getState()
      const id = store.addSnippet({ name: 'Old', command: 'old', category: 'General' })

      store.updateSnippet(id, { name: 'New', command: 'new' })

      const { snippets } = useSnippetStore.getState()
      expect(snippets[0].name).toBe('New')
      expect(snippets[0].command).toBe('new')
    })

    it('should not affect other snippets', () => {
      const store = useSnippetStore.getState()
      const id1 = store.addSnippet({ name: 'First', command: 'cmd1', category: 'General' })
      const id2 = store.addSnippet({ name: 'Second', command: 'cmd2', category: 'General' })

      store.updateSnippet(id1, { name: 'Updated' })

      const { snippets } = useSnippetStore.getState()
      expect(snippets.find(s => s.id === id1)?.name).toBe('Updated')
      expect(snippets.find(s => s.id === id2)?.name).toBe('Second')
    })
  })

  describe('deleteSnippet', () => {
    it('should remove snippet by id', () => {
      const store = useSnippetStore.getState()
      const id = store.addSnippet({ name: 'Delete me', command: 'rm', category: 'General' })

      expect(useSnippetStore.getState().snippets).toHaveLength(1)

      store.deleteSnippet(id)

      expect(useSnippetStore.getState().snippets).toHaveLength(0)
    })
  })

  describe('incrementUsage', () => {
    it('should increment usage count', () => {
      const store = useSnippetStore.getState()
      const id = store.addSnippet({ name: 'Cmd', command: 'cmd', category: 'General' })

      expect(useSnippetStore.getState().snippets[0].usageCount).toBe(0)

      store.incrementUsage(id)
      expect(useSnippetStore.getState().snippets[0].usageCount).toBe(1)

      store.incrementUsage(id)
      store.incrementUsage(id)
      expect(useSnippetStore.getState().snippets[0].usageCount).toBe(3)
    })
  })

  describe('getSnippetByShortcut', () => {
    it('should find snippet by shortcut', () => {
      const store = useSnippetStore.getState()
      store.addSnippet({ name: 'Git status', command: 'git status', category: 'Git', shortcut: 'gs' })

      const found = store.getSnippetByShortcut('gs')
      expect(found?.name).toBe('Git status')
    })

    it('should return undefined for unknown shortcut', () => {
      const store = useSnippetStore.getState()
      const found = store.getSnippetByShortcut('unknown')
      expect(found).toBeUndefined()
    })
  })

  describe('category management', () => {
    it('should add a new category', () => {
      const store = useSnippetStore.getState()
      store.addCategory('Kubernetes')

      const { categories } = useSnippetStore.getState()
      expect(categories).toContain('Kubernetes')
    })

    it('should not add duplicate categories', () => {
      const store = useSnippetStore.getState()
      const initialLength = store.categories.length
      store.addCategory('General')

      expect(useSnippetStore.getState().categories.length).toBe(initialLength)
    })

    it('should remove category and reassign snippets to General', () => {
      const store = useSnippetStore.getState()
      store.addSnippet({ name: 'Docker ps', command: 'docker ps', category: 'Docker' })

      store.removeCategory('Docker')

      const { categories, snippets } = useSnippetStore.getState()
      expect(categories).not.toContain('Docker')
      expect(snippets[0].category).toBe('General')
    })
  })

  describe('import/export', () => {
    it('should export snippets as JSON', () => {
      const store = useSnippetStore.getState()
      store.addSnippet({ name: 'Test', command: 'test', category: 'General' })

      const json = store.exportSnippets()
      const parsed = JSON.parse(json)

      expect(parsed.snippets).toHaveLength(1)
      expect(parsed.categories).toBeDefined()
      expect(parsed.exportedAt).toBeDefined()
    })

    it('should import valid JSON', () => {
      const store = useSnippetStore.getState()
      const json = JSON.stringify({
        snippets: [
          { id: 'imported-1', name: 'Imported', command: 'echo imported', category: 'General', createdAt: Date.now(), usageCount: 0 }
        ],
        categories: ['General', 'Custom']
      })

      const result = store.importSnippets(json)

      expect(result).toBe(true)
      const { snippets, categories } = useSnippetStore.getState()
      expect(snippets).toHaveLength(1)
      expect(snippets[0].name).toBe('Imported')
      expect(categories).toContain('Custom')
    })

    it('should reject invalid JSON', () => {
      const store = useSnippetStore.getState()
      expect(store.importSnippets('not json')).toBe(false)
    })

    it('should reject JSON without snippets array', () => {
      const store = useSnippetStore.getState()
      expect(store.importSnippets('{"data":"invalid"}')).toBe(false)
    })

    it('should filter out invalid snippet entries', () => {
      const store = useSnippetStore.getState()
      const json = JSON.stringify({
        snippets: [
          { id: 'valid', name: 'Valid', command: 'echo valid' },
          { invalid: true },
          'not-an-object'
        ]
      })

      store.importSnippets(json)
      const { snippets } = useSnippetStore.getState()
      expect(snippets).toHaveLength(1)
      expect(snippets[0].name).toBe('Valid')
    })
  })
})
