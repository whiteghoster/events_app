import { cn } from '@/lib/utils'
import type { EventStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: EventStatus | 'Active' | 'Inactive'
  size?: 'sm' | 'md'
  className?: string
}

const statusConfig = {
  Live: {
    dot: 'bg-success',
    text: 'text-success',
    border: 'border-success/30',
    bg: 'bg-success/10',
  },
  Hold: {
    dot: 'bg-warning',
    text: 'text-warning',
    border: 'border-warning/30',
    bg: 'bg-warning/10',
  },
  Finished: {
    dot: 'bg-finished',
    text: 'text-finished',
    border: 'border-finished/30',
    bg: 'bg-finished/10',
  },
  Active: {
    dot: 'bg-success',
    text: 'text-success',
    border: 'border-transparent',
    bg: 'bg-transparent',
  },
  Inactive: {
    dot: 'bg-finished',
    text: 'text-finished',
    border: 'border-transparent',
    bg: 'bg-transparent',
  },
}

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const config = statusConfig[status]
  
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
      {status.toUpperCase()}
    </span>
  )
}
