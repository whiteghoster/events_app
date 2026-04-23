import { useState, useMemo, useCallback } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { eventsApi } from '@/lib/api'
import type { Event, EventStatus } from '@/lib/types'

const PAGE_SIZE = 20

export function useEvents() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<EventStatus>('live')

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
    return data?.pages.flatMap((page) => page.events) || []
  }, [data])

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
      queryClient.invalidateQueries({ queryKey: ['events', 'list'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete event')
    }
  }

  // Status filtering is now done server-side
  // Only client-side search filtering remains
  const filteredEvents = useMemo<Event[]>(() => {
    if (!search) return apiEvents
    return apiEvents.filter(e =>
      e.clientName.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase())
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
