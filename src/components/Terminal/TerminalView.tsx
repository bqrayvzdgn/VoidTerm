import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useState, useMemo } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { SearchAddon } from '@xterm/addon-search'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { LigaturesAddon } from '@xterm/addon-ligatures'
import { SerializeAddon } from '@xterm/addon-serialize'
import { useSettingsStore } from '../../store/settingsStore'
import { useTerminalStore } from '../../store/terminalStore'
import { useToastStore } from '../../store/toastStore'
import { mapThemeToXterm } from '../../utils/theme'
import { isValidExternalUrl } from '../../utils/url'
import { terminalLogger } from '../../utils/logger'
import { terminalRegistry } from '../../utils/terminalRegistry'
import { createInitialState, parseOsc633, processEvent } from '../../utils/shell-integration'
import type { ShellIntegrationState } from '../../utils/shell-integration'
import { SearchBar } from './SearchBar'
import {
  MIN_FONT_SIZE,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL,
  ZOOM_STEP,
  RESIZE_DEBOUNCE_DELAY
} from '../../constants'
import '@xterm/xterm/css/xterm.css'

interface TerminalViewProps {
  ptyId: string
  terminalId?: string
  onTitleChange?: (title: string) => void
  onNavigatePane?: (direction: 'up' | 'down' | 'left' | 'right') => void
  onNextTab?: () => void
  onPrevTab?: () => void
}

export interface TerminalViewHandle {
  focus: () => void
  search: (text: string, findNext?: boolean) => boolean
  clearSearch: () => void
  copy: () => void
  paste: () => void
  getBufferContent: () => string
  serialize: () => string
}

// Track which terminal last opened a context menu so broadcast events
// only affect the correct terminal instance.
let contextMenuPtyId: string | null = null

