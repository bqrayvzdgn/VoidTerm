import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { SearchAddon } from '@xterm/addon-search'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { LigaturesAddon } from '@xterm/addon-ligatures'
import { useSettingsStore } from '../../store/settingsStore'
import { mapThemeToXterm } from '../../utils/theme'
import { isValidExternalUrl } from '../../utils/url'
import { terminalLogger } from '../../utils/logger'
import { SearchBar } from './SearchBar'
import { COPY_FEEDBACK_DURATION, MIN_FONT_SIZE, MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL, ZOOM_STEP, RESIZE_DEBOUNCE_DELAY } from '../../constants'
import '@xterm/xterm/css/xterm.css'

interface TerminalViewProps {
  ptyId: string
  onTitleChange?: (title: string) => void
  isActive?: boolean
  onNavigatePane?: (direction: 'up' | 'down' | 'left' | 'right') => void
  onClosePane?: () => void
  onNextTab?: () => void
  onPrevTab?: () => void
  broadcastMode?: boolean
  onBroadcastInput?: (data: string) => void
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
  onPrevTab,
  broadcastMode,
  onBroadcastInput
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const searchAddonRef = useRef<SearchAddon | null>(null)
  const { settings, currentTheme } = useSettingsStore()

  const [showSearch, setShowSearch] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(0)
  const [showCopyFeedback, setShowCopyFeedback] = useState(false)
  const copyFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const triggerCopyFeedback = useCallback(() => {
    if (copyFeedbackTimeoutRef.current) {
      clearTimeout(copyFeedbackTimeoutRef.current)
    }
    setShowCopyFeedback(true)
    copyFeedbackTimeoutRef.current = setTimeout(() => setShowCopyFeedback(false), COPY_FEEDBACK_DURATION)
  }, [])

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
        terminalLogger.error('Failed to paste:', error)
      }
    }
  }), [ptyId])

  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }

    resizeTimeoutRef.current = setTimeout(() => {
      if (fitAddonRef.current && terminalRef.current) {
        fitAddonRef.current.fit()
        const { cols, rows } = terminalRef.current
        window.electronAPI.ptyResize(ptyId, cols, rows)
      }
    }, RESIZE_DEBOUNCE_DELAY)
  }, [ptyId])

  const handleSearchClose = useCallback(() => {
    setShowSearch(false)
    terminalRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new Terminal({
      cursorBlink: settings.cursorBlink,
      cursorStyle: settings.cursorStyle,
      cursorInactiveStyle: 'none',
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      scrollback: settings.scrollback,
      theme: mapThemeToXterm(currentTheme),
      allowTransparency: true,
      rightClickSelectsWord: true
    })

    const fitAddon = new FitAddon()
    const searchAddon = new SearchAddon()
    const webLinksAddon = new WebLinksAddon((_event, uri) => {
      // Validate URL before opening to prevent XSS/protocol injection
      if (isValidExternalUrl(uri)) {
        window.electronAPI.openExternal?.(uri)
      }
    })

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(searchAddon)
    terminal.loadAddon(webLinksAddon)

    terminal.open(containerRef.current)

    try {
      const webglAddon = new WebglAddon()
      webglAddon.onContextLoss(() => {
        webglAddon.dispose()
      })
      terminal.loadAddon(webglAddon)
    } catch {
      terminalLogger.warn('WebGL addon failed to load, falling back to canvas renderer')
    }

    try {
      const ligaturesAddon = new LigaturesAddon()
      terminal.loadAddon(ligaturesAddon)
    } catch {
      // Ligatures addon requires specific font support
    }

    fitAddon.fit()

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon
    searchAddonRef.current = searchAddon

    terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey

      if (isCtrl && e.key === 'f') {
        e.preventDefault()
        setShowSearch(prev => !prev)
        return false
      }

      if (isCtrl && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault()
        const selection = terminal.getSelection()
        if (selection) {
          navigator.clipboard.writeText(selection)
        }
        return false
      }

      if (isCtrl && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault()
        navigator.clipboard.readText().then(text => {
          if (text) {
            window.electronAPI.ptyWrite(ptyId, text)
          }
        }).catch((error) => {
          terminalLogger.warn('Clipboard read denied:', error)
        })
        return false
      }

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

      if (isCtrl && e.shiftKey && (e.key === 'W' || e.key === 'w')) {
        e.preventDefault()
        onClosePane?.()
        return false
      }

      if (isCtrl && e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) {
          onPrevTab?.()
        } else {
          onNextTab?.()
        }
        return false
      }

      if (isCtrl && (e.key === '+' || e.key === '=' || e.key === 'Add')) {
        e.preventDefault()
        setZoomLevel(prev => {
          const newZoom = Math.min(prev + 1, MAX_ZOOM_LEVEL)
          const newFontSize = settings.fontSize + (newZoom * ZOOM_STEP)
          terminal.options.fontSize = newFontSize
          fitAddonRef.current?.fit()
          return newZoom
        })
        return false
      }

      if (isCtrl && (e.key === '-' || e.key === 'Subtract')) {
        e.preventDefault()
        setZoomLevel(prev => {
          const newZoom = Math.max(prev - 1, MIN_ZOOM_LEVEL)
          const newFontSize = settings.fontSize + (newZoom * ZOOM_STEP)
          terminal.options.fontSize = Math.max(MIN_FONT_SIZE, newFontSize)
          fitAddonRef.current?.fit()
          return newZoom
        })
        return false
      }

      if (isCtrl && (e.key === '0' || e.key === 'Numpad0')) {
        e.preventDefault()
        setZoomLevel(0)
        terminal.options.fontSize = settings.fontSize
        fitAddonRef.current?.fit()
        return false
      }

      return true
    })

    terminal.onData((data) => {
      window.electronAPI.ptyWrite(ptyId, data)
      if (broadcastMode && onBroadcastInput) {
        onBroadcastInput(data)
      }
    })

    terminal.onTitleChange((title) => {
      onTitleChange?.(title)
    })

    terminal.onSelectionChange(() => {
      if (settings.copyOnSelect) {
        const selection = terminal.getSelection()
        if (selection) {
          navigator.clipboard.writeText(selection)
          triggerCopyFeedback()
        }
      }
    })

    const removeDataListener = window.electronAPI.onPtyData((id, data) => {
      if (id === ptyId) {
        terminal.write(data)
      }
    })

    const removeExitListener = window.electronAPI.onPtyExit((id, exitCode) => {
      if (id === ptyId) {
        terminal.write(`\r\n\x1b[90mProcess exited with code ${exitCode}\x1b[0m\r\n`)
      }
    })

    const { cols, rows } = terminal
    window.electronAPI.ptyResize(ptyId, cols, rows)

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.current)

    terminal.focus()

    return () => {
      removeDataListener()
      removeExitListener()
      resizeObserver.disconnect()
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      terminal.dispose()
    }
  }, [ptyId, onTitleChange, handleResize, triggerCopyFeedback])

  useEffect(() => {
    if (isActive && terminalRef.current && !showSearch) {
      terminalRef.current.focus()
    }
  }, [isActive, showSearch])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.cursorBlink = settings.cursorBlink
      terminalRef.current.options.cursorStyle = settings.cursorStyle
      terminalRef.current.options.fontSize = settings.fontSize
      terminalRef.current.options.fontFamily = settings.fontFamily
      terminalRef.current.options.theme = mapThemeToXterm(currentTheme)
      handleResize()
    }
  }, [settings, currentTheme, handleResize])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const selection = terminalRef.current?.getSelection()
    window.electronAPI.showTerminalContextMenu({
      hasSelection: !!selection,
      x: e.clientX,
      y: e.clientY
    })
  }, [])

  useEffect(() => {
    const removeCopyListener = window.electronAPI.onTerminalCopy?.(() => {
      const selection = terminalRef.current?.getSelection()
      if (selection) {
        navigator.clipboard.writeText(selection)
        triggerCopyFeedback()
      }
    })

    const removePasteListener = window.electronAPI.onTerminalPaste?.(() => {
      navigator.clipboard.readText().then(text => {
        if (text) {
          window.electronAPI.ptyWrite(ptyId, text)
        }
      }).catch((error) => {
        terminalLogger.warn('Clipboard read denied:', error)
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
  }, [ptyId, triggerCopyFeedback])

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
      {showSearch && (
        <SearchBar
          searchAddon={searchAddonRef.current}
          terminal={terminalRef.current}
          onClose={handleSearchClose}
        />
      )}

      {zoomLevel !== 0 && (
        <div className="terminal-zoom-indicator">
          {zoomLevel > 0 ? '+' : ''}{zoomLevel * 2}px ({Math.round((settings.fontSize + zoomLevel * 2) / settings.fontSize * 100)}%)
        </div>
      )}

      {showCopyFeedback && (
        <div className="terminal-copy-feedback">Copied!</div>
      )}

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
