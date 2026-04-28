import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { eventsApi, auditApi } from '@/lib/api'
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
    // Optimistic update: remove from cache immediately for instant UI feedback
    queryClient.setQueriesData({ queryKey: ['events', 'list'], exact: false }, (oldData: any) => {
      if (!oldData?.pages) return oldData
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          events: page.events.filter((e: Event) => e.id !== id),
        })),
      }
    })
    try {
      await eventsApi.deleteEvent(id)
      toast.success('Event deleted successfully')
      // Sync with server in background
      await queryClient.invalidateQueries({
        queryKey: ['events', 'list'],
        exact: false,
        refetchType: 'active',
      })
    } catch (err) {
      // Restore on error
      await queryClient.invalidateQueries({ queryKey: ['events', 'list'], exact: false })
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

  const handleExportXLSX = async () => {
    const finishedEvents = apiEvents.filter(e => e.status === 'finished')
    if (finishedEvents.length === 0) {
      toast.info('No finished events to export')
      return
    }
    try {
      toast.loading('Preparing detailed export...', { id: 'export-loading' })

      // --- Sheet 1: Event Details ---
      const eventRows: (string | number)[][] = []
      eventRows.push([
        'Event ID', 'Client Name', 'Venue', 'Event Date', 'Delivery Date',
        'Occasion', 'Status', 'Contact Number', 'Manager Name', 'Karigar Name',
        'Category', 'Product Name', 'Quantity', 'Unit', 'Price', 'Product Notes', 'Event Notes',
      ])

      // --- Sheet 2: Audit Logs ---
      const auditRows: (string | number)[][] = []
      auditRows.push([
        'ID', 'Timestamp', 'Date', 'Time', 'Action', 'Entity Type',
        'Event Code', 'Event Name', 'User Name', 'User Email', 'User Role',
        'Old Values', 'New Values', 'Changes Summary',
      ])

      for (const event of finishedEvents) {
        try {
          const eventProducts = await eventsApi.getEventProducts(event.id)
          if (eventProducts.length === 0) {
            eventRows.push([
              event.displayId || event.id, event.clientName, event.venue,
              new Date(event.eventDate).toLocaleDateString('en-IN'),
              event.deliveryFromDate ? new Date(event.deliveryFromDate).toLocaleDateString('en-IN') : 'N/A',
              '', event.status || 'finished', event.contactPhone || '',
              event.managerName || 'N/A', event.headKarigarName || 'N/A',
              'N/A', 'No Products', '', '', '', '', event.notes || '',
            ])
          } else {
            eventProducts.forEach((product: any, index: number) => {
              eventRows.push([
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
          eventRows.push([
            event.displayId || event.id, event.clientName, event.venue,
            new Date(event.eventDate).toLocaleDateString('en-IN'),
            event.deliveryFromDate ? new Date(event.deliveryFromDate).toLocaleDateString('en-IN') : 'N/A',
            '', event.status || 'finished', event.contactPhone || '',
            event.managerName || 'N/A', event.headKarigarName || 'N/A',
            'Error Loading', 'Error Loading Products', '', '', '', '', event.notes || '',
          ])
        }
        eventRows.push(Array(17).fill(''))

        // Fetch audit logs for this event
        try {
          const [eventAuditsRes, productAuditsRes] = await Promise.all([
            auditApi.getAuditLogs({ entity_id: event.id, entity_type: 'Event', limit: 100 }),
            auditApi.getAuditLogs({ event_id: event.id, entity_type: 'Event Product', limit: 100 }),
          ])

          const eventAudits = eventAuditsRes.data || []
          const productAudits = productAuditsRes.data || []
          const allAudits = [...eventAudits, ...productAudits].sort((a: any, b: any) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )

          for (const entry of allAudits) {
            const timestamp = new Date(entry.timestamp || entry.created_at)
            const oldVals = entry.old_values || {}
            const newVals = entry.new_values || {}
            let changesSummary = ''
            if (entry.action === 'create') changesSummary = `Created new ${entry.entityType}`
            else if (entry.action === 'delete') changesSummary = `Deleted ${entry.entityType}`
            else if (entry.action === 'update') {
              const changedKeys = Object.keys(newVals).filter(k => k !== 'updated_at' && oldVals[k] !== newVals[k])
              changesSummary = changedKeys.length > 0 ? `Updated: ${changedKeys.join(', ')}` : 'Updated'
            }
            // Get event name from new_values or old_values for Event Product entries
            const eventName = entry.entityType === 'Event Product'
              ? (newVals.product?.name || oldVals.product?.name || entry.entityName || '')
              : (newVals.client_name || oldVals.client_name || entry.entityName || '')

            // Format old/new values as readable key-value pairs instead of JSON
            const formatValues = (vals: any) => {
              if (!vals || typeof vals !== 'object' || Object.keys(vals).length === 0) return ''
              return Object.entries(vals)
                .filter(([k]) => k !== 'updated_at' && k !== 'id' && k !== 'created_at')
                .map(([k, v]) => `${k}: ${v}`)
                .join('\n')
            }

            auditRows.push([
              entry.id, timestamp.toISOString(),
              timestamp.toLocaleDateString('en-IN'), timestamp.toLocaleTimeString('en-IN'),
              entry.action, entry.entityType, entry.entityDisplayId || '', eventName,
              entry.userName, entry.userEmail || '', entry.userRole,
              formatValues(oldVals),
              formatValues(newVals),
              changesSummary,
            ])
          }
        } catch {
          auditRows.push(['Error loading audit logs for event', event.displayId || event.id, '', '', '', '', '', '', '', '', '', '', '', ''])
        }
      }

      const wb = XLSX.utils.book_new()
      const ws1 = XLSX.utils.aoa_to_sheet(eventRows)
      const ws2 = XLSX.utils.aoa_to_sheet(auditRows)
      XLSX.utils.book_append_sheet(wb, ws1, 'Event Details')
      XLSX.utils.book_append_sheet(wb, ws2, 'Audit Logs')

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finished_events_${new Date().toISOString().split('T')[0]}.xlsx`
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
    handleExportXLSX,
    // Infinite scroll
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  }
}
