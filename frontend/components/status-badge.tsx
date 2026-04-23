import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { StatusBadgeProps } from '@/lib/types'

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

  const isLiveOrActive = normalized === 'live' || normalized === 'active'

  return (
    <Badge
      variant={variantMap[normalized] || 'outline'}
      className={cn(
        className,
        isLiveOrActive && 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
      )}
    >
      {label}
    </Badge>
  )
}
