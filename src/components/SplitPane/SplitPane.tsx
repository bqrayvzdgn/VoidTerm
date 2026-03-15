import React, { useState, useCallback, useRef, useEffect, memo } from 'react'
import type { Pane } from '../../types'
import { getActivePaneId, setActivePaneId, subscribeActivePaneId } from '../../store/activePaneStore'
import { terminalRegistry } from '../../utils/terminalRegistry'
import { TerminalView } from '../Terminal/TerminalView'

// Minimum panel size (pixels)
const MIN_PANEL_SIZE = 100
// Divider width in pixels (must match CSS)
const DIVIDER_SIZE = 4
// Resize step (keyboard)
const RESIZE_STEP = 0.05

/**
 * Terminal leaf component — subscribes to active pane store directly
 * so the parent SplitPane tree never re-renders on focus change.
 */
interface TerminalPaneLeafProps {
  pane: Pane
  ptyIds: Map<string, string>
  onTerminalTitleChange?: (terminalId: string, title: string) => void
  onNavigatePane?: (direction: 'up' | 'down' | 'left' | 'right') => void
  onNextTab?: () => void
  onPrevTab?: () => void
}

const TerminalPaneLeaf: React.FC<TerminalPaneLeafProps> = memo(
  ({
    pane,
    ptyIds,
    onTerminalTitleChange,
    onNavigatePane,
    onNextTab,
    onPrevTab
  }) => {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const ptyId = ptyIds.get(pane.terminalId || '')
    const terminalId = pane.terminalId

    // Handle active pane changes imperatively — no React re-render.
    // This subscribes to the external store and directly toggles the CSS class
    // and focuses the terminal, bypassing React's reconciliation entirely.
    useEffect(() => {
      if (!terminalId) return

      const update = () => {
        const isActive = getActivePaneId() === terminalId
        wrapperRef.current?.classList.toggle('active', isActive)

        if (isActive) {
          const term = terminalRegistry.get(terminalId)
          if (term && term.textarea && document.activeElement !== term.textarea) {
            term.focus()
          }
        }
      }

      // Set initial state
      update()

      return subscribeActivePaneId(update)
    }, [terminalId])

    if (!ptyId) {
      return (
        <div className="terminal-wrapper">
          <div className="terminal-loading">Connecting...</div>
        </div>
      )
    }

    return (
      <div
        ref={wrapperRef}
        className="terminal-wrapper"
        onMouseDownCapture={() => terminalId && setActivePaneId(terminalId)}
      >
        <TerminalView
          ptyId={ptyId}
          terminalId={terminalId}
          onTitleChange={(title) => terminalId && onTerminalTitleChange?.(terminalId, title)}
          onNavigatePane={onNavigatePane}
          onNextTab={onNextTab}
          onPrevTab={onPrevTab}
        />
      </div>
    )
  }
)

TerminalPaneLeaf.displayName = 'TerminalPaneLeaf'

interface SplitPaneProps {
  pane: Pane
  onTerminalTitleChange?: (terminalId: string, title: string) => void
  ptyIds: Map<string, string>
  onNavigatePane?: (direction: 'up' | 'down' | 'left' | 'right') => void
  onClosePane?: () => void
  onNextTab?: () => void
  onPrevTab?: () => void
}

export const SplitPane: React.FC<SplitPaneProps> = memo(
  ({
    pane,
    onTerminalTitleChange,
    ptyIds,
    onNavigatePane,
    onClosePane,
    onNextTab,
    onPrevTab
  }) => {
    const [ratio, setRatio] = useState(pane.ratio || 0.5)
    const [isDraggingState, setIsDraggingState] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)

    // Sync ratio when pane is replaced (new layout applied)
    useEffect(() => {
      setRatio(pane.ratio || 0.5)
    }, [pane.id, pane.ratio])

    /**
     * Calculate ratio with minimum size constraint
     */
    const calculateRatio = useCallback(
      (e: MouseEvent): number => {
        if (!containerRef.current) return 0.5

        const rect = containerRef.current.getBoundingClientRect()
        const totalSize = pane.direction === 'vertical' ? rect.width : rect.height
        const position = pane.direction === 'vertical' ? e.clientX - rect.left : e.clientY - rect.top

        // Minimum pixel-based constraint (account for divider width)
        const usableSize = totalSize - DIVIDER_SIZE
        const minRatio = MIN_PANEL_SIZE / usableSize
        const maxRatio = 1 - minRatio

        const newRatio = position / totalSize
        return Math.max(minRatio, Math.min(maxRatio, newRatio))
      },
      [pane.direction]
    )

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        isDragging.current = true
        setIsDraggingState(true)
        document.body.style.cursor = pane.direction === 'vertical' ? 'col-resize' : 'row-resize'
        document.body.style.userSelect = 'none'
      },
      [pane.direction]
    )

    /**
     * Reset ratio on double-click
     */
    const handleDoubleClick = useCallback(() => {
      setRatio(0.5)
    }, [])

    /**
     * Keyboard resizing
     */
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!e.shiftKey) return

        const step = RESIZE_STEP
        if (pane.direction === 'vertical') {
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            setRatio((prev) => Math.max(0.1, prev - step))
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            setRatio((prev) => Math.min(0.9, prev + step))
          }
        } else {
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setRatio((prev) => Math.max(0.1, prev - step))
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setRatio((prev) => Math.min(0.9, prev + step))
          }
        }
      },
      [pane.direction]
    )

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return
        const newRatio = calculateRatio(e)
        setRatio(newRatio)
      }

      const handleMouseUp = () => {
        if (isDragging.current) {
          isDragging.current = false
          setIsDraggingState(false)
          document.body.style.cursor = ''
          document.body.style.userSelect = ''
        }
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }, [calculateRatio])

    if (pane.type === 'terminal') {
      return (
        <TerminalPaneLeaf
          pane={pane}
          ptyIds={ptyIds}
          onTerminalTitleChange={onTerminalTitleChange}
          onNavigatePane={onNavigatePane}
          onNextTab={onNextTab}
          onPrevTab={onPrevTab}
        />
      )
    }

    if (pane.type === 'split' && pane.children && pane.children.length >= 2) {
      const [first, second] = pane.children

      return (
        <div ref={containerRef} className={`split-pane ${pane.direction}`}>
          <div
            className="split-pane-panel"
            style={{
              [pane.direction === 'vertical' ? 'width' : 'height']: `calc(${ratio * 100}% - 2px)`
            }}
          >
            <SplitPane
              pane={first}
              onTerminalTitleChange={onTerminalTitleChange}
              ptyIds={ptyIds}
              onNavigatePane={onNavigatePane}
              onClosePane={onClosePane}
              onNextTab={onNextTab}
              onPrevTab={onPrevTab}
            />
          </div>
          <div
            className={`split-pane-divider ${isDraggingState ? 'dragging' : ''}`}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="separator"
            aria-orientation={pane.direction === 'vertical' ? 'vertical' : 'horizontal'}
            aria-label="Resize panels"
            title="Drag to resize, double-click to reset"
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
              ptyIds={ptyIds}
              onNavigatePane={onNavigatePane}
              onClosePane={onClosePane}
              onNextTab={onNextTab}
              onPrevTab={onPrevTab}
            />
          </div>
        </div>
      )
    }

    return null
  }
)

SplitPane.displayName = 'SplitPane'
