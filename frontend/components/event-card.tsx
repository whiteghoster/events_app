'use client'

import Link from 'next/link'
import { MapPin, Calendar, User, Flower2, Cake, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/status-badge'
import type { Event, EventProduct, OccasionType } from '@/lib/types'

const occasionIcons: Record<string, React.ReactNode> = {
  haldi: <span className="text-base">🟡</span>,
  bhaat: <span className="text-base">🍚</span>,
  mehendi: <span className="text-base">🌿</span>,
  wedding: <span className="text-base">💍</span>,
  reception: <span className="text-base">🥂</span>,
  cocktail: <span className="text-base">🍸</span>,
  after_party: <span className="text-base">🎇</span>,
  others: <span className="text-base">📋</span>,
}




interface EventCardProps {
  event: Event
  products?: EventProduct[]
}

export function EventCard({ event, products = [] }: EventCardProps) {
  const eventDate = new Date(event.eventDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  eventDate.setHours(0, 0, 0, 0)
  
  const daysAway = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  const getRelativeDate = () => {
    if (daysAway === 0) return 'Today!'
    if (daysAway === 1) return 'Tomorrow'
    if (daysAway < 0) return `${Math.abs(daysAway)} days ago`
    return `${daysAway} days away`
  }

  const isUrgent = daysAway >= 0 && daysAway <= 7

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
      <div className="group bg-card rounded-xl p-5 border border-border hover:border-primary/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col h-full ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {/* Top Row: Client Name & EVT ID */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-grow">
            <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight truncate">
              {event.name}
            </h3>
            {event.contactName && (
              <p className="text-muted-foreground font-sans text-sm font-normal mt-1 opacity-80 group-hover:opacity-100 transition-opacity truncate">
                {event.contactName}
              </p>
            )}
          </div>
          {event.displayId && (
            <span className="text-xs font-mono font-bold text-muted-foreground bg-secondary px-2.5 py-1.5 rounded-md border border-border/50 shrink-0">
              {event.displayId}
            </span>
          )}
        </div>

        {/* Middle Area: Venue, City, Date */}
        <div className="space-y-3 mb-6 flex-grow">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-foreground font-medium text-sm">
              <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
              <span className="truncate">{event.venueName}</span>
            </div>
            {city && (
              <div className="pl-6 text-xs text-muted-foreground uppercase tracking-wider">
                {city}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex flex-col">
              <span className="text-foreground font-medium">
                {eventDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className={cn(
                'text-[10px] uppercase font-bold tracking-widest',
                isUrgent ? 'text-primary' : 'text-muted-foreground'
              )}>
                {getRelativeDate()}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Area: Manager & Occasion Type */}
        <div className="flex items-end justify-between gap-4 pb-4 border-b border-border/50 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Manager / Contact</p>
              <p className="text-sm font-medium text-foreground truncate">
                {event.assignedStaffName || event.contactName || 'Unassigned'}
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 bg-secondary/80 rounded-lg border border-dashed border-border flex items-center gap-2 shrink-0">
            {occasionIcons[event.occasionType]}
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
              {event.occasionType.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Footer: View Details & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-primary text-sm font-bold group-hover:translate-x-1 transition-transform">
            View Details
            <Flower2 className="w-3.5 h-3.5" />
          </div>
          <StatusBadge status={event.status} size="sm" />
        </div>
      </div>
    </Link>
  )
}
