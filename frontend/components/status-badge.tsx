import { Badge } from '@/components/ui/badge'
import type { EventStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: EventStatus | 'active' | 'inactive' | 'Active' | 'Inactive'
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = (status || 'live').toLowerCase()
  const label = status.toString().toUpperCase()

  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    live: 'default',
    active: 'default',
    hold: 'secondary',
    finished: 'outline',
    inactive: 'secondary',
  }

  return (
    <Badge variant={variantMap[normalized] || 'outline'} className={className}>
      {label}
    </Badge>
  )
}
