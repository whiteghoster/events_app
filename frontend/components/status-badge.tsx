import { cn } from '@/lib/utils'
import type { EventStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  status: EventStatus | 'Active' | 'Inactive'
  size?: 'sm' | 'md'
  className?: string
}

const statusConfig = {
  live: {
    variant: 'default' as const,
    className: 'bg-success/10 text-success border-success/30 hover:bg-success/20',
  },
  hold: {
    variant: 'default' as const,
    className: 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20',
  },
  finished: {
    variant: 'default' as const,
    className: 'bg-finished/10 text-finished border-finished/30 hover:bg-finished/20',
  },
  active: {
    variant: 'default' as const,
    className: 'bg-success/10 text-success border-success/30 hover:bg-success/20',
  },
  inactive: {
    variant: 'secondary' as const,
    className: 'bg-muted text-muted-foreground',
  },
}

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const normalizedStatus = (status || 'live').toLowerCase() as keyof typeof statusConfig
  const config = statusConfig[normalizedStatus] || statusConfig.live
  const displayStatus = String(status).toUpperCase()

  return (
    <Badge
      variant={config.variant}
      className={cn(
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
    >
      {displayStatus}
    </Badge>
  )
}

