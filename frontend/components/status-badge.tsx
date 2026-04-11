import { cn } from '@/lib/utils'
import type { EventStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: EventStatus | 'Active' | 'Inactive'
  size?: 'sm' | 'md'
  className?: string
}

const statusConfig = {
  live: {
    dot: 'bg-success',
    text: 'text-success',
    border: 'border-success/30',
    bg: 'bg-success/10',
  },
  hold: {
    dot: 'bg-warning',
    text: 'text-warning',
    border: 'border-warning/30',
    bg: 'bg-warning/10',
  },
  finished: {
    dot: 'bg-finished',
    text: 'text-finished',
    border: 'border-finished/30',
    bg: 'bg-finished/10',
  },
  active: {
    dot: 'bg-success',
    text: 'text-success',
    border: 'border-transparent',
    bg: 'bg-transparent',
  },
  inactive: {
    dot: 'bg-finished',
    text: 'text-finished',
    border: 'border-transparent',
    bg: 'bg-transparent',
  },
}


export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  // Defensive check for case-mismatch or unknown statuses
  const normalizedStatus = (status || 'live').toLowerCase() as keyof typeof statusConfig
  const config = statusConfig[normalizedStatus] || statusConfig.live
  
  const displayStatus = String(status).toUpperCase()

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        config.bg,
        config.border,
        config.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {displayStatus}
    </span>
  )
}

