import { useEffect, useState } from 'react'
import { Minus, Square, Copy, X } from 'lucide-react'

export function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const removeListener = window.electronAPI.onWindowMaximized((maximized) => {
      setIsMaximized(maximized)
    })
    return () => removeListener()
  }, [])

  const handleMinimize = () => window.electronAPI.windowMinimize()
  const handleMaximize = () => window.electronAPI.windowMaximize()
  const handleClose = () => window.electronAPI.windowClose()

  return (
    <div className="tabbar-controls">
      <button className="window-btn" onClick={handleMinimize} title="Minimize">
        <Minus size={16} strokeWidth={1.5} />
      </button>
      <button className="window-btn" onClick={handleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
        {isMaximized ? <Copy size={14} strokeWidth={1.5} /> : <Square size={14} strokeWidth={1.5} />}
      </button>
      <button className="window-btn close" onClick={handleClose} title="Close">
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  )
}
