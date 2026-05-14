import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { StatusBadgeProps } from '@/lib/types'
import { Circle, CircleCheck, Clock, Ban } from 'lucide-react'

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = (status || 'live').toLowerCase()
  const label = status.toString().toUpperCase()

  const config: Record<string, { icon: any; bg: string; text: string; border: string; dot: string }> = {
    live: {
      icon: CircleCheck,
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    active: {
      icon: CircleCheck,
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    hold: {
      icon: Clock,
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    finished: {
      icon: Circle,
      bg: 'bg-slate-50 dark:bg-slate-950/30',
      text: 'text-slate-700 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-800',
      dot: 'bg-slate-400',
    },
    inactive: {
      icon: Ban,
      bg: 'bg-gray-50 dark:bg-gray-950/30',
      text: 'text-gray-700 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-800',
      dot: 'bg-gray-400',
    },
  }

  const conf = config[normalized] || config.live
  const Icon = conf.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium px-2.5 py-1 transition-all hover:opacity-80',
        conf.bg,
        conf.text,
        conf.border,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      <span className="relative flex items-center">
        <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', conf.dot)} />
        {label}
      </span>
    </Badge>
  )
}