export const TerminalView = forwardRef<TerminalViewHandle, TerminalViewProps>(
  ({ ptyId, terminalId, onTitleChange, onNavigatePane, onNextTab, onPrevTab }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const terminalRef = useRef<Terminal | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)
    const searchAddonRef = useRef<SearchAddon | null>(null)
    const serializeAddonRef = useRef<SerializeAddon | null>(null)
    const webglAddonRef = useRef<WebglAddon | null>(null)
    const ligaturesAddonRef = useRef<LigaturesAddon | null>(null)
    const shellIntegrationRef = useRef<ShellIntegrationState>(createInitialState())
    const settings = useSettingsStore((s) => s.settings)
    const currentTheme = useSettingsStore((s) => s.currentTheme)
    const setTerminalCwd = useTerminalStore((s) => s.setTerminalCwd)

    const [showSearch, setShowSearch] = useState(false)
    const zoomLevelRef = useRef(0)
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useImperativeHandle(
      ref,
      () => ({
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
        },
        getBufferContent: () => {
          const terminal = terminalRef.current
          if (!terminal) return ''
          const buffer = terminal.buffer.active
          const lines: string[] = []
          for (let i = 0; i < buffer.length; i++) {
            const line = buffer.getLine(i)
            if (line) {
              lines.push(line.translateToString(true))
            }
          }
          return lines.join('\n')
        },
        serialize: () => {
          if (serializeAddonRef.current) {
            return serializeAddonRef.current.serialize()
          }
          return ''
        }
      }),
      [ptyId]
    )

    const handleResize = useCallback(() => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }

      // Immediate fit so the terminal adapts quickly (e.g. after split)
      if (fitAddonRef.current && terminalRef.current) {
        fitAddonRef.current.fit()
      }

      // Debounce the PTY resize notification to avoid flooding during drag
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

      // Clear any leftover DOM from previous mount (React.StrictMode double-mount)
      containerRef.current.innerHTML = ''

      const terminal = new Terminal({
        cursorBlink: settings.cursorBlink,
        cursorStyle: settings.cursorStyle,
        cursorInactiveStyle: 'outline',
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

      // Serialize addon (Phase A — buffer persistence)
      const serializeAddon = new SerializeAddon()
      terminal.loadAddon(serializeAddon)
      serializeAddonRef.current = serializeAddon

      terminal.open(containerRef.current)

      try {
        const webglAddon = new WebglAddon()
        webglAddon.onContextLoss(() => {
          webglAddon.dispose()
          webglAddonRef.current = null
        })
        terminal.loadAddon(webglAddon)
        webglAddonRef.current = webglAddon
      } catch {
        terminalLogger.warn('WebGL addon failed to load, falling back to canvas renderer')
        useToastStore.getState().info('WebGL unavailable, using canvas renderer. Performance may be reduced.')
      }

      try {
        const ligaturesAddon = new LigaturesAddon()
        terminal.loadAddon(ligaturesAddon)
        ligaturesAddonRef.current = ligaturesAddon
      } catch {
        // Ligatures addon requires specific font support
      }

      // OSC 633 shell integration parser (Phase B)
      if (settings.shellIntegration && terminalId) {
        const currentTerminalId = terminalId
        terminal.parser.registerOscHandler(633, (data) => {
          const currentLine = terminal.buffer.active.cursorY + terminal.buffer.active.baseY
          const event = parseOsc633(data, currentLine)
          if (event) {
            const result = processEvent(shellIntegrationRef.current, event)
            shellIntegrationRef.current = result.state

            if (event.type === 'cwd-changed') {
              setTerminalCwd(currentTerminalId, event.cwd)
            }
          }
          return true
        })
      }

      terminalRef.current = terminal
      fitAddonRef.current = fitAddon
      searchAddonRef.current = searchAddon
      terminalRegistry.register(ptyId, terminal)
      // Also register by terminalId for lookup by either key
      if (terminalId) {
        terminalRegistry.registerAlias(terminalId, terminal)
      }

      terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        const isCtrl = e.ctrlKey || e.metaKey

        if (isCtrl && e.key === 'f') {
          e.preventDefault()
          setShowSearch((prev) => !prev)
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
          navigator.clipboard
            .readText()
            .then((text) => {
              if (text) {
                window.electronAPI.ptyWrite(ptyId, text)
              }
            })
            .catch((error) => {
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

        // Ctrl+Shift+W: let it pass through to window-level handler (useKeyboardShortcuts)

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
          const newZoom = Math.min(zoomLevelRef.current + 1, MAX_ZOOM_LEVEL)
          zoomLevelRef.current = newZoom
          terminal.options.fontSize = settings.fontSize + newZoom * ZOOM_STEP
          fitAddonRef.current?.fit()
          return false
        }

        if (isCtrl && (e.key === '-' || e.key === 'Subtract')) {
          e.preventDefault()
          const newZoom = Math.max(zoomLevelRef.current - 1, MIN_ZOOM_LEVEL)
          zoomLevelRef.current = newZoom
          terminal.options.fontSize = Math.max(MIN_FONT_SIZE, settings.fontSize + newZoom * ZOOM_STEP)
          fitAddonRef.current?.fit()
          return false
        }

        if (isCtrl && (e.key === '0' || e.key === 'Numpad0')) {
          e.preventDefault()
          zoomLevelRef.current = 0
          terminal.options.fontSize = settings.fontSize
          fitAddonRef.current?.fit()
          return false
        }

        // Let app-level shortcuts pass through to window handler but don't write to terminal
        if (isCtrl && !e.shiftKey && (e.key === 't' || e.key === 'w' || e.key === ',')) {
          return false
        }
        if (isCtrl && e.shiftKey) {
          const shiftKeys = ['d', 'e', 'b', 'p', 't', 'w']
          if (shiftKeys.includes(e.key.toLowerCase())) {
            return false
          }
        }

        return true
      })

      terminal.onData((data) => {
        window.electronAPI.ptyWrite(ptyId, data)
      })

      terminal.onTitleChange((title) => {
        onTitleChange?.(title)
      })

      terminal.onSelectionChange(() => {
        if (settings.copyOnSelect) {
          const selection = terminal.getSelection()
          if (selection) {
            navigator.clipboard.writeText(selection)
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

      const resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(containerRef.current)

      // Defer initial fit until layout is painted — ensures correct cols/rows
      // after split pane layout is finalized
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (fitAddonRef.current && terminalRef.current) {
            fitAddonRef.current.fit()
            const { cols, rows } = terminalRef.current
            window.electronAPI.ptyResize(ptyId, cols, rows)
          }
        })
      })

      terminal.focus()

      return () => {
        // Wrap each cleanup step in try-catch to ensure all steps run
        try {
          removeDataListener()
        } catch (e) {
          terminalLogger.warn('Cleanup: removeDataListener failed', e)
        }
        try {
          removeExitListener()
        } catch (e) {
          terminalLogger.warn('Cleanup: removeExitListener failed', e)
        }
        try {
          resizeObserver.disconnect()
        } catch (e) {
          terminalLogger.warn('Cleanup: resizeObserver failed', e)
        }

        if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current)

        // Dispose all addons to prevent memory leaks
        try {
          webglAddonRef.current?.dispose()
        } catch {
          /* may already be disposed on context loss */
        }
        try {
          ligaturesAddonRef.current?.dispose()
        } catch (e) {
          terminalLogger.warn('Cleanup: ligaturesAddon failed', e)
        }
        webglAddonRef.current = null
        ligaturesAddonRef.current = null
        serializeAddonRef.current = null

        try {
          terminalRegistry.unregister(ptyId)
        } catch (e) {
          terminalLogger.warn('Cleanup: unregister failed', e)
        }
        if (terminalId) {
          try {
            terminalRegistry.unregisterAlias(terminalId)
          } catch (e) {
            terminalLogger.warn('Cleanup: unregisterAlias failed', e)
          }
        }
        try {
          terminal.dispose()
        } catch (e) {
          terminalLogger.warn('Cleanup: terminal.dispose failed', e)
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      ptyId,
      terminalId,
      onTitleChange,
      handleResize,
      settings.shellIntegration,
      setTerminalCwd
    ])

    useEffect(() => {
      if (terminalRef.current) {
        terminalRef.current.options.cursorBlink = settings.cursorBlink
        terminalRef.current.options.cursorStyle = settings.cursorStyle
        terminalRef.current.options.theme = mapThemeToXterm(currentTheme)
      }
    }, [settings.cursorBlink, settings.cursorStyle, currentTheme])

    useEffect(() => {
      if (terminalRef.current) {
        terminalRef.current.options.fontSize = settings.fontSize
        terminalRef.current.options.fontFamily = settings.fontFamily
        handleResize()
      }
    }, [settings.fontSize, settings.fontFamily, handleResize])

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault()
      contextMenuPtyId = ptyId
      const selection = terminalRef.current?.getSelection()
      window.electronAPI.showTerminalContextMenu({
        hasSelection: !!selection,
        x: e.clientX,
        y: e.clientY
      })
    }, [ptyId])

    useEffect(() => {
      const isTarget = () => contextMenuPtyId === ptyId

      const removeCopyListener = window.electronAPI.onTerminalCopy?.(() => {
        if (!isTarget()) return
        const selection = terminalRef.current?.getSelection()
        if (selection) {
          navigator.clipboard.writeText(selection)
        }
      })

      const removePasteListener = window.electronAPI.onTerminalPaste?.(() => {
        if (!isTarget()) return
        navigator.clipboard
          .readText()
          .then((text) => {
            if (text) {
              window.electronAPI.ptyWrite(ptyId, text)
            }
          })
          .catch((error) => {
            terminalLogger.warn('Clipboard read denied:', error)
          })
      })

      const removeClearListener = window.electronAPI.onTerminalClear?.(() => {
        if (!isTarget()) return
        terminalRef.current?.clear()
      })

      const removeSelectAllListener = window.electronAPI.onTerminalSelectAll?.(() => {
        if (!isTarget()) return
        terminalRef.current?.selectAll()
      })

      const removeSearchListener = window.electronAPI.onTerminalSearch?.(() => {
        if (!isTarget()) return
        setShowSearch((prev) => !prev)
      })

      const removeResetListener = window.electronAPI.onTerminalReset?.(() => {
        if (!isTarget()) return
        terminalRef.current?.reset()
      })

      return () => {
        removeCopyListener?.()
        removePasteListener?.()
        removeClearListener?.()
        removeSelectAllListener?.()
        removeSearchListener?.()
        removeResetListener?.()
      }
    }, [ptyId])

    const wrapperStyle = useMemo(
      () => ({
        width: '100%' as const,
        height: '100%' as const,
        display: 'flex' as const,
        flexDirection: 'column' as const,
        backgroundColor: currentTheme.colors.background,
        position: 'relative' as const
      }),
      [currentTheme.colors.background]
    )

    const containerStyle = useMemo(
      () => ({
        flex: 1,
        width: '100%',
        minHeight: 0
      }),
      []
    )

    return (
      <div style={wrapperStyle}>
        {showSearch && (
          <SearchBar searchAddon={searchAddonRef.current} terminal={terminalRef.current} onClose={handleSearchClose} />
        )}

        <div
          ref={containerRef}
          onContextMenu={handleContextMenu}
          role="region"
          aria-label="Terminal"
          style={containerStyle}
        />
      </div>
    )
  }
)

TerminalView.displayName = 'TerminalView'
