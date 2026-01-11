import React, { useState, useEffect, useMemo } from 'react'
import { useSnippetStore } from '../../store/snippetStore'
import { useTranslation } from '../../i18n'
import type { Snippet } from '../../types'

interface SnippetManagerProps {
  isOpen: boolean
  onClose: () => void
  onRunSnippet: (command: string) => void
}

interface EditingSnippet {
  id?: string
  name: string
  command: string
  description: string
  category: string
  shortcut: string
}

const EMPTY_SNIPPET: EditingSnippet = {
  name: '',
  command: '',
  description: '',
  category: 'General',
  shortcut: ''
}

export const SnippetManager: React.FC<SnippetManagerProps> = ({ isOpen, onClose, onRunSnippet }) => {
  const { t } = useTranslation()
  const { 
    snippets, 
    categories, 
    isLoaded,
    loadSnippets,
    addSnippet, 
    updateSnippet, 
    deleteSnippet,
    incrementUsage,
    addCategory,
    exportSnippets,
    importSnippets
  } = useSnippetStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<EditingSnippet>(EMPTY_SNIPPET)
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)

  // Load snippets on mount
  useEffect(() => {
    if (!isLoaded) {
      loadSnippets()
    }
  }, [isLoaded, loadSnippets])

  // Filter snippets
  const filteredSnippets = useMemo(() => {
    return snippets
      .filter(s => {
        const matchesSearch = !searchQuery || 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !selectedCategory || s.category === selectedCategory
        return matchesSearch && matchesCategory
      })
      .sort((a, b) => b.usageCount - a.usageCount)
  }, [snippets, searchQuery, selectedCategory])

  const handleAddNew = () => {
    setEditingSnippet({ ...EMPTY_SNIPPET, category: selectedCategory || 'General' })
    setIsEditing(true)
  }

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet({
      id: snippet.id,
      name: snippet.name,
      command: snippet.command,
      description: snippet.description || '',
      category: snippet.category || 'General',
      shortcut: snippet.shortcut || ''
    })
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!editingSnippet.name.trim() || !editingSnippet.command.trim()) return

    if (editingSnippet.id) {
      updateSnippet(editingSnippet.id, {
        name: editingSnippet.name.trim(),
        command: editingSnippet.command.trim(),
        description: editingSnippet.description.trim() || undefined,
        category: editingSnippet.category,
        shortcut: editingSnippet.shortcut.trim() || undefined
      })
    } else {
      addSnippet({
        name: editingSnippet.name.trim(),
        command: editingSnippet.command.trim(),
        description: editingSnippet.description.trim() || undefined,
        category: editingSnippet.category,
        shortcut: editingSnippet.shortcut.trim() || undefined
      })
    }

    setIsEditing(false)
    setEditingSnippet(EMPTY_SNIPPET)
  }

  const handleDelete = (id: string) => {
    if (confirm(t.snippets.deleteConfirm)) {
      deleteSnippet(id)
    }
  }

  const handleRun = (snippet: Snippet) => {
    incrementUsage(snippet.id)
    onRunSnippet(snippet.command)
    onClose()
  }

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory.trim())
      setNewCategory('')
      setShowNewCategory(false)
    }
  }

  const handleExport = () => {
    const data = exportSnippets()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voidterm-snippets-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        if (importSnippets(text)) {
          alert(t.snippets.importSuccess)
        } else {
          alert(t.snippets.importError)
        }
      } catch {
        alert(t.snippets.importError)
      }
    }
    input.click()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal snippet-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t.snippets.title}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="snippet-manager-content">
          {/* Sidebar */}
          <div className="snippet-sidebar">
            <button 
              className={`snippet-category-btn ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              {t.snippets.allCategories}
              <span className="snippet-category-count">{snippets.length}</span>
            </button>

            {categories.map(category => {
              const count = snippets.filter(s => s.category === category).length
              return (
                <button
                  key={category}
                  className={`snippet-category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  {category}
                  <span className="snippet-category-count">{count}</span>
                </button>
              )
            })}

            {showNewCategory ? (
              <div className="snippet-new-category">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={t.snippets.newCategoryPlaceholder}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCategory()
                    if (e.key === 'Escape') setShowNewCategory(false)
                  }}
                  autoFocus
                />
                <button onClick={handleAddCategory}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button className="snippet-add-category-btn" onClick={() => setShowNewCategory(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t.snippets.addCategory}
              </button>
            )}

            <div className="snippet-sidebar-actions">
              <button className="btn btn-sm" onClick={handleExport}>
                {t.snippets.export}
              </button>
              <button className="btn btn-sm" onClick={handleImport}>
                {t.snippets.import}
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="snippet-main">
            {isEditing ? (
              <div className="snippet-editor">
                <h3>{editingSnippet.id ? t.snippets.editSnippet : t.snippets.addSnippet}</h3>
                
                <div className="snippet-form">
                  <div className="snippet-form-row">
                    <label>{t.snippets.name}</label>
                    <input
                      type="text"
                      value={editingSnippet.name}
                      onChange={(e) => setEditingSnippet(s => ({ ...s, name: e.target.value }))}
                      placeholder={t.snippets.namePlaceholder}
                    />
                  </div>

                  <div className="snippet-form-row">
                    <label>{t.snippets.command}</label>
                    <textarea
                      value={editingSnippet.command}
                      onChange={(e) => setEditingSnippet(s => ({ ...s, command: e.target.value }))}
                      placeholder={t.snippets.commandPlaceholder}
                      rows={3}
                    />
                  </div>

                  <div className="snippet-form-row">
                    <label>{t.snippets.description}</label>
                    <input
                      type="text"
                      value={editingSnippet.description}
                      onChange={(e) => setEditingSnippet(s => ({ ...s, description: e.target.value }))}
                      placeholder={t.snippets.descriptionPlaceholder}
                    />
                  </div>

                  <div className="snippet-form-row-inline">
                    <div className="snippet-form-row">
                      <label>{t.snippets.category}</label>
                      <select
                        value={editingSnippet.category}
                        onChange={(e) => setEditingSnippet(s => ({ ...s, category: e.target.value }))}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="snippet-form-row">
                      <label>{t.snippets.shortcut}</label>
                      <input
                        type="text"
                        value={editingSnippet.shortcut}
                        onChange={(e) => setEditingSnippet(s => ({ ...s, shortcut: e.target.value }))}
                        placeholder={t.snippets.shortcutPlaceholder}
                      />
                    </div>
                  </div>

                  <div className="snippet-form-actions">
                    <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                      {t.common.cancel}
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleSave}
                      disabled={!editingSnippet.name.trim() || !editingSnippet.command.trim()}
                    >
                      {t.common.save}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="snippet-toolbar">
                  <div className="snippet-search">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.snippets.searchPlaceholder}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleAddNew}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {t.snippets.addSnippet}
                  </button>
                </div>

                <div className="snippet-list">
                  {filteredSnippets.length === 0 ? (
                    <div className="snippet-empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                      <p>{t.snippets.noSnippets}</p>
                      <span>{t.snippets.addSnippetHint}</span>
                    </div>
                  ) : (
                    filteredSnippets.map(snippet => (
                      <div key={snippet.id} className="snippet-item">
                        <div className="snippet-item-main">
                          <div className="snippet-item-header">
                            <span className="snippet-item-name">{snippet.name}</span>
                            {snippet.shortcut && (
                              <kbd className="snippet-item-shortcut">{snippet.shortcut}</kbd>
                            )}
                          </div>
                          <code className="snippet-item-command">{snippet.command}</code>
                          {snippet.description && (
                            <p className="snippet-item-description">{snippet.description}</p>
                          )}
                          <div className="snippet-item-meta">
                            <span className="snippet-item-category">{snippet.category}</span>
                            <span className="snippet-item-usage">
                              {snippet.usageCount} {t.snippets.usageCount}
                            </span>
                          </div>
                        </div>
                        <div className="snippet-item-actions">
                          <button 
                            className="snippet-action-btn run" 
                            onClick={() => handleRun(snippet)}
                            title={t.snippets.run}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </button>
                          <button 
                            className="snippet-action-btn edit" 
                            onClick={() => handleEdit(snippet)}
                            title={t.common.edit}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                            </svg>
                          </button>
                          <button 
                            className="snippet-action-btn delete" 
                            onClick={() => handleDelete(snippet.id)}
                            title={t.common.delete}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
