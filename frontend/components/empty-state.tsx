import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@/components/icon'
import { InboxIcon } from '@hugeicons/core-free-icons'
import type { EmptyStateProps } from '@/lib/types'

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed border-2 bg-muted/30', className)}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="mb-6 text-muted-foreground animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
            <div className="relative">
              {icon || <Icon icon={InboxIcon} size={64} className="opacity-50" />}
            </div>
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-2 animate-in slide-in-from-bottom-2 duration-500 delay-100">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm max-w-sm mb-6 animate-in slide-in-from-bottom-2 duration-500 delay-200">{description}</p>
        )}
        <div className="animate-in slide-in-from-bottom-2 duration-500 delay-300">
          {action}
        </div>
      </CardContent>
    </Card>
  )
}
