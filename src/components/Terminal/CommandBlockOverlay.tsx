import { useMemo } from 'react'
import type { CommandBlock } from '../../types'
import { formatDuration } from '../../utils/shell-integration'

interface CommandBlockOverlayProps {
  commandBlocks: CommandBlock[]
  onScrollToCommand?: (blockId: string) => void
}

/**
 * Overlay that renders command block decorations (exit code badge, duration)
 * in the terminal gutter area.
 */
export function CommandBlockOverlay({ commandBlocks, onScrollToCommand: _onScrollToCommand }: CommandBlockOverlayProps) {
  const recentBlocks = useMemo(() => {
    // Only show the last 50 blocks to avoid performance issues
    return commandBlocks.slice(-50)
  }, [commandBlocks])

  if (recentBlocks.length === 0) return null

  return (
    <div
      className="command-block-overlay"
      style={{
        position: 'absolute',
        top: 0,
        right: 8,
        zIndex: 5,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
    >
      {/* Recent command block summaries in a compact list */}
    </div>
  )
}

interface CommandBlockBadgeProps {
  block: CommandBlock
  onClick?: () => void
}

export function CommandBlockBadge({ block, onClick }: CommandBlockBadgeProps) {
  const isSuccess = block.exitCode === 0
  const duration = block.endTime && block.startTime
    ? formatDuration(block.endTime - block.startTime)
    : null

  return (
    <div
      className="command-block-badge"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontFamily: 'monospace',
        cursor: onClick ? 'pointer' : 'default',
        pointerEvents: onClick ? 'auto' : 'none',
        backgroundColor: isSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        color: isSuccess ? '#22c55e' : '#ef4444',
        border: `1px solid ${isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
      }}
    >
      <span>{isSuccess ? '\u2713' : '\u2717'}</span>
      {block.exitCode !== null && block.exitCode !== 0 && (
        <span style={{ opacity: 0.8 }}>({block.exitCode})</span>
      )}
      {duration && (
        <span style={{ opacity: 0.7, color: 'inherit' }}>{duration}</span>
      )}
      {block.command && (
        <span style={{ opacity: 0.6, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {block.command}
        </span>
      )}
    </div>
  )
}
