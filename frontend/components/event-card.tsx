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
        "h-full gap-0 py-0 transition-all duration-300 border-border/70",
        "hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/40",
        "hover:-translate-y-1 overflow-hidden"
      )}>
        <CardContent className="p-6 md:p-7 flex flex-col h-full relative overflow-hidden">
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 group-hover:from-primary/10 group-hover:via-primary/5 group-hover:to-accent/10 transition-all duration-300 pointer-events-none" />
          
          {/* Decorative border accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent group-hover:via-primary/60 transition-all duration-300" />
          
          {/* Header: Status + ID */}
          <div className="flex items-center gap-2 mb-5 relative z-10">
            {event.status && <StatusBadge status={event.status} />}
            {event.displayId && (
              <Badge variant="outline" className="text-xs font-mono px-2.5 py-1 bg-secondary/70 border-border/80">
                {event.displayId}
              </Badge>
            )}
            {productCount !== undefined && productCount > 0 && (
              <Badge variant="secondary" className="text-xs gap-1.5 ml-auto bg-accent/15 text-accent-foreground/80 border-0">
                <Icon icon={Package01Icon} size={12} />
                {productCount}
              </Badge>
            )}
          </div>

          {/* Client name */}
          <h3 className="font-bold text-lg md:text-xl leading-tight truncate group-hover:text-primary transition-colors mb-5 relative z-10">
            {event.clientName}
          </h3>

          {/* Details — always reserve space for both rows */}
          <div className="space-y-3 flex-1 relative z-10">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Icon icon={Location01Icon} size={16} className="shrink-0 text-primary/70" />
              <span className="truncate font-medium">{event.venue || 'No venue'}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Icon icon={Calendar01Icon} size={16} className="shrink-0 text-primary/70" />
              <span className="font-medium">
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

          <Separator className="my-5 relative z-10 bg-border/60" />

          {/* Footer */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3 text-xs text-muted-foreground min-w-0">
              <span className="flex items-center gap-2 truncate">
                <Icon icon={UserIcon} size={14} className="shrink-0 text-primary/70" />
                <span className="truncate">{event.managerName || 'Unassigned'}</span>
              </span>
              {event.headKarigarName && (
                <span className="flex items-center gap-2 truncate hidden sm:flex">
                  <Icon icon={FlowerIcon} size={14} className="shrink-0 text-primary/70" />
                  <span className="truncate">{event.headKarigarName}</span>
                </span>
              )}
            </div>
            <Icon icon={ArrowRight01Icon} size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1.5 transition-all shrink-0 ml-2" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
