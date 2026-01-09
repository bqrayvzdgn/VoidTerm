import React, { useState, useCallback, useRef, useEffect } from 'react'
import type { Pane } from '../../types'
import { TerminalView } from '../Terminal/TerminalView'

interface SplitPaneProps {
  pane: Pane
  onTerminalTitleChange?: (terminalId: string, title: string) => void
  onTerminalFocus?: (terminalId: string) => void
  ptyIds: Map<string, string>
  activeTerminalId?: string | null
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  pane,
  onTerminalTitleChange,
  onTerminalFocus,
  ptyIds,
  activeTerminalId
}) => {
  const [ratio, setRatio] = useState(pane.ratio || 0.5)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = pane.direction === 'vertical' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }, [pane.direction])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      let newRatio: number

      if (pane.direction === 'vertical') {
        newRatio = (e.clientX - rect.left) / rect.width
      } else {
        newRatio = (e.clientY - rect.top) / rect.height
      }

      newRatio = Math.max(0.1, Math.min(0.9, newRatio))
      setRatio(newRatio)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [pane.direction])

  // Handle terminal click to focus
  const handleTerminalClick = useCallback((terminalId: string) => {
    onTerminalFocus?.(terminalId)
  }, [onTerminalFocus])

  if (pane.type === 'terminal') {
    const ptyId = ptyIds.get(pane.terminalId || '')
    const isActive = pane.terminalId === activeTerminalId

    if (!ptyId) {
      return (
        <div className="terminal-wrapper">
          <div className="terminal-loading">Connecting...</div>
        </div>
      )
    }

    return (
      <div
        className={`terminal-wrapper ${isActive ? 'active' : ''}`}
        onClick={() => pane.terminalId && handleTerminalClick(pane.terminalId)}
      >
        <TerminalView
          ptyId={ptyId}
          onTitleChange={(title) => pane.terminalId && onTerminalTitleChange?.(pane.terminalId, title)}
        />
      </div>
    )
  }

  if (pane.type === 'split' && pane.children && pane.children.length >= 2) {
    const [first, second] = pane.children

    return (
      <div
        ref={containerRef}
        className={`split-pane ${pane.direction}`}
      >
        <div
          className="split-pane-panel"
          style={{
            [pane.direction === 'vertical' ? 'width' : 'height']: `calc(${ratio * 100}% - 2px)`
          }}
        >
          <SplitPane
            pane={first}
            onTerminalTitleChange={onTerminalTitleChange}
            onTerminalFocus={onTerminalFocus}
            ptyIds={ptyIds}
            activeTerminalId={activeTerminalId}
          />
        </div>
        <div
          className="split-pane-divider"
          onMouseDown={handleMouseDown}
        />
        <div
          className="split-pane-panel"
          style={{
            [pane.direction === 'vertical' ? 'width' : 'height']: `calc(${(1 - ratio) * 100}% - 2px)`
          }}
        >
          <SplitPane
            pane={second}
            onTerminalTitleChange={onTerminalTitleChange}
            onTerminalFocus={onTerminalFocus}
            ptyIds={ptyIds}
            activeTerminalId={activeTerminalId}
          />
        </div>
      </div>
    )
  }

  return null
}
