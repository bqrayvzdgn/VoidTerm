import { useState, useEffect } from 'react'

export function useWindowState() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const removeListener = window.electronAPI.onWindowMaximized((maximized) => {
      setIsMaximized(maximized)
    })
    return () => removeListener()
  }, [])

  return { isMaximized }
}
