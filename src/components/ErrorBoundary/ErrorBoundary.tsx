import { Component, ErrorInfo, ReactNode } from 'react'
import { useI18n, type TranslationKeys } from '../../i18n'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Uygulama genelinde hataları yakalayan ve kullanıcıya anlamlı
 * mesajlar gösteren Error Boundary bileşeni.
 * 
 * i18n desteği ile çoklu dil destekler.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  /**
   * Zustand store'dan çevirileri al (class component için)
   */
  private getTranslations(): TranslationKeys {
    return useI18n.getState().t
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleResetConfig = async () => {
    try {
      if (window.electronAPI?.config?.reset) {
        await window.electronAPI.config.reset()
      }
      window.location.reload()
    } catch (e) {
      console.error('Failed to reset config:', e)
      window.location.reload()
    }
  }

  handleCopyError = () => {
    const t = this.getTranslations()
    const errorText = `
${t.errorBoundary.errorReport}
=====================
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
    `.trim()

    navigator.clipboard.writeText(errorText).then(() => {
      alert(t.errorBoundary.errorCopied)
    }).catch(console.error)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const t = this.getTranslations()

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="error-boundary-icon"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2 className="error-boundary-title">{t.errorBoundary.title}</h2>
            <p className="error-boundary-message">
              {this.state.error?.message || t.errorBoundary.message}
            </p>
            <div className="error-boundary-actions">
              <button
                className="error-boundary-btn primary"
                onClick={this.handleReload}
              >
                {t.errorBoundary.reload}
              </button>
              <button
                className="error-boundary-btn secondary"
                onClick={this.handleReset}
              >
                {t.errorBoundary.tryAgain}
              </button>
            </div>
            <div className="error-boundary-secondary-actions">
              <button
                className="error-boundary-btn-link"
                onClick={this.handleResetConfig}
              >
                {t.errorBoundary.resetConfig}
              </button>
              <button
                className="error-boundary-btn-link"
                onClick={this.handleCopyError}
              >
                {t.errorBoundary.copyError}
              </button>
            </div>
            {this.state.errorInfo && (
              <details className="error-boundary-details">
                <summary>{t.errorBoundary.errorDetails}</summary>
                <pre>{this.state.error?.stack}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
