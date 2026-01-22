/**
 * Error Boundary Component
 *
 * Catches unhandled errors in the component tree and displays a fallback UI.
 * Prevents the entire app from crashing and showing a blank page.
 */

import { Component, type ReactNode } from 'react'
import { Button } from './Button'
import { Card } from './Card'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
    // Clear any corrupted cache
    window.location.href = '/'
  }

  handleClearCache = () => {
    // Clear localStorage to reset any corrupted state
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Something Went Wrong
              </h1>
              <p className="text-gray-600 mb-4">
                The application encountered an unexpected error. This may be due to corrupted cache or session data.
              </p>
              {this.state.error && (
                <details className="mb-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              <div className="space-y-2">
                <Button onClick={this.handleReset} variant="primary" fullWidth>
                  Return to Home
                </Button>
                <Button onClick={this.handleClearCache} variant="secondary" fullWidth>
                  Clear Cache & Reload
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
