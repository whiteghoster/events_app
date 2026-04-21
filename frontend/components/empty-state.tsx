import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@/components/icon'
import { InboxIcon } from '@hugeicons/core-free-icons'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="mb-4 text-muted-foreground">
          {icon || <Icon icon={InboxIcon} size={48} />}
        </div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>
        )}
        {action}
      </CardContent>
    </Card>
  )
}
