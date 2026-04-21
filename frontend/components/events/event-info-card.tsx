'use client'

import { Calendar01Icon, Location01Icon, ArrowUp01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/icon'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { Event } from '@/lib/types'

interface EventInfoCardProps {
  event: Event
  infoExpanded: boolean
  setInfoExpanded: (expanded: boolean) => void
}

function InfoField({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="font-medium">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

export function EventInfoCard({ event, infoExpanded, setInfoExpanded }: EventInfoCardProps) {
  return (
    <Collapsible open={infoExpanded} onOpenChange={setInfoExpanded} className="mb-6">
      <Card>
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {event.deliveryFromDate && (
              <span className="flex items-center gap-2">
                <Icon icon={Calendar01Icon} size={16} />
                {new Date(event.deliveryFromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                {' - '}
                {event.deliveryToDate ? new Date(event.deliveryToDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'TBD'}
              </span>
            )}
            <span className="hidden sm:flex items-center gap-2">
              <Icon icon={Location01Icon} size={16} />
              {event.venue}
            </span>
          </div>
          {infoExpanded ? <Icon icon={ArrowUp01Icon} size={16} className="text-muted-foreground" /> : <Icon icon={ArrowDown01Icon} size={16} className="text-muted-foreground" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Separator />
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <InfoField label="Venue" value={event.venue} sub={event.venueAddress} />
            {event.city && <InfoField label="City" value={event.city} />}
            {event.clientName && <InfoField label="Client" value={event.clientName} />}
            {event.companyName && <InfoField label="Company" value={event.companyName} />}
            {event.contactPhone && <InfoField label="Phone" value={event.contactPhone} />}
            {event.headKarigarName && <InfoField label="Head Karigar" value={event.headKarigarName} />}
            {event.managerName && <InfoField label="Manager" value={event.managerName} />}
            {event.deliveryFromDate && <InfoField label="Delivery From" value={new Date(event.deliveryFromDate).toLocaleDateString()} />}
            {event.deliveryToDate && <InfoField label="Delivery To" value={new Date(event.deliveryToDate).toLocaleDateString()} />}
            {event.notes && <div className="sm:col-span-2"><InfoField label="Notes" value={event.notes} /></div>}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
