import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { createLogger } from '../../utils/logger'

const logger = createLogger('TerminalErrorBoundary')

interface Props {
  children: ReactNode
  terminalId?: string
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Granular error boundary for individual terminal panels.
 * Catches render errors in a single terminal without crashing the entire app.
 */
export class TerminalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`Terminal ${this.props.terminalId || 'unknown'} crashed:`, error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="terminal-error-boundary">
          <div className="terminal-error-content">
            <AlertTriangle size={24} strokeWidth={1.5} />
            <p>Terminal crashed</p>
            <span className="terminal-error-message">{this.state.error?.message}</span>
            <button className="terminal-error-retry" onClick={this.handleRetry}>
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
