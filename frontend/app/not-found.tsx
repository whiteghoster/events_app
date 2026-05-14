import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { FileNotFoundIcon, Home01Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-md w-full mx-4 space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-primary/10 rounded-full">
            <HugeiconsIcon icon={FileNotFoundIcon} size={48} className="text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            <HugeiconsIcon icon={Home01Icon} size={16} />
            Go Home
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium text-sm"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            Go to Events
          </Link>
        </div>
      </div>
    </div>
  )
}
