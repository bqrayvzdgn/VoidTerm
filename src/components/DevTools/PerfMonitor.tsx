import { useState, useEffect, useRef } from 'react'
import { useTerminalStore } from '../../store/terminalStore'

export function PerfMonitor() {
  const [visible, setVisible] = useState(false)
  const [fps, setFps] = useState(0)
  const [memory, setMemory] = useState<number | null>(null)
  const [ptyCount, setPtyCount] = useState(0)
  const renderCountRef = useRef(0)
  const frameCountRef = useRef(0)
  const lastFrameTimeRef = useRef(performance.now())

  const terminalCount = useTerminalStore((state) => state.terminals.size)

  // F9 toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault()
        setVisible((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // FPS counter
  useEffect(() => {
    if (!visible) return
    let animId: number

    const countFrame = () => {
      frameCountRef.current++
      animId = requestAnimationFrame(countFrame)
    }
    animId = requestAnimationFrame(countFrame)

    const interval = setInterval(() => {
      const now = performance.now()
      const elapsed = (now - lastFrameTimeRef.current) / 1000
      setFps(Math.round(frameCountRef.current / elapsed))
      frameCountRef.current = 0
      lastFrameTimeRef.current = now

      // Memory (Chrome only)
      const perf = performance as typeof performance & { memory?: { usedJSHeapSize: number } }
      if (perf.memory) {
        setMemory(Math.round(perf.memory.usedJSHeapSize / 1048576))
      }

      // PTY count
      if (window.electronAPI?.ptyGetCount) {
        window.electronAPI
          .ptyGetCount()
          .then(setPtyCount)
          .catch(() => {})
      }
    }, 500)

    return () => {
      cancelAnimationFrame(animId)
      clearInterval(interval)
    }
  }, [visible])

  renderCountRef.current++

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 40,
        right: 8,
        background: 'rgba(0, 0, 0, 0.85)',
        color: '#a6e3a1',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 11,
        fontFamily: 'JetBrains Mono, monospace',
        zIndex: 99999,
        lineHeight: 1.6,
        border: '1px solid rgba(166, 227, 161, 0.2)',
        backdropFilter: 'blur(8px)',
        minWidth: 160,
        userSelect: 'none',
        pointerEvents: 'none'
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#f9e2af' }}>Dev Monitor</div>
      <div>
        FPS: <span style={{ color: fps >= 55 ? '#a6e3a1' : fps >= 30 ? '#f9e2af' : '#f38ba8' }}>{fps}</span>
      </div>
      {memory !== null && <div>Memory: {memory} MB</div>}
      <div>Terminals: {terminalCount}</div>
      <div>PTY: {ptyCount}</div>
      <div>Renders: {renderCountRef.current}</div>
    </div>
  )
}
