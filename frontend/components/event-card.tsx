'use client'

import Link from 'next/link'
import { Icon } from '@/components/icon'
import { Location01Icon, Calendar01Icon, UserIcon, FlowerIcon, ArrowRight01Icon, Package01Icon } from '@hugeicons/core-free-icons'
import type { EventCardProps } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export function EventCard({ event, productCount }: EventCardProps) {
  return (
    <Link href={`/events/${event.id}`} className="block group">
      <Card className={cn(
        "h-full gap-0 py-0 transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30",
        "hover:-translate-y-0.5"
      )}>
        <CardContent className="p-5 md:p-6 flex flex-col h-full relative overflow-hidden">
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-300 pointer-events-none" />
          
          {/* Header: Status + ID */}
          <div className="flex items-center gap-2 mb-4 relative">
            {event.status && <StatusBadge status={event.status} />}
            {event.displayId && (
              <Badge variant="outline" className="text-xs font-mono px-2 py-0.5 bg-muted/50">
                {event.displayId}
              </Badge>
            )}
            {productCount !== undefined && productCount > 0 && (
              <Badge variant="secondary" className="text-xs gap-1 ml-auto">
                <Icon icon={Package01Icon} size={12} />
                {productCount}
              </Badge>
            )}
          </div>

          {/* Client name */}
          <h3 className="font-semibold text-lg md:text-xl leading-tight truncate group-hover:text-primary transition-colors mb-4 relative">
            {event.clientName}
          </h3>

          {/* Details — always reserve space for both rows */}
          <div className="space-y-3 flex-1 relative">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Icon icon={Location01Icon} size={16} className="shrink-0 text-primary/60" />
              <span className="truncate">{event.venue || 'No venue'}</span>
            </div>

            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Icon icon={Calendar01Icon} size={16} className="shrink-0 text-primary/60" />
              <span>
                {event.deliveryFromDate
                  ? `${new Date(event.deliveryFromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${
                      event.deliveryToDate
                        ? new Date(event.deliveryToDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                        : 'TBD'
                    }`
                  : 'No date set'}
              </span>
            </div>
          </div>

          <Separator className="my-4 relative" />

          {/* Footer */}
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-3 text-xs text-muted-foreground min-w-0">
              <span className="flex items-center gap-1.5 truncate">
                <Icon icon={UserIcon} size={14} className="shrink-0 text-primary/60" />
                {event.managerName || 'Unassigned'}
              </span>
              {event.headKarigarName && (
                <span className="flex items-center gap-1.5 truncate">
                  <Icon icon={FlowerIcon} size={14} className="shrink-0 text-primary/60" />
                  {event.headKarigarName}
                </span>
              )}
            </div>
            <Icon icon={ArrowRight01Icon} size={18} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
