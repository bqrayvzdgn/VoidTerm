import type { CommandBlock } from '../../types'
import { formatDuration } from '../../utils/shell-integration'

interface StickyCommandHeaderProps {
  block: CommandBlock | null
  isAtBottom: boolean
  onScrollToCommand: (blockId: string) => void
}

/**
 * Sticky header that shows the currently-visible command when scrolled up.
 * Hides when viewport is at the bottom (following latest output).
 */
export function StickyCommandHeader({ block, isAtBottom, onScrollToCommand }: StickyCommandHeaderProps) {
  if (!block || isAtBottom || !block.command) return null

  const isSuccess = block.exitCode === 0
  const duration = block.endTime && block.startTime
    ? formatDuration(block.endTime - block.startTime)
    : null

  return (
    <div
      className="sticky-command-header"
      onClick={() => onScrollToCommand(block.id)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 12px',
        fontSize: 12,
        fontFamily: 'monospace',
        backgroundColor: 'rgba(30, 30, 46, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)'
      }}
    >
      <span style={{
        color: isSuccess ? '#22c55e' : '#ef4444',
        fontWeight: 'bold'
      }}>
        {isSuccess ? '\u2713' : `\u2717 ${block.exitCode}`}
      </span>

      <span style={{
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: 'rgba(255, 255, 255, 0.8)'
      }}>
        $ {block.command}
      </span>

      {duration && (
        <span style={{ color: 'rgba(255, 255, 255, 0.5)', flexShrink: 0 }}>
          {duration}
        </span>
      )}
    </div>
  )
}
