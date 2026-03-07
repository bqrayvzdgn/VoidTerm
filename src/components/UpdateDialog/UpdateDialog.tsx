import { useState, useEffect, useCallback } from 'react'
import { Download, RefreshCw, X, AlertCircle } from 'lucide-react'

interface UpdateInfo {
  version: string
  releaseNotes?: string
}

interface UpdateDialogProps {
  isOpen: boolean
  onClose: () => void
}

type UpdateState = 'available' | 'downloading' | 'downloaded' | 'error'

export function UpdateDialog({ isOpen, onClose }: UpdateDialogProps) {
  const [state, setState] = useState<UpdateState>('available')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState({ percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !window.electronAPI?.updates) return

    const cleanups: (() => void)[] = []

    const status = window.electronAPI.updates.getStatus()
    status.then((s) => {
      if (s.updateInfo) setUpdateInfo(s.updateInfo)
    })

    cleanups.push(
      window.electronAPI.updates.onAvailable((info) => {
        setUpdateInfo(info)
        setState('available')
      })
    )

    cleanups.push(
      window.electronAPI.updates.onProgress((p) => {
        setProgress(p)
        setState('downloading')
      })
    )

    cleanups.push(
      window.electronAPI.updates.onDownloaded((info) => {
        setUpdateInfo(info)
        setState('downloaded')
      })
    )

    cleanups.push(
      window.electronAPI.updates.onError((err) => {
        setError(err.message)
        setState('error')
      })
    )

    return () => cleanups.forEach((fn) => fn())
  }, [isOpen])

  const handleDownload = useCallback(() => {
    window.electronAPI?.updates?.downloadUpdate()
    setState('downloading')
  }, [])

  const handleInstall = useCallback(() => {
    window.electronAPI?.updates?.installUpdate()
  }, [])

  if (!isOpen) return null

  return (
    <div className="update-dialog-overlay" onClick={onClose}>
      <div className="update-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="update-dialog-header">
          <h3>Update Available</h3>
          <button className="update-dialog-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="update-dialog-body">
          {updateInfo && (
            <div className="update-dialog-version">
              <strong>Version {updateInfo.version}</strong>
            </div>
          )}

          {updateInfo?.releaseNotes && (
            <div className="update-dialog-notes">
              <p>{updateInfo.releaseNotes}</p>
            </div>
          )}

          {state === 'downloading' && (
            <div className="update-dialog-progress">
              <div className="update-progress-bar">
                <div className="update-progress-fill" style={{ width: `${progress.percent}%` }} />
              </div>
              <span className="update-progress-text">
                {Math.round(progress.percent)}% - {formatBytes(progress.bytesPerSecond)}/s
              </span>
            </div>
          )}

          {state === 'error' && (
            <div className="update-dialog-error">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="update-dialog-footer">
          <button className="update-dialog-btn secondary" onClick={onClose}>
            Later
          </button>
          {state === 'available' && (
            <button className="update-dialog-btn primary" onClick={handleDownload}>
              <Download size={14} />
              Download
            </button>
          )}
          {state === 'downloaded' && (
            <button className="update-dialog-btn primary" onClick={handleInstall}>
              <RefreshCw size={14} />
              Install & Restart
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}
