import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {icon && (
        <div className="mb-4 text-primary/60">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-lg text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}

export function FlowerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="8" fill="currentColor" fillOpacity="0.3" />
      <ellipse cx="32" cy="16" rx="6" ry="10" fill="currentColor" fillOpacity="0.5" />
      <ellipse cx="32" cy="48" rx="6" ry="10" fill="currentColor" fillOpacity="0.5" />
      <ellipse cx="16" cy="32" rx="10" ry="6" fill="currentColor" fillOpacity="0.5" />
      <ellipse cx="48" cy="32" rx="10" ry="6" fill="currentColor" fillOpacity="0.5" />
      <ellipse cx="20.7" cy="20.7" rx="6" ry="10" fill="currentColor" fillOpacity="0.5" transform="rotate(-45 20.7 20.7)" />
      <ellipse cx="43.3" cy="43.3" rx="6" ry="10" fill="currentColor" fillOpacity="0.5" transform="rotate(-45 43.3 43.3)" />
      <ellipse cx="43.3" cy="20.7" rx="6" ry="10" fill="currentColor" fillOpacity="0.5" transform="rotate(45 43.3 20.7)" />
      <ellipse cx="20.7" cy="43.3" rx="6" ry="10" fill="currentColor" fillOpacity="0.5" transform="rotate(45 20.7 43.3)" />
      <circle cx="32" cy="32" r="5" fill="currentColor" />
    </svg>
  )
}
