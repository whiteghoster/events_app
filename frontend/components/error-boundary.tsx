'use client'

import React, { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, Refresh01Icon } from '@hugeicons/core-free-icons'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error)
    console.error('Error info:', errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-destructive/5">
          <div className="bg-card border border-destructive/20 rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <img
                    src="/icon.svg"
                    alt="FloraEvent"
                    className="w-10 h-10 rounded-lg opacity-80"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 bg-card rounded-full border border-destructive/20">
                  <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-destructive" />
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-foreground mb-2">
              Oops! Something went wrong
            </h1>

            <p className="text-center text-muted-foreground mb-4">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 mb-4">
                <p className="text-xs font-mono text-destructive break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <HugeiconsIcon icon={Refresh01Icon} size={16} />
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
