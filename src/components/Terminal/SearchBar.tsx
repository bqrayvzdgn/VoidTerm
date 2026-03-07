import { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import type { SearchAddon } from '@xterm/addon-search'
import type { Terminal } from '@xterm/xterm'
import { Clock, X, ChevronUp, ChevronDown } from 'lucide-react'
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
  const [useRegex, setUseRegex] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const {
    history: searchHistory,
    addToHistory,
    navigatePrevious,
    navigateNext,
    resetIndex,
    removeFromHistory
  } = useSearchHistory()

  const searchOptions = useMemo(() => ({ caseSensitive, regex: useRegex }), [caseSensitive, useRegex])

  // Focus input on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const countDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Count matches in terminal buffer (debounced to avoid blocking UI)
  const countSearchMatches = useCallback(
    (text: string, onCount: (count: number) => void): void => {
      if (!terminal || !text) {
        onCount(0)
        return
      }

      // Skip counting for very short search terms (too many matches)
      if (text.length < 2) {
        onCount(-1) // signal "not counted"
        return
      }

      // Debounce the count calculation
      if (countDebounceRef.current) clearTimeout(countDebounceRef.current)
      countDebounceRef.current = setTimeout(() => {
        const buffer = terminal.buffer.active
        let count = 0
        const maxLines = Math.min(buffer.length, 10000)

        if (useRegex) {
          try {
            const regex = new RegExp(text, caseSensitive ? 'g' : 'gi')
            for (let i = 0; i < maxLines; i++) {
              const line = buffer.getLine(i)
              if (line) {
                const lineText = line.translateToString()
                const matches = lineText.match(regex)
                if (matches) count += matches.length
              }
            }
          } catch {
            // Invalid regex - show 0 matches
            onCount(0)
            return
          }
        } else {
          const searchStr = caseSensitive ? text : text.toLowerCase()
          for (let i = 0; i < maxLines; i++) {
            const line = buffer.getLine(i)
            if (line) {
              const lineText = caseSensitive ? line.translateToString() : line.translateToString().toLowerCase()
              let pos = 0
              while ((pos = lineText.indexOf(searchStr, pos)) !== -1) {
                count++
                pos += searchStr.length
              }
            }
          }
        }
        onCount(count)
      }, 150)
    },
    [terminal, useRegex, caseSensitive]
  )

  // Cleanup debounce timer
  useMemo(
    () => () => {
      if (countDebounceRef.current) clearTimeout(countDebounceRef.current)
    },
    []
  )

  // Re-search when options change
  useEffect(() => {
    if (searchAddon && searchText) {
      const found = searchAddon.findNext(searchText, searchOptions)
      setSearchMatchInfo(found ? { current: 1, total: -1 } : { current: 0, total: 0 })
      countSearchMatches(searchText, (total) => {
        setSearchMatchInfo((prev) => (prev ? { ...prev, total } : { current: 0, total }))
      })
    }
  }, [useRegex, caseSensitive]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
            searchAddon.findPrevious(searchText, searchOptions)
            setSearchMatchInfo((prev) =>
              prev && prev.total > 0 ? { ...prev, current: prev.current > 1 ? prev.current - 1 : prev.total } : prev
            )
          } else {
            searchAddon.findNext(searchText, searchOptions)
            setSearchMatchInfo((prev) =>
              prev && prev.total > 0 ? { ...prev, current: prev.current < prev.total ? prev.current + 1 : 1 } : prev
            )
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
    },
    [searchText, searchAddon, searchOptions, addToHistory, navigatePrevious, navigateNext, resetIndex, onClose]
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value
      setSearchText(text)
      resetIndex()
      if (searchAddon) {
        if (text) {
          const found = searchAddon.findNext(text, searchOptions)
          setSearchMatchInfo(found ? { current: 1, total: -1 } : { current: 0, total: 0 })
          countSearchMatches(text, (total) => {
            setSearchMatchInfo((prev) => (prev ? { ...prev, total } : { current: 0, total }))
          })
          setShowSearchHistory(false)
        } else {
          searchAddon.clearDecorations()
          setSearchMatchInfo(null)
        }
      }
    },
    [searchAddon, searchOptions, countSearchMatches, resetIndex]
  )

  const handleSearchFocus = useCallback(() => {
    if (searchHistory.length > 0 && !searchText) {
      setShowSearchHistory(true)
    }
  }, [searchHistory.length, searchText])

  const handleSelectFromHistory = useCallback(
    (term: string) => {
      setSearchText(term)
      setShowSearchHistory(false)
      if (searchAddon) {
        const found = searchAddon.findNext(term, searchOptions)
        setSearchMatchInfo(found ? { current: 1, total: -1 } : { current: 0, total: 0 })
        countSearchMatches(term, (total) => {
          setSearchMatchInfo((prev) => (prev ? { ...prev, total } : { current: 0, total }))
        })
      }
    },
    [searchAddon, searchOptions, countSearchMatches]
  )

  const handleRemoveFromHistory = useCallback(
    (e: React.MouseEvent, term: string) => {
      e.stopPropagation()
      removeFromHistory(term)
    },
    [removeFromHistory]
  )

  const handleFindPrevious = useCallback(() => {
    searchAddon?.findPrevious(searchText, searchOptions)
    setSearchMatchInfo((prev) =>
      prev && prev.total > 0 ? { ...prev, current: prev.current > 1 ? prev.current - 1 : prev.total } : prev
    )
  }, [searchAddon, searchText, searchOptions])

  const handleFindNext = useCallback(() => {
    if (searchText) addToHistory(searchText)
    searchAddon?.findNext(searchText, searchOptions)
    setSearchMatchInfo((prev) =>
      prev && prev.total > 0 ? { ...prev, current: prev.current < prev.total ? prev.current + 1 : 1 } : prev
    )
  }, [searchAddon, searchText, searchOptions, addToHistory])

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
              <div key={index} className="terminal-search-history-item" onClick={() => handleSelectFromHistory(term)}>
                <Clock size={12} strokeWidth={1.5} />
                <span className="terminal-search-history-text">{term}</span>
                <button
                  className="terminal-search-history-remove"
                  onClick={(e) => handleRemoveFromHistory(e, term)}
                  title="Remove from history"
                >
                  <X size={10} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {searchMatchInfo && (
        <span className="terminal-search-count">
          {searchMatchInfo.total === -1
            ? `${searchMatchInfo.current}/...`
            : searchMatchInfo.total > 0
              ? `${searchMatchInfo.current}/${searchMatchInfo.total}`
              : 'No results'}
        </span>
      )}
      <button
        className={`terminal-search-toggle ${useRegex ? 'active' : ''}`}
        onClick={() => setUseRegex((prev) => !prev)}
        title="Use Regular Expression"
      >
        .*
      </button>
      <button
        className={`terminal-search-toggle ${caseSensitive ? 'active' : ''}`}
        onClick={() => setCaseSensitive((prev) => !prev)}
        title="Match Case"
      >
        Aa
      </button>
      <button className="terminal-search-btn" onClick={handleFindPrevious} title="Previous (Shift+Enter)">
        <ChevronUp size={14} strokeWidth={1.5} />
      </button>
      <button className="terminal-search-btn" onClick={handleFindNext} title="Next (Enter)">
        <ChevronDown size={14} strokeWidth={1.5} />
      </button>
      <button className="terminal-search-btn" onClick={handleClose} title="Close (Esc)">
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  )
}
