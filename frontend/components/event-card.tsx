'use client'

import Link from 'next/link'
import { Icon } from '@/components/icon'
import { Location01Icon, Calendar01Icon, UserIcon, FlowerIcon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import type { EventCardProps } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export function EventCard({ event }: EventCardProps) {
  return (
    <Link href={`/events/${event.id}`} className="block group">
      <Card className="h-full gap-0 py-0 transition-all hover:shadow-md hover:border-foreground/20">
        <CardContent className="p-5 md:p-6 flex flex-col h-full">
          {/* Header: Status + ID */}
          <div className="flex items-center gap-2 mb-4">
            {event.status && <StatusBadge status={event.status} />}
            {event.displayId && (
              <Badge variant="outline" className="text-xs font-mono px-2 py-0.5">
                {event.displayId}
              </Badge>
            )}
          </div>

          {/* Client name */}
          <h3 className="font-semibold text-lg md:text-xl leading-tight truncate group-hover:underline underline-offset-2 mb-4">
            {event.clientName}
          </h3>

          {/* Details — always reserve space for both rows */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2.5 text-base text-muted-foreground">
              <Icon icon={Location01Icon} size={16} className="shrink-0" />
              <span className="truncate">{event.venue || 'No venue'}</span>
            </div>

            <div className="flex items-center gap-2.5 text-base text-muted-foreground">
              <Icon icon={Calendar01Icon} size={16} className="shrink-0" />
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

          <Separator className="my-4" />

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground min-w-0">
              <span className="flex items-center gap-1.5 truncate">
                <Icon icon={UserIcon} size={14} className="shrink-0" />
                {event.managerName || 'Unassigned'}
              </span>
              {event.headKarigarName && (
                <span className="flex items-center gap-1.5 truncate">
                  <Icon icon={FlowerIcon} size={14} className="shrink-0" />
                  {event.headKarigarName}
                </span>
              )}
            </div>
            <Icon icon={ArrowRight01Icon} size={18} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
