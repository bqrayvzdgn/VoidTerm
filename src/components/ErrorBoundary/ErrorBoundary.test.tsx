import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TerminalErrorBoundary } from './TerminalErrorBoundary'
import { PanelErrorBoundary } from './PanelErrorBoundary'

// Component that throws on render
const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test render error')
  }
  return <div data-testid="child">Content rendered successfully</div>
}

// Suppress console.error for error boundary tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'debug').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('TerminalErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    render(
      <TerminalErrorBoundary>
        <div data-testid="child">Normal content</div>
      </TerminalErrorBoundary>
    )

    expect(screen.getByTestId('child')).toBeDefined()
    expect(screen.getByText('Normal content')).toBeDefined()
  })

  it('should catch errors and show fallback UI', () => {
    render(
      <TerminalErrorBoundary terminalId="test-123">
        <ThrowingComponent />
      </TerminalErrorBoundary>
    )

    expect(screen.getByText('Terminal crashed')).toBeDefined()
    expect(screen.getByText('Test render error')).toBeDefined()
  })

  it('should show retry button', () => {
    render(
      <TerminalErrorBoundary>
        <ThrowingComponent />
      </TerminalErrorBoundary>
    )

    expect(screen.getByText('Retry')).toBeDefined()
  })

  it('should call onReset when retry is clicked', () => {
    const onReset = vi.fn()

    render(
      <TerminalErrorBoundary onReset={onReset}>
        <ThrowingComponent />
      </TerminalErrorBoundary>
    )

    fireEvent.click(screen.getByText('Retry'))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})

describe('PanelErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    render(
      <PanelErrorBoundary panelName="Settings">
        <div data-testid="child">Panel content</div>
      </PanelErrorBoundary>
    )

    expect(screen.getByTestId('child')).toBeDefined()
  })

  it('should catch errors and show panel name in fallback', () => {
    render(
      <PanelErrorBoundary panelName="Settings">
        <ThrowingComponent />
      </PanelErrorBoundary>
    )

    expect(screen.getByText('Settings encountered an error')).toBeDefined()
    expect(screen.getByText('Test render error')).toBeDefined()
  })

  it('should show try again button', () => {
    render(
      <PanelErrorBoundary panelName="SSH Manager">
        <ThrowingComponent />
      </PanelErrorBoundary>
    )

    expect(screen.getByText('Try Again')).toBeDefined()
  })

  it('should call onReset when try again is clicked', () => {
    const onReset = vi.fn()

    render(
      <PanelErrorBoundary panelName="Test" onReset={onReset}>
        <ThrowingComponent />
      </PanelErrorBoundary>
    )

    fireEvent.click(screen.getByText('Try Again'))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('should render custom fallback when provided', () => {
    render(
      <PanelErrorBoundary
        panelName="Custom"
        fallback={<div data-testid="custom-fallback">Custom error UI</div>}
      >
        <ThrowingComponent />
      </PanelErrorBoundary>
    )

    expect(screen.getByTestId('custom-fallback')).toBeDefined()
    expect(screen.getByText('Custom error UI')).toBeDefined()
  })

  it('should handle different panel names', () => {
    const panels = ['Settings', 'SSH Manager', 'Command Palette']

    for (const panelName of panels) {
      const { unmount } = render(
        <PanelErrorBoundary panelName={panelName}>
          <ThrowingComponent />
        </PanelErrorBoundary>
      )

      expect(screen.getByText(`${panelName} encountered an error`)).toBeDefined()
      unmount()
    }
  })
})
