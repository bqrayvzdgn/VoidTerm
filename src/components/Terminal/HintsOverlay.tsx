import type { HintMatch } from '../../hooks/useHintsMode'

interface HintsOverlayProps {
  hints: HintMatch[]
  inputBuffer: string
  charWidth: number
  lineHeight: number
}

/**
 * Overlay that renders hint labels at exact character positions
 * in the terminal viewport during hints/quick-select mode.
 */
export function HintsOverlay({ hints, inputBuffer, charWidth, lineHeight }: HintsOverlayProps) {
  if (hints.length === 0) return null

  return (
    <div
      className="hints-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        pointerEvents: 'none',
        backgroundColor: 'rgba(0, 0, 0, 0.3)'
      }}
    >
      {hints.map((hint) => (
        <div
          key={`${hint.label}-${hint.x}-${hint.y}`}
          style={{
            position: 'absolute',
            left: hint.x * charWidth,
            top: hint.y * lineHeight,
            display: 'inline-flex',
            alignItems: 'center',
            pointerEvents: 'auto'
          }}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '1px 4px',
              borderRadius: 3,
              fontSize: 11,
              fontWeight: 'bold',
              fontFamily: 'monospace',
              backgroundColor: '#f59e0b',
              color: '#000',
              lineHeight: '1.2',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
            }}
          >
            {hint.label.split('').map((char, i) => (
              <span
                key={i}
                style={{
                  opacity: i < inputBuffer.length ? 0.4 : 1
                }}
              >
                {char}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}
