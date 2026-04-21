'use client'

import { useEffect } from 'react'
import { Icon } from '@/components/icon'
import { AlertCircleIcon, Refresh01Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-destructive/10 rounded-full">
              <Icon icon={AlertCircleIcon} size={32} className="text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              This section encountered an error. You can try again or navigate back.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-destructive/5 border border-destructive/20 rounded p-3 text-left">
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
            <Button variant="outline" className="flex-1" onClick={() => window.history.back()}>
              <Icon icon={ArrowLeft01Icon} size={16} className="mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
