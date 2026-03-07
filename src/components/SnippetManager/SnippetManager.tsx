import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { X, Search } from 'lucide-react'
import { useSnippetStore } from '../../store/snippetStore'
import { useTranslation } from '../../i18n'
import { useToastStore } from '../../store/toastStore'
import type { Snippet } from '../../types'

interface SnippetManagerProps {
  isOpen: boolean
  onClose: () => void
  activePtyId?: string | null
}

const EMPTY_FORM = { name: '', command: '', description: '', category: '', shortcut: '' }

export const SnippetManager: React.FC<SnippetManagerProps> = ({ isOpen, onClose, activePtyId }) => {
  const { t } = useTranslation()
  const snippets = useSnippetStore((s) => s.snippets)
  const { addSnippet, updateSnippet, removeSnippet, runSnippet, importSnippets, exportSnippets } = useSnippetStore()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedCategory(null)
      setIsEditing(false)
      setEditingId(null)
    }
  }, [isOpen])

  const categories = useMemo(() => {
    const cats = new Set<string>()
    snippets.forEach((s) => {
      if (s.category) cats.add(s.category)
    })
    return Array.from(cats).sort()
  }, [snippets])

  const filtered = useMemo(() => {
    let list = snippets
    if (selectedCategory) {
      list = list.filter((s) => s.category === selectedCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.command.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      )
    }
    return list
  }, [snippets, selectedCategory, search])

  const handleAdd = useCallback(() => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setIsEditing(true)
  }, [])

  const handleEdit = useCallback((snippet: Snippet) => {
    setForm({
      name: snippet.name,
      command: snippet.command,
      description: snippet.description || '',
      category: snippet.category || '',
      shortcut: snippet.shortcut || ''
    })
    setEditingId(snippet.id)
    setIsEditing(true)
  }, [])

  const handleSave = useCallback(() => {
    if (!form.name.trim() || !form.command.trim()) return

    const data = {
      name: form.name.trim(),
      command: form.command.trim(),
      description: form.description.trim() || undefined,
      category: form.category.trim() || undefined,
      shortcut: form.shortcut.trim() || undefined
    }

    if (editingId) {
      updateSnippet(editingId, data)
    } else {
      addSnippet(data)
    }

    setIsEditing(false)
    setEditingId(null)
  }, [form, editingId, addSnippet, updateSnippet])

  const handleDelete = useCallback(
    (id: string) => {
      removeSnippet(id)
    },
    [removeSnippet]
  )

  const handleRun = useCallback(
    (id: string) => {
      if (activePtyId) {
        runSnippet(id, activePtyId)
        onClose()
      }
    },
    [activePtyId, runSnippet, onClose]
  )

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const result = importSnippets(reader.result as string)
        if (result.success) {
          useToastStore.getState().success(t.snippets.importSuccess)
        } else {
          useToastStore.getState().error(t.snippets.importError)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [importSnippets, t])

  const handleExport = useCallback(() => {
    const json = exportSnippets()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'voidterm-snippets.json'
    a.click()
    URL.revokeObjectURL(url)
    useToastStore.getState().success(t.snippets.export)
  }, [exportSnippets, t])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setEditingId(null)
  }, [])

  if (!isOpen) return null

  return (
    <>
      <div className="snippet-manager-overlay" onClick={onClose} />
      <div className="snippet-manager">
        <div className="snippet-manager-header">
          <h2>{t.snippets.title}</h2>
          <div className="snippet-header-actions">
            <button className="snippet-header-btn" onClick={handleImport} title={t.snippets.import}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <button className="snippet-header-btn" onClick={handleExport} title={t.snippets.export}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
            <button className="snippet-manager-close" onClick={onClose}>
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="snippet-manager-body">
          <div className="snippet-sidebar">
            <button
              className={`snippet-category-btn ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              {t.snippets.allCategories}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`snippet-category-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="snippet-main">
            {isEditing ? (
              <div className="snippet-form">
                <div className="snippet-form-group">
                  <label>{t.snippets.name}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder={t.snippets.namePlaceholder}
                    autoFocus
                  />
                </div>
                <div className="snippet-form-group">
                  <label>{t.snippets.command}</label>
                  <textarea
                    value={form.command}
                    onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))}
                    placeholder={t.snippets.commandPlaceholder}
                    rows={3}
                  />
                </div>
                <div className="snippet-form-group">
                  <label>{t.snippets.description}</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder={t.snippets.descriptionPlaceholder}
                  />
                </div>
                <div className="snippet-form-row">
                  <div className="snippet-form-group">
                    <label>{t.snippets.category}</label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      list="snippet-categories"
                    />
                    <datalist id="snippet-categories">
                      {categories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                  <div className="snippet-form-group">
                    <label>{t.snippets.shortcut}</label>
                    <input
                      type="text"
                      value={form.shortcut}
                      onChange={(e) => setForm((f) => ({ ...f, shortcut: e.target.value }))}
                      placeholder={t.snippets.shortcutPlaceholder}
                    />
                  </div>
                </div>
                <div className="snippet-form-actions">
                  <button className="snippet-btn snippet-btn-secondary" onClick={handleCancel}>
                    {t.common.cancel}
                  </button>
                  <button
                    className="snippet-btn snippet-btn-primary"
                    onClick={handleSave}
                    disabled={!form.name.trim() || !form.command.trim()}
                  >
                    {t.common.save}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="snippet-search-bar">
                  <Search size={14} strokeWidth={1.5} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t.snippets.searchPlaceholder}
                  />
                </div>

                <div className="snippet-list">
                  {filtered.length === 0 ? (
                    <div className="snippet-empty">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M16 18l6-6-6-6" />
                        <path d="M8 6l-6 6 6 6" />
                      </svg>
                      <p>{t.snippets.noSnippets}</p>
                      <span>{t.snippets.addSnippetHint}</span>
                    </div>
                  ) : (
                    filtered.map((snippet) => (
                      <div key={snippet.id} className="snippet-card">
                        <div className="snippet-card-info">
                          <span className="snippet-card-name">{snippet.name}</span>
                          <code className="snippet-command">{snippet.command}</code>
                          {snippet.description && <span className="snippet-card-desc">{snippet.description}</span>}
                          <div className="snippet-card-meta">
                            {snippet.category && <span className="snippet-badge">{snippet.category}</span>}
                            <span className="snippet-usage">
                              {snippet.usageCount} {t.snippets.usageCount}
                            </span>
                          </div>
                        </div>
                        <div className="snippet-card-actions">
                          <button
                            className="snippet-action-btn"
                            onClick={() => handleRun(snippet.id)}
                            title={t.snippets.run}
                            disabled={!activePtyId}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </button>
                          <button
                            className="snippet-action-btn"
                            onClick={() => handleEdit(snippet)}
                            title={t.common.edit}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="snippet-action-btn snippet-action-delete"
                            onClick={() => handleDelete(snippet.id)}
                            title={t.common.delete}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="snippet-manager-footer">
                  <button className="snippet-btn snippet-btn-primary" onClick={handleAdd}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {t.snippets.addSnippet}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
