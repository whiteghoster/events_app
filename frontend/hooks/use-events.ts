import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { eventsApi } from '@/lib/api'
import type { Event, EventStatus } from '@/lib/types'

const PAGE_SIZE = 20

const VALID_TABS: EventStatus[] = ['live', 'hold', 'finished']

export function useEvents() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  
  // Initialize activeTab from URL query param, default to 'live'
  const [activeTab, setActiveTabState] = useState<EventStatus>(() => {
    const statusParam = searchParams.get('status')
    if (statusParam && VALID_TABS.includes(statusParam as EventStatus)) {
      return statusParam as EventStatus
    }
    return 'live'
  })
  
  // Use ref to track current tab without causing effect re-runs
  const activeTabRef = useRef(activeTab)
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])
  
  // Update URL when tab changes
  const setActiveTab = useCallback((tab: EventStatus) => {
    setActiveTabState(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('status', tab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])
  
  // Sync with URL when back/forward navigation occurs
  useEffect(() => {
    const statusParam = searchParams.get('status')
    if (statusParam && VALID_TABS.includes(statusParam as EventStatus)) {
      setActiveTabState(statusParam as EventStatus)
    } else if (!statusParam && activeTabRef.current !== 'live') {
      // URL has no status param but we're not on live - reset to live
      setActiveTabState('live')
    }
  }, [searchParams])

  const sortEventsByProximity = useCallback((events: Event[]): Event[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of day for accurate comparison

    return events.sort((a, b) => {
      const dateA = a.deliveryFromDate ? new Date(a.deliveryFromDate) : null
      const dateB = b.deliveryFromDate ? new Date(b.deliveryFromDate) : null

      // Handle null dates - put them at the end
      if (!dateA && !dateB) return 0
      if (!dateA) return 1
      if (!dateB) return -1

      // Calculate absolute difference in days from today
      const diffA = Math.abs(dateA.getTime() - today.getTime())
      const diffB = Math.abs(dateB.getTime() - today.getTime())

      // Sort by proximity to today
      if (diffA !== diffB) {
        return diffA - diffB
      }

      // If same distance, sort by date (earlier first)
      return dateA.getTime() - dateB.getTime()
    })
  }, [])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['events', 'list', activeTab],
    queryFn: ({ pageParam }) => eventsApi.getEvents(undefined, activeTab, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
    staleTime: 1000 * 60 * 2,
  })

  const apiEvents = useMemo(() => {
    const events = data?.pages.flatMap((page) => page.events) || []
    return sortEventsByProximity(events)
  }, [data, sortEventsByProximity])

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
      // Immediately remove from cache for instant UI update
      queryClient.setQueriesData({ queryKey: ['events', 'list'] }, (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            events: page.events.filter((e: Event) => e.id !== id),
          })),
        }
      })
      // Also invalidate to sync with server
      await queryClient.invalidateQueries({ queryKey: ['events', 'list'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete event')
    }
  }

  // Status filtering is now done server-side
  // Only client-side search filtering remains
  const filteredEvents = useMemo<Event[]>(() => {
    if (!search) return apiEvents
    const searchLower = search.toLowerCase()
    return apiEvents.filter(e =>
      e.clientName.toLowerCase().includes(searchLower) ||
      e.venue.toLowerCase().includes(searchLower) ||
      (e.displayId && e.displayId.toLowerCase().includes(searchLower))
    )
  }, [apiEvents, search])

  const handleExportCSV = async () => {
    const finishedEvents = apiEvents.filter(e => e.status === 'finished')
    if (finishedEvents.length === 0) {
      toast.info('No finished events to export')
      return
    }
    try {
      toast.loading('Preparing detailed export...', { id: 'export-loading' })
      const rows: string[][] = []
      rows.push([
        'Event ID', 'Client Name', 'Venue', 'Event Date', 'Delivery Date',
        'Occasion', 'Status', 'Contact Number', 'Manager Name', 'Karigar Name',
        'Category', 'Product Name', 'Quantity', 'Unit', 'Price', 'Product Notes', 'Event Notes',
      ])
      for (const event of finishedEvents) {
        try {
          const eventProducts = await eventsApi.getEventProducts(event.id)
          if (eventProducts.length === 0) {
            rows.push([
              event.displayId || event.id, event.clientName, event.venue,
              new Date(event.eventDate).toLocaleDateString('en-IN'),
              event.deliveryFromDate ? new Date(event.deliveryFromDate).toLocaleDateString('en-IN') : 'N/A',
              '', event.status || 'finished', event.contactPhone || '',
              event.managerName || 'N/A', event.headKarigarName || 'N/A',
              'N/A', 'No Products', '', '', '', '', event.notes || '',
            ])
          } else {
            eventProducts.forEach((product: any, index: number) => {
              rows.push([
                index === 0 ? (event.displayId || event.id) : '',
                index === 0 ? event.clientName : '',
                index === 0 ? event.venue : '',
                index === 0 ? new Date(event.eventDate).toLocaleDateString('en-IN') : '',
                index === 0 ? (event.deliveryFromDate ? new Date(event.deliveryFromDate).toLocaleDateString('en-IN') : 'N/A') : '',
                '', index === 0 ? (event.status || 'finished') : '',
                index === 0 ? (event.contactPhone || '') : '',
                index === 0 ? (event.managerName || 'N/A') : '',
                index === 0 ? (event.headKarigarName || 'N/A') : '',
                product.categoryName || 'N/A', product.productName || 'N/A',
                product.quantity?.toString() || '0', product.unit || 'pcs',
                product.price?.toString() || '0', product.notes || '',
                index === 0 ? (event.notes || '') : '',
              ])
            })
          }
        } catch {
          rows.push([
            event.displayId || event.id, event.clientName, event.venue,
            new Date(event.eventDate).toLocaleDateString('en-IN'),
            event.deliveryFromDate ? new Date(event.deliveryFromDate).toLocaleDateString('en-IN') : 'N/A',
            '', event.status || 'finished', event.contactPhone || '',
            event.managerName || 'N/A', event.headKarigarName || 'N/A',
            'Error Loading', 'Error Loading Products', '', '', '', '', event.notes || '',
          ])
        }
        rows.push(Array(17).fill(''))
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
    } catch {
      toast.error('Export failed', { id: 'export-loading' })
    }
  }

  return {
    isLoading,
    search,
    setSearch,
    activeTab,
    setActiveTab,
    filteredEvents,
    prefetchEvent,
    handleDeleteEvent,
    handleExportCSV,
    // Infinite scroll
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  }
}
