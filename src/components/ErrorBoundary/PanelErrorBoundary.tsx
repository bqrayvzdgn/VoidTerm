import { Component, ErrorInfo, ReactNode } from 'react'
import { createLogger } from '../../utils/logger'

const logger = createLogger('PanelErrorBoundary')

interface Props {
  children: ReactNode
  /** Display name for logging (e.g., "Settings", "SSH Manager") */
  panelName: string
  /** Optional custom fallback UI */
  fallback?: ReactNode
  /** Called when the user clicks retry */
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Reusable error boundary for modal panels and sidebars.
 * Prevents errors in Settings, SSH Manager, Command Palette, etc.
 * from crashing the whole application.
 */
export class PanelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`${this.props.panelName} panel error:`, error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="panel-error-boundary">
          <div className="panel-error-content">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3>{this.props.panelName} encountered an error</h3>
            <p className="panel-error-message">{this.state.error?.message}</p>
            <button className="panel-error-retry" onClick={this.handleRetry}>
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
