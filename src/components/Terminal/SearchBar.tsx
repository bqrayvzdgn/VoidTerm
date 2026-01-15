import { useCallback, useRef, useState, useEffect } from 'react'
import type { SearchAddon } from '@xterm/addon-search'
import type { Terminal } from '@xterm/xterm'
import { useSearchHistory } from '../../hooks/useSearchHistory'

interface SearchBarProps {
  searchAddon: SearchAddon | null
  terminal: Terminal | null
  onClose: () => void
}

export function SearchBar({ searchAddon, terminal, onClose }: SearchBarProps) {
  const [searchText, setSearchText] = useState('')
  const [searchMatchInfo, setSearchMatchInfo] = useState<{ current: number; total: number } | null>(null)
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const {
    history: searchHistory,
    addToHistory,
    navigatePrevious,
    navigateNext,
    resetIndex,
    removeFromHistory
  } = useSearchHistory()

  // Focus input on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // Count matches in terminal buffer
  const countSearchMatches = useCallback((text: string): number => {
    if (!terminal || !text) return 0

    const buffer = terminal.buffer.active
    let count = 0
    const searchLower = text.toLowerCase()

    // Limit iteration for performance (max 10000 lines)
    const maxLines = Math.min(buffer.length, 10000)

    for (let i = 0; i < maxLines; i++) {
      const line = buffer.getLine(i)
      if (line) {
        const lineText = line.translateToString().toLowerCase()
        let pos = 0
        while ((pos = lineText.indexOf(searchLower, pos)) !== -1) {
          count++
          pos += searchLower.length
        }
      }
    }
    return count
  }, [terminal])

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchText('')
      setSearchMatchInfo(null)
      searchAddon?.clearDecorations()
      resetIndex()
      onClose()
    } else if (e.key === 'Enter') {
      if (searchAddon && searchText) {
        addToHistory(searchText)
        setShowSearchHistory(false)

        if (e.shiftKey) {
          searchAddon.findPrevious(searchText, { caseSensitive: false })
          setSearchMatchInfo(prev => prev && prev.total > 0
            ? { ...prev, current: prev.current > 1 ? prev.current - 1 : prev.total }
            : prev)
        } else {
          searchAddon.findNext(searchText, { caseSensitive: false })
          setSearchMatchInfo(prev => prev && prev.total > 0
            ? { ...prev, current: prev.current < prev.total ? prev.current + 1 : 1 }
            : prev)
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevSearch = navigatePrevious()
      if (prevSearch !== null) {
        setSearchText(prevSearch)
        setShowSearchHistory(false)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextSearch = navigateNext()
      if (nextSearch !== null) {
        setSearchText(nextSearch)
        setShowSearchHistory(false)
      }
    }
  }, [searchText, searchAddon, addToHistory, navigatePrevious, navigateNext, resetIndex, onClose])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setSearchText(text)
    resetIndex()
    if (searchAddon) {
      if (text) {
        const found = searchAddon.findNext(text, { caseSensitive: false })
        const total = countSearchMatches(text)
        setSearchMatchInfo(found ? { current: 1, total } : { current: 0, total })
        setShowSearchHistory(false)
      } else {
        searchAddon.clearDecorations()
        setSearchMatchInfo(null)
      }
    }
  }, [searchAddon, countSearchMatches, resetIndex])

  const handleSearchFocus = useCallback(() => {
    if (searchHistory.length > 0 && !searchText) {
      setShowSearchHistory(true)
    }
  }, [searchHistory.length, searchText])

  const handleSelectFromHistory = useCallback((term: string) => {
    setSearchText(term)
    setShowSearchHistory(false)
    if (searchAddon) {
      const found = searchAddon.findNext(term, { caseSensitive: false })
      const total = countSearchMatches(term)
      setSearchMatchInfo(found ? { current: 1, total } : { current: 0, total })
    }
  }, [searchAddon, countSearchMatches])

  const handleRemoveFromHistory = useCallback((e: React.MouseEvent, term: string) => {
    e.stopPropagation()
    removeFromHistory(term)
  }, [removeFromHistory])

  const handleFindPrevious = useCallback(() => {
    searchAddon?.findPrevious(searchText, { caseSensitive: false })
    setSearchMatchInfo(prev => prev && prev.total > 0
      ? { ...prev, current: prev.current > 1 ? prev.current - 1 : prev.total }
      : prev)
  }, [searchAddon, searchText])

  const handleFindNext = useCallback(() => {
    if (searchText) addToHistory(searchText)
    searchAddon?.findNext(searchText, { caseSensitive: false })
    setSearchMatchInfo(prev => prev && prev.total > 0
      ? { ...prev, current: prev.current < prev.total ? prev.current + 1 : 1 }
      : prev)
  }, [searchAddon, searchText, addToHistory])

  const handleClose = useCallback(() => {
    setSearchText('')
    setSearchMatchInfo(null)
    searchAddon?.clearDecorations()
    onClose()
  }, [searchAddon, onClose])

  return (
    <div className="terminal-search-bar">
      <div className="terminal-search-input-wrapper">
        <input
          ref={searchInputRef}
          type="text"
          value={searchText}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          onFocus={handleSearchFocus}
          onBlur={() => setTimeout(() => setShowSearchHistory(false), 150)}
          placeholder="Search... (↑↓ for history)"
          className="terminal-search-input"
        />
        {showSearchHistory && searchHistory.length > 0 && (
          <div className="terminal-search-history">
            {searchHistory.slice(0, 10).map((term, index) => (
              <div
                key={index}
                className="terminal-search-history-item"
                onClick={() => handleSelectFromHistory(term)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="terminal-search-history-text">{term}</span>
                <button
                  className="terminal-search-history-remove"
                  onClick={(e) => handleRemoveFromHistory(e, term)}
                  title="Remove from history"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {searchMatchInfo && (
        <span className="terminal-search-count">
          {searchMatchInfo.total > 0
            ? `${searchMatchInfo.current}/${searchMatchInfo.total}`
            : 'No results'}
        </span>
      )}
      <button
        className="terminal-search-btn"
        onClick={handleFindPrevious}
        title="Previous (Shift+Enter)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      <button
        className="terminal-search-btn"
        onClick={handleFindNext}
        title="Next (Enter)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <button
        className="terminal-search-btn"
        onClick={handleClose}
        title="Close (Esc)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
