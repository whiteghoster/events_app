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
  other: <span className="text-base">📋</span>,
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

  return (
    <Link href={`/events/${event.id}`}>
      <div className="group bg-card rounded-xl p-5 border border-border hover:border-primary/50 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {occasionIcons[event.occasionType]}
              {event.occasionType.replace('_', ' ').charAt(0).toUpperCase() + event.occasionType.replace('_', ' ').slice(1)}
            </span>
            {event.displayId && (
              <span className="text-xs font-mono font-medium text-muted-foreground bg-secondary px-2 py-1 rounded">
                {event.displayId}
              </span>
            )}
          </div>
        </div>

        {/* Event Name */}
        <h3 className="font-serif text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
          {event.name}
        </h3>

        {/* Venue */}
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="truncate">{event.venueName}</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            {eventDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className={cn(
            'font-medium',
            isUrgent ? 'text-primary' : 'text-muted-foreground',
            daysAway === 0 && 'font-bold'
          )}>
            {getRelativeDate()}
          </span>
        </div>

        {/* Contact */}
        {event.contactName && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
            <User className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {event.contactName}
              {event.contactPhone && ` · ${event.contactPhone}`}
            </span>
          </div>
        )}

        {/* Category Summary */}
        {topCategories.length > 0 && (
          <div className="space-y-1.5 mb-4 pt-3 border-t border-border">
            {topCategories.map(([category, items]) => (
              <div key={category} className="flex items-center gap-2 text-sm text-muted-foreground">
                {categoryIcon(category)}
                <span className="font-medium text-foreground">{category}:</span>
                <span>{items.join(', ')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-sm text-primary font-medium group-hover:underline">
            View Details
          </span>
          <StatusBadge status={event.status} />
        </div>
      </div>
    </Link>
  )
}
