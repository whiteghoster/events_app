'use client'

import Link from 'next/link'
import { MapPin, Calendar, User, Flower2, Cake, Package } from 'lucide-react'
import type { Event, EventProduct } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface EventCardProps {
  event: Event
  products?: EventProduct[]
}

export function EventCard({ event, products = [] }: EventCardProps) {
  // Group products by category for summary
  const categorySummary = products.reduce((acc, p) => {
    if (!acc[p.categoryName]) {
      acc[p.categoryName] = []
    }
    acc[p.categoryName].push(`${p.quantity}${p.unit}`)
    return acc
  }, {} as Record<string, string[]>)

  const topCategories = Object.entries(categorySummary).slice(0, 2)

  const categoryIcon = (name: string) => {
    if (name.toLowerCase().includes('flower')) return <Flower2 className="w-3.5 h-3.5" />
    if (name.toLowerCase().includes('cake')) return <Cake className="w-3.5 h-3.5" />
    return <Package className="w-3.5 h-3.5" />
  }

  // Try to extract city from address (usually part before the last part or contains Mumbai, Delhi etc)
  const extractCity = () => {
    if (!event.venueAddress) return ''
    const parts = event.venueAddress.split(',').map(p => p.trim())
    // If there's more than 1 part, usually the second to last part is the city if last is state/pin
    if (parts.length > 1) {
      return parts[parts.length - 2]
    }
    return parts[0]
  }

  const city = extractCity()

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="skeu-elevated group hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer flex flex-col h-full ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 mb-4">
        <CardContent className="p-5 flex flex-col h-full">
          {/* Top Row: Client Name, EVT ID & Status */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0 flex-grow">
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight truncate drop-shadow-sm">
                {event.clientName}
              </h3>
              {event.contactName && (
                <p className="text-muted-foreground font-sans text-sm font-normal mt-1 opacity-80 group-hover:opacity-100 transition-opacity truncate">
                  {event.contactName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {event.status && <StatusBadge status={event.status} size="sm" />}
              {event.displayId && (
                <Badge variant="secondary" className="text-xs font-mono font-bold shadow-sm">
                  {event.displayId}
                </Badge>
              )}
            </div>
          </div>

          {/* Middle Area: Venue, City, Delivery Dates */}
          <div className="space-y-3 mb-6 flex-grow">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-foreground font-medium text-sm">
                <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
                <span className="truncate">{event.venue}</span>
              </div>
              {city && (
                <div className="pl-6 text-xs text-muted-foreground uppercase tracking-wider">
                  {city}
                </div>
              )}
            </div>

            {event.deliveryFromDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex flex-col">
                  <span className="text-foreground font-medium">
                    {new Date(event.deliveryFromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {event.deliveryToDate ? new Date(event.deliveryToDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'TBD'}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    Delivery
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Area: Manager & Karigar */}
          <div className="flex items-end justify-between gap-4 pb-4 border-b border-border/50 mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shrink-0 border border-border shadow-md">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Manager</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {event.managerName || 'Unassigned'}
                </p>
              </div>
            </div>
            {event.headKarigarName && (
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shrink-0 border border-border shadow-md">
                  <Flower2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Karigar</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {event.headKarigarName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer: View Details */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-primary text-sm font-bold group-hover:translate-x-1 transition-transform">
              View Details
              <Flower2 className="w-3.5 h-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
