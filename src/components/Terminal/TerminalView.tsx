import React, { useEffect, useRef, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { SearchAddon } from '@xterm/addon-search'
import { useSettingsStore } from '../../store/settingsStore'
import '@xterm/xterm/css/xterm.css'

interface TerminalViewProps {
  ptyId: string
  onTitleChange?: (title: string) => void
}

export const TerminalView: React.FC<TerminalViewProps> = ({ ptyId, onTitleChange }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const { settings, currentTheme } = useSettingsStore()

  const handleResize = useCallback(() => {
    if (fitAddonRef.current && terminalRef.current) {
      fitAddonRef.current.fit()
      const { cols, rows } = terminalRef.current
      window.electronAPI.ptyResize(ptyId, cols, rows)
    }
  }, [ptyId])

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
      allowTransparency: true
    })

    const fitAddon = new FitAddon()
    const searchAddon = new SearchAddon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(searchAddon)

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

    // Handle terminal input
    terminal.onData((data) => {
      window.electronAPI.ptyWrite(ptyId, data)
    })

    // Handle title changes
    terminal.onTitleChange((title) => {
      onTitleChange?.(title)
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

    return () => {
      removeDataListener()
      removeExitListener()
      resizeObserver.disconnect()
      terminal.dispose()
    }
  }, [ptyId, onTitleChange, handleResize])

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

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: currentTheme.colors.background
      }}
    />
  )
}
