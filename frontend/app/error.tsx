'use client'

import { useEffect } from 'react'
import { Icon } from '@/components/icon'
import { AlertCircleIcon, Refresh01Icon, Home01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-destructive/5">
      <Card className="max-w-md w-full shadow-lg border-destructive/20">
        <CardContent className="p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="relative">
              <div className="p-3 bg-destructive/10 rounded-full">
                <img
                  src="/icon.svg"
                  alt="FloraEvent"
                  className="w-10 h-10 rounded-lg opacity-80"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-card rounded-full border border-destructive/20">
                <Icon icon={AlertCircleIcon} size={16} className="text-destructive" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Please try again or go back to the home page.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-left">
              <p className="text-xs font-mono text-destructive break-words">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={reset} className="flex-1">
              <Icon icon={Refresh01Icon} size={16} className="mr-2" />
              Try Again
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => window.location.href = '/'}>
              <Icon icon={Home01Icon} size={16} className="mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
