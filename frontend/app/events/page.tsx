'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Search, Lock, Loader2, X, Download } from 'lucide-react'
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
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'live' | 'hold' | 'finished'>('live')

  // Fetch events with React Query for better caching
  const { data: eventsData, isLoading: loading } = useQuery({
    queryKey: ['events', 'list', page, pageSize],
    queryFn: () => eventsApi.getEvents(undefined, page, pageSize),
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: (previousData) => previousData, // Keep old data while loading new
  })

  const apiEvents = eventsData?.events || []
  const pagination = eventsData?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 }

  // Prefetch event details on hover for faster navigation
  const prefetchEvent = useCallback((eventId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['event', eventId],
      queryFn: () => eventsApi.getEventById(eventId),
      staleTime: 1000 * 60 * 2,
    })
  }, [queryClient])

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this event? This action cannot be undone.')) {
      return
    }

    try {
      await eventsApi.deleteEvent(id)
      toast.success('Event deleted successfully')
      // Invalidate and refetch events list
      queryClient.invalidateQueries({ queryKey: ['events', 'list'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete event')
    }
  }

  // Filter events by search and tab
  const filteredEvents = useMemo<Event[]>(() => {
    let filtered = apiEvents

    // Filter by tab (live, hold, finished)
    if (activeTab === 'live') {
      filtered = filtered.filter(e => !e.status || e.status === 'live')
    } else if (activeTab === 'hold') {
      filtered = filtered.filter(e => e.status === 'hold')
    } else if (activeTab === 'finished') {
      filtered = filtered.filter(e => e.status === 'finished')
    }

    // Filter by search
    if (search) {
      filtered = filtered.filter(e =>
        e.clientName.toLowerCase().includes(search.toLowerCase()) ||
        e.venue.toLowerCase().includes(search.toLowerCase())
      )
    }

    return filtered
  }, [apiEvents, search, activeTab])

  const getProductsForEvent = (eventId: string) => []

  const handleExportCSV = async () => {
    const finishedEvents = apiEvents.filter(e => e.status === 'finished')
    if (finishedEvents.length === 0) {
      toast.info('No finished events to export')
      return
    }

    try {
      toast.loading('Preparing detailed export...', { id: 'export-loading' })

      // Build comprehensive CSV with event details and products
      const rows: string[][] = []

      // Header row
      rows.push([
        'Event ID',
        'Client Name',
        'Venue',
        'Event Date',
        'Delivery Date',
        'Occasion',
        'Status',
        'Contact Number',
        'Manager Name',
        'Karigar Name',
        'Category',
        'Product Name',
        'Quantity',
        'Unit',
        'Price',
        'Product Notes',
        'Event Notes'
      ])

      // Fetch products for each finished event
      for (const event of finishedEvents) {
        try {
          // Fetch products for this event
          const eventProducts = await eventsApi.getEventProducts(event.id)

          if (eventProducts.length === 0) {
            // Event with no products - still add a row
            rows.push([
              event.displayId || event.id,
              event.clientName,
              event.venue,
              new Date(event.eventDate).toLocaleDateString('en-IN'),
              event.deliveryDate ? new Date(event.deliveryDate).toLocaleDateString('en-IN') : 'N/A',
              event.occasion,
              event.status || 'finished',
              event.contactNumber || '',
              event.managerName || 'N/A',
              event.karigarName || 'N/A',
              'N/A',
              'No Products',
              '',
              '',
              '',
              '',
              event.notes || ''
            ])
          } else {
            // Event with products - add a row for each product
            eventProducts.forEach((product: any, index: number) => {
              rows.push([
                index === 0 ? (event.displayId || event.id) : '', // Only show event ID on first product row
                index === 0 ? event.clientName : '',
                index === 0 ? event.venue : '',
                index === 0 ? new Date(event.eventDate).toLocaleDateString('en-IN') : '',
                index === 0 ? (event.deliveryDate ? new Date(event.deliveryDate).toLocaleDateString('en-IN') : 'N/A') : '',
                index === 0 ? event.occasion : '',
                index === 0 ? (event.status || 'finished') : '',
                index === 0 ? (event.contactNumber || '') : '',
                index === 0 ? (event.managerName || 'N/A') : '',
                index === 0 ? (event.karigarName || 'N/A') : '',
                product.categoryName || 'N/A',
                product.productName || 'N/A',
                product.quantity?.toString() || '0',
                product.unit || 'pcs',
                product.price?.toString() || '0',
                product.notes || '',
                index === 0 ? (event.notes || '') : ''
              ])
            })
          }
        } catch (err) {
          console.error(`Failed to fetch products for event ${event.id}:`, err)
          // Add event row even if products fetch failed
          rows.push([
            event.displayId || event.id,
            event.clientName,
            event.venue,
            new Date(event.eventDate).toLocaleDateString('en-IN'),
            event.deliveryDate ? new Date(event.deliveryDate).toLocaleDateString('en-IN') : 'N/A',
            event.occasion,
            event.status || 'finished',
            event.contactNumber || '',
            event.managerName || 'N/A',
            event.karigarName || 'N/A',
            'Error Loading',
            'Error Loading Products',
            '',
            '',
            '',
            '',
            event.notes || ''
          ])
        }

        // Add empty row between events for visual separation
        rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
      }

      const csv = rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finished_events_detailed_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Detailed export completed', { id: 'export-loading' })
    } catch (err) {
      toast.error('Export failed', { id: 'export-loading' })
      console.error('Export error:', err)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        title="Events"
        action={
          <div className="flex items-center gap-2">
            {user && canCreateEvent(user.role) && activeTab === 'live' && (
              <Link href="/events/new">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  New Event
                </Button>
              </Link>
            )}
            {user?.role === 'admin' && activeTab === 'finished' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        }
      />

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative mx-auto w-full max-w-md skeu-card p-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events by client name or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-transparent border-none shadow-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-6 p-1 skeu-panel rounded-xl">
        <button
          onClick={() => setActiveTab('live')}
          className={cn(
            'px-6 py-2 text-sm font-medium transition-all rounded-lg relative',
            activeTab === 'live'
              ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-secondary hover:to-secondary/50'
          )}
        >
          Live
        </button>
        <button
          onClick={() => setActiveTab('hold')}
          className={cn(
            'px-6 py-2 text-sm font-medium transition-all rounded-lg relative',
            activeTab === 'hold'
              ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-secondary hover:to-secondary/50'
          )}
        >
          Hold
        </button>
        <button
          onClick={() => setActiveTab('finished')}
          className={cn(
            'px-6 py-2 text-sm font-medium transition-all rounded-lg relative',
            activeTab === 'finished'
              ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-secondary hover:to-secondary/50'
          )}
        >
          Finished
        </button>
      </div>

      {/* Events Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground text-sm">Loading events…</span>
        </div>
      ) : filteredEvents.length > 0 ? (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredEvents.map(event => (
                  <div
                    key={event.id}
                    onMouseEnter={() => prefetchEvent(event.id)}
                    onTouchStart={() => prefetchEvent(event.id)}
                  >
                    <EventCard
                      event={event}
                      products={getProductsForEvent(event.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<FlowerIcon className="w-16 h-16" />}
              title="No events found"
              description={search
                ? "No events match your search criteria"
                : "Create your first event to get started"}
              action={
                user && canCreateEvent(user.role) && activeTab === 'live' && !search && (
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
  )
}
