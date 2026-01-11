import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { SearchAddon } from '@xterm/addon-search'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { useSettingsStore } from '../../store/settingsStore'
import '@xterm/xterm/css/xterm.css'

interface TerminalViewProps {
  ptyId: string
  onTitleChange?: (title: string) => void
  isActive?: boolean
  onNavigatePane?: (direction: 'up' | 'down' | 'left' | 'right') => void
  onClosePane?: () => void
  onNextTab?: () => void
  onPrevTab?: () => void
}

export interface TerminalViewHandle {
  focus: () => void
  search: (text: string, findNext?: boolean) => boolean
  clearSearch: () => void
  copy: () => void
  paste: () => void
}

export const TerminalView = forwardRef<TerminalViewHandle, TerminalViewProps>(({ 
  ptyId, 
  onTitleChange, 
  isActive,
  onNavigatePane,
  onClosePane,
  onNextTab,
  onPrevTab
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const searchAddonRef = useRef<SearchAddon | null>(null)
  const { settings, currentTheme } = useSettingsStore()
  
  const [showSearch, setShowSearch] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [zoomLevel, setZoomLevel] = useState(0) // -5 to +10, each step is 2px
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    focus: () => {
      terminalRef.current?.focus()
    },
    search: (text: string, findNext = true) => {
      if (searchAddonRef.current && text) {
        if (findNext) {
          return searchAddonRef.current.findNext(text, { caseSensitive: false, wholeWord: false })
        } else {
          return searchAddonRef.current.findPrevious(text, { caseSensitive: false, wholeWord: false })
        }
      }
      return false
    },
    clearSearch: () => {
      searchAddonRef.current?.clearDecorations()
    },
    copy: () => {
      const selection = terminalRef.current?.getSelection()
      if (selection) {
        navigator.clipboard.writeText(selection)
      }
    },
    paste: async () => {
      try {
        const text = await navigator.clipboard.readText()
        if (text) {
          window.electronAPI.ptyWrite(ptyId, text)
        }
      } catch (error) {
        console.error('Failed to paste:', error)
      }
    }
  }), [ptyId])

  const handleResize = useCallback(() => {
    if (fitAddonRef.current && terminalRef.current) {
      fitAddonRef.current.fit()
      const { cols, rows } = terminalRef.current
      window.electronAPI.ptyResize(ptyId, cols, rows)
    }
  }, [ptyId])

  // Handle search keyboard shortcuts
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSearch(false)
      setSearchText('')
      searchAddonRef.current?.clearDecorations()
      terminalRef.current?.focus()
    } else if (e.key === 'Enter') {
      if (searchAddonRef.current && searchText) {
        if (e.shiftKey) {
          searchAddonRef.current.findPrevious(searchText, { caseSensitive: false })
        } else {
          searchAddonRef.current.findNext(searchText, { caseSensitive: false })
        }
      }
    }
  }, [searchText])

  // Handle search text change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setSearchText(text)
    if (searchAddonRef.current) {
      if (text) {
        searchAddonRef.current.findNext(text, { caseSensitive: false })
      } else {
        searchAddonRef.current.clearDecorations()
      }
    }
  }, [])

  // Toggle search bar
  const toggleSearch = useCallback(() => {
    setShowSearch(prev => {
      if (!prev) {
        // Opening search, focus input after render
        setTimeout(() => searchInputRef.current?.focus(), 0)
      } else {
        // Closing search, clear and focus terminal
        setSearchText('')
        searchAddonRef.current?.clearDecorations()
        terminalRef.current?.focus()
      }
      return !prev
    })
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new Terminal({
      cursorBlink: settings.cursorBlink,
      cursorStyle: settings.cursorStyle,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      scrollback: settings.scrollback,
      theme: {
        background: currentTheme.colors.background,
        foreground: currentTheme.colors.foreground,
        cursor: currentTheme.colors.cursor,
        cursorAccent: currentTheme.colors.cursorAccent,
        selectionBackground: currentTheme.colors.selection,
        black: currentTheme.colors.black,
        red: currentTheme.colors.red,
        green: currentTheme.colors.green,
        yellow: currentTheme.colors.yellow,
        blue: currentTheme.colors.blue,
        magenta: currentTheme.colors.magenta,
        cyan: currentTheme.colors.cyan,
        white: currentTheme.colors.white,
        brightBlack: currentTheme.colors.brightBlack,
        brightRed: currentTheme.colors.brightRed,
        brightGreen: currentTheme.colors.brightGreen,
        brightYellow: currentTheme.colors.brightYellow,
        brightBlue: currentTheme.colors.brightBlue,
        brightMagenta: currentTheme.colors.brightMagenta,
        brightCyan: currentTheme.colors.brightCyan,
        brightWhite: currentTheme.colors.brightWhite
      },
      allowTransparency: true,
      rightClickSelectsWord: true
    })

    const fitAddon = new FitAddon()
    const searchAddon = new SearchAddon()
    const webLinksAddon = new WebLinksAddon((_event, uri) => {
      // Open links in default browser
      window.electronAPI.openExternal?.(uri)
    })

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(searchAddon)
    terminal.loadAddon(webLinksAddon)

    terminal.open(containerRef.current)

    // Try to load WebGL addon for better performance
    try {
      const webglAddon = new WebglAddon()
      webglAddon.onContextLoss(() => {
        webglAddon.dispose()
      })
      terminal.loadAddon(webglAddon)
    } catch (e) {
      console.warn('WebGL addon failed to load, falling back to canvas renderer')
    }

    fitAddon.fit()

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon
    searchAddonRef.current = searchAddon

    // Handle custom keyboard shortcuts before terminal processes them
    terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey
      
      // Ctrl+F - Search (prevent terminal from receiving it)
      if (isCtrl && e.key === 'f') {
        e.preventDefault()
        setShowSearch(prev => {
          if (!prev) {
            // Opening search - focus input after state update
            setTimeout(() => {
              const input = document.querySelector('.terminal-search-input') as HTMLInputElement
              input?.focus()
            }, 0)
          }
          return !prev
        })
        return false
      }
      
      // Ctrl+Shift+C - Copy
      if (isCtrl && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault()
        const selection = terminal.getSelection()
        if (selection) {
          navigator.clipboard.writeText(selection)
        }
        return false
      }
      
      // Ctrl+Shift+V - Paste
      if (isCtrl && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault()
        navigator.clipboard.readText().then(text => {
          if (text) {
            window.electronAPI.ptyWrite(ptyId, text)
          }
        })
        return false
      }
      
      // Alt+Arrow keys - Pane navigation
      if (e.altKey && !isCtrl && !e.shiftKey) {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          onNavigatePane?.('up')
          return false
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          onNavigatePane?.('down')
          return false
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          onNavigatePane?.('left')
          return false
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          onNavigatePane?.('right')
          return false
        }
      }
      
      // Ctrl+Shift+W - Close pane
      if (isCtrl && e.shiftKey && (e.key === 'W' || e.key === 'w')) {
        e.preventDefault()
        onClosePane?.()
        return false
      }
      
      // Ctrl+Tab - Next tab, Ctrl+Shift+Tab - Previous tab
      if (isCtrl && e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) {
          onPrevTab?.()
        } else {
          onNextTab?.()
        }
        return false
      }
      
      // Ctrl+Plus/Ctrl+= - Zoom in
      if (isCtrl && (e.key === '+' || e.key === '=' || e.key === 'Add')) {
        e.preventDefault()
        setZoomLevel(prev => {
          const newZoom = Math.min(prev + 1, 10)
          const newFontSize = settings.fontSize + (newZoom * 2)
          terminal.options.fontSize = newFontSize
          fitAddonRef.current?.fit()
          return newZoom
        })
        return false
      }
      
      // Ctrl+Minus - Zoom out
      if (isCtrl && (e.key === '-' || e.key === 'Subtract')) {
        e.preventDefault()
        setZoomLevel(prev => {
          const newZoom = Math.max(prev - 1, -5)
          const newFontSize = settings.fontSize + (newZoom * 2)
          terminal.options.fontSize = Math.max(8, newFontSize)
          fitAddonRef.current?.fit()
          return newZoom
        })
        return false
      }
      
      // Ctrl+0 - Reset zoom
      if (isCtrl && (e.key === '0' || e.key === 'Numpad0')) {
        e.preventDefault()
        setZoomLevel(0)
        terminal.options.fontSize = settings.fontSize
        fitAddonRef.current?.fit()
        return false
      }
      
      // Let terminal handle all other keys
      return true
    })

    // Handle terminal input
    terminal.onData((data) => {
      window.electronAPI.ptyWrite(ptyId, data)
    })

    // Handle title changes
    terminal.onTitleChange((title) => {
      onTitleChange?.(title)
    })

    // Handle selection for copy-on-select
    terminal.onSelectionChange(() => {
      if (settings.copyOnSelect) {
        const selection = terminal.getSelection()
        if (selection) {
          navigator.clipboard.writeText(selection)
        }
      }
    })

    // Handle PTY output
    const removeDataListener = window.electronAPI.onPtyData((id, data) => {
      if (id === ptyId) {
        terminal.write(data)
      }
    })

    // Handle PTY exit
    const removeExitListener = window.electronAPI.onPtyExit((id, exitCode) => {
      if (id === ptyId) {
        terminal.write(`\r\n\x1b[90mProcess exited with code ${exitCode}\x1b[0m\r\n`)
      }
    })

    // Initial resize
    const { cols, rows } = terminal
    window.electronAPI.ptyResize(ptyId, cols, rows)

    // Handle window resize
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.current)

    // Focus the terminal after it's ready
    terminal.focus()

    return () => {
      removeDataListener()
      removeExitListener()
      resizeObserver.disconnect()
      terminal.dispose()
    }
  }, [ptyId, onTitleChange, handleResize])

  // Focus terminal when it becomes active
  useEffect(() => {
    if (isActive && terminalRef.current && !showSearch) {
      terminalRef.current.focus()
    }
  }, [isActive, showSearch])

  // Focus search input when search opens
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Update terminal options when settings change
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.cursorBlink = settings.cursorBlink
      terminalRef.current.options.cursorStyle = settings.cursorStyle
      terminalRef.current.options.fontSize = settings.fontSize
      terminalRef.current.options.fontFamily = settings.fontFamily
      terminalRef.current.options.theme = {
        background: currentTheme.colors.background,
        foreground: currentTheme.colors.foreground,
        cursor: currentTheme.colors.cursor,
        cursorAccent: currentTheme.colors.cursorAccent,
        selectionBackground: currentTheme.colors.selection,
        black: currentTheme.colors.black,
        red: currentTheme.colors.red,
        green: currentTheme.colors.green,
        yellow: currentTheme.colors.yellow,
        blue: currentTheme.colors.blue,
        magenta: currentTheme.colors.magenta,
        cyan: currentTheme.colors.cyan,
        white: currentTheme.colors.white,
        brightBlack: currentTheme.colors.brightBlack,
        brightRed: currentTheme.colors.brightRed,
        brightGreen: currentTheme.colors.brightGreen,
        brightYellow: currentTheme.colors.brightYellow,
        brightBlue: currentTheme.colors.brightBlue,
        brightMagenta: currentTheme.colors.brightMagenta,
        brightCyan: currentTheme.colors.brightCyan,
        brightWhite: currentTheme.colors.brightWhite
      }
      handleResize()
    }
  }, [settings, currentTheme, handleResize])

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    
    const selection = terminalRef.current?.getSelection()
    
    // Show native context menu via IPC
    window.electronAPI.showTerminalContextMenu({
      hasSelection: !!selection,
      x: e.clientX,
      y: e.clientY
    })
  }, [])

  // Listen for context menu actions
  useEffect(() => {
    const removeCopyListener = window.electronAPI.onTerminalCopy?.(() => {
      const selection = terminalRef.current?.getSelection()
      if (selection) {
        navigator.clipboard.writeText(selection)
      }
    })

    const removePasteListener = window.electronAPI.onTerminalPaste?.(() => {
      navigator.clipboard.readText().then(text => {
        if (text) {
          window.electronAPI.ptyWrite(ptyId, text)
        }
      })
    })

    const removeClearListener = window.electronAPI.onTerminalClear?.(() => {
      terminalRef.current?.clear()
    })

    return () => {
      removeCopyListener?.()
      removePasteListener?.()
      removeClearListener?.()
    }
  }, [ptyId])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: currentTheme.colors.background,
        position: 'relative'
      }}
    >
      {/* Search Bar */}
      {showSearch && (
        <div className="terminal-search-bar">
          <input
            ref={searchInputRef}
            type="text"
            value={searchText}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search..."
            className="terminal-search-input"
          />
          <button
            className="terminal-search-btn"
            onClick={() => searchAddonRef.current?.findPrevious(searchText, { caseSensitive: false })}
            title="Previous (Shift+Enter)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
          <button
            className="terminal-search-btn"
            onClick={() => searchAddonRef.current?.findNext(searchText, { caseSensitive: false })}
            title="Next (Enter)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button
            className="terminal-search-btn"
            onClick={toggleSearch}
            title="Close (Esc)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Zoom Indicator */}
      {zoomLevel !== 0 && (
        <div className="terminal-zoom-indicator">
          {zoomLevel > 0 ? '+' : ''}{zoomLevel * 2}px ({Math.round((settings.fontSize + zoomLevel * 2) / settings.fontSize * 100)}%)
        </div>
      )}
      
      {/* Terminal Container */}
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0
        }}
      />
    </div>
  )
})
