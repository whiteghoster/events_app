'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Lock, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { EventCard } from '@/components/event-card'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState, FlowerIcon } from '@/components/empty-state'
import { useAuth, canCreateEvent } from '@/lib/auth-context'
import { eventsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { OccasionType, Event } from '@/lib/types'

const occasions: { value: OccasionType | 'All'; label: string }[] = [
  { value: 'All', label: 'All Occasions' },
  { value: 'haldi', label: 'Haldi' },
  { value: 'bhaat', label: 'Bhaat' },
  { value: 'mehendi', label: 'Mehendi' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'reception', label: 'Reception' },
  { value: 'cocktail', label: 'Cocktail' },
  { value: 'after_party', label: 'After Party' },
  { value: 'others', label: 'Other' },
]



export default function EventsPage() {
  const { user } = useAuth()
  const [apiEvents, setApiEvents] = useState<Event[]>([])
  const [totals, setTotals] = useState({ live: 0, hold: 0, finished: 0 })
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'live' | 'over'>('live')
  const [overSubTab, setOverSubTab] = useState<'hold' | 'finished'>('hold')

  const [search, setSearch] = useState('')
  const [occasionFilter, setOccasionFilter] = useState<OccasionType | 'All'>('All')

  // Fetch all totals for tabs
  const refreshTotals = async () => {
    try {
      const oc = occasionFilter === 'All' ? undefined : occasionFilter
      const [liveRes, holdRes, finishedRes] = await Promise.all([
        eventsApi.getEvents('live', oc, 1, 1),
        eventsApi.getEvents('hold', oc, 1, 1),
        eventsApi.getEvents('finished', oc, 1, 1)
      ])
      setTotals({
        live: liveRes.pagination.total,
        hold: holdRes.pagination.total,
        finished: finishedRes.pagination.total
      })
    } catch (err) {
      console.error('Failed to refresh totals:', err)
    }
  }

  // Fetch real events from backend based on tab/subtab selection
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      
      let tabParam = activeTab === 'over' ? overSubTab : 'live'

      try {
        const response = await eventsApi.getEvents(
          tabParam, 
          occasionFilter === 'All' ? undefined : occasionFilter,
          pagination.page,
          pagination.pageSize
        )
        if (!cancelled) {
          setApiEvents(response.events)
          setPagination(response.pagination)
          
          // Update the specific total for the current tab in our global totals state
          setTotals(prev => ({
            ...prev,
            [tabParam]: response.pagination.total
          }))
        }
      } catch (err) {
        toast.error('Failed to load events')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [activeTab, overSubTab, occasionFilter, pagination.page])

  // Refresh totals on mount and when filter changes
  useEffect(() => {
    refreshTotals()
  }, [occasionFilter])

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this event? This action cannot be undone.')) {
      return
    }

    try {
      await eventsApi.deleteEvent(id)
      toast.success('Event deleted successfully')
      refreshTotals()
      // Refresh current list
      const tabParam = activeTab === 'over' ? overSubTab : 'live'
      const response = await eventsApi.getEvents(tabParam, occasionFilter === 'All' ? undefined : occasionFilter)
      setApiEvents(response.events)
      setPagination(response.pagination)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete event')
    }
  }

  // Merge: real DB events first, then demo events (demo IDs won't clash with UUIDs)
  const allEvents = useMemo<Event[]>(() => {
    return apiEvents
  }, [apiEvents])


  const filterAndSort = (events: Event[], asc = true) =>
    events
      .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
      .filter(e => occasionFilter === 'All' || e.occasionType === occasionFilter)
      .sort((a, b) =>
        asc
          ? new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
          : new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
      )

  // The lists are now synchronized with the backend tab response
  const liveEvents = useMemo(() => activeTab === 'live' ? allEvents : [], [allEvents, activeTab])
  const overEvents = useMemo(() => activeTab === 'over' ? allEvents : [], [allEvents, activeTab])

  const liveCount = totals.live
  const overCount = totals.hold + totals.finished
  const holdCount = totals.hold
  const finishedCount = totals.finished


  const getProductsForEvent = (eventId: string) => []

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
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>

        </Select>
      </div>

      {/* Live Tab Content */}
      {activeTab === 'live' && (
        <div className="animate-in fade-in duration-150">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground text-sm">Loading events…</span>
            </div>
          ) : liveEvents.length > 0 ? (
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
              onClick={() => setOverSubTab('hold')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                overSubTab === 'hold'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Hold ({holdCount})
            </button>
            <button
              onClick={() => setOverSubTab('finished')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                overSubTab === 'finished'
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
                    <TableHead className="text-muted-foreground w-24">ID</TableHead>
                    <TableHead className="text-muted-foreground">Event Name</TableHead>
                    <TableHead className="text-muted-foreground hidden sm:table-cell">Occasion</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Venue</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    {overSubTab === 'finished' && user?.role === 'admin' && (
                      <TableHead className="text-muted-foreground w-20 text-right">Action</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overEvents.map(event => (
                    <TableRow
                      key={event.id}
                      className={cn(
                        'border-border cursor-pointer transition-colors',
                        event.status === 'finished' && 'opacity-70'
                      )}
                      onClick={() => window.location.href = `/events/${event.id}`}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {event.displayId || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {event.status === 'finished' && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                          {event.name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {event.occasionType.replace('_', ' ').charAt(0).toUpperCase() + event.occasionType.replace('_', ' ').slice(1)}

                      </TableCell>

                      <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[200px]">{event.venueName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(event.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={event.status} />
                      </TableCell>
                      {overSubTab === 'finished' && user?.role === 'admin' && (
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteEvent(event.id)
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
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
