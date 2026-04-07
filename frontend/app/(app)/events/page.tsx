'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, Lock } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { EventCard } from '@/components/event-card'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState, FlowerIcon } from '@/components/empty-state'
import { useAuth, canCreateEvent } from '@/lib/auth-context'
import { events, eventProducts } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { OccasionType, EventStatus } from '@/lib/types'

const occasions: (OccasionType | 'All')[] = ['All', 'Wedding', 'Birthday', 'Pooja', 'Corporate', 'Festival', 'Other']

export default function EventsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'live' | 'over'>('live')
  const [overSubTab, setOverSubTab] = useState<'Hold' | 'Finished'>('Hold')
  const [search, setSearch] = useState('')
  const [occasionFilter, setOccasionFilter] = useState<OccasionType | 'All'>('All')

  const liveEvents = useMemo(() => {
    return events
      .filter(e => e.status === 'Live')
      .filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase())
        const matchesOccasion = occasionFilter === 'All' || e.occasionType === occasionFilter
        return matchesSearch && matchesOccasion
      })
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
  }, [search, occasionFilter])

  const overEvents = useMemo(() => {
    return events
      .filter(e => e.status === overSubTab)
      .filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase())
        const matchesOccasion = occasionFilter === 'All' || e.occasionType === occasionFilter
        return matchesSearch && matchesOccasion
      })
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
  }, [overSubTab, search, occasionFilter])

  const liveCount = events.filter(e => e.status === 'Live').length
  const holdCount = events.filter(e => e.status === 'Hold').length
  const finishedCount = events.filter(e => e.status === 'Finished').length

  const getProductsForEvent = (eventId: string) => {
    return eventProducts.filter(p => p.eventId === eventId)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        title="Events"
        action={
          user && canCreateEvent(user.role) && (
            <Link href="/events/new">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            </Link>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('live')}
          className={cn(
            'pb-3 text-sm font-medium transition-colors relative',
            activeTab === 'live' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Live
          <span className={cn(
            'ml-2 px-2 py-0.5 rounded-full text-xs',
            activeTab === 'live' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
          )}>
            {liveCount}
          </span>
          {activeTab === 'live' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('over')}
          className={cn(
            'pb-3 text-sm font-medium transition-colors relative',
            activeTab === 'over' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Over
          <span className={cn(
            'ml-2 px-2 py-0.5 rounded-full text-xs',
            activeTab === 'over' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
          )}>
            {holdCount + finishedCount}
          </span>
          {activeTab === 'over' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={occasionFilter} onValueChange={(v) => setOccasionFilter(v as OccasionType | 'All')}>
          <SelectTrigger className="w-full sm:w-44 bg-card border-border">
            <SelectValue placeholder="All Occasions" />
          </SelectTrigger>
          <SelectContent>
            {occasions.map(o => (
              <SelectItem key={o} value={o}>
                {o === 'All' ? 'All Occasions' : o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Live Tab Content */}
      {activeTab === 'live' && (
        <div className="animate-in fade-in duration-150">
          {liveEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {liveEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  products={getProductsForEvent(event.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FlowerIcon className="w-16 h-16" />}
              title="No live events found"
              description={search || occasionFilter !== 'All' 
                ? "No events match your search criteria" 
                : "Create your first event to get started"}
              action={
                user && canCreateEvent(user.role) && !search && occasionFilter === 'All' && (
                  <Link href="/events/new">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      New Event
                    </Button>
                  </Link>
                )
              }
            />
          )}
        </div>
      )}

      {/* Over Tab Content */}
      {activeTab === 'over' && (
        <div className="animate-in fade-in duration-150">
          {/* Sub-tabs */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setOverSubTab('Hold')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                overSubTab === 'Hold' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Hold ({holdCount})
            </button>
            <button
              onClick={() => setOverSubTab('Finished')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                overSubTab === 'Finished' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Finished ({finishedCount})
            </button>
          </div>

          {overEvents.length > 0 ? (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Event Name</TableHead>
                    <TableHead className="text-muted-foreground hidden sm:table-cell">Occasion</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Venue</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground hidden lg:table-cell">Closed By</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overEvents.map(event => (
                    <TableRow
                      key={event.id}
                      className={cn(
                        'border-border cursor-pointer transition-colors',
                        event.status === 'Finished' && 'opacity-70'
                      )}
                      onClick={() => window.location.href = `/events/${event.id}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {event.status === 'Finished' && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                          {event.name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{event.occasionType}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[200px]">{event.venueName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(event.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{event.closedBy || '-'}</TableCell>
                      <TableCell>
                        <StatusBadge status={event.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={<FlowerIcon className="w-16 h-16" />}
              title={`No ${overSubTab.toLowerCase()} events`}
              description="Events that have been closed will appear here"
            />
          )}
        </div>
      )}
    </div>
  )
}
