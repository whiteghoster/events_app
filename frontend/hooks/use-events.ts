import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ExcelJS from 'exceljs'
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
    queryFn: ({ pageParam }) => eventsApi.getEvents(activeTab, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading new
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

      const workbook = new ExcelJS.Workbook()

      // --- Sheet 1: Event Details ---
      const eventSheet = workbook.addWorksheet('Event Details')
      const eventHeaders = [
        'Event Code', 'Start Date', 'End Date', 'Client Name', 'Venue', 'City',
        'Manager', 'Head Karigar', 'Category', 'Product Name', 'Quantity', 'Unit', 'Price',
      ]
      eventSheet.addRow(eventHeaders)

      // Style header row
      const headerRow = eventSheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EA580C' } } // Primary orange color
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

      // Set column widths
      eventSheet.columns = [
        { key: 'eventCode', width: 15 },
        { key: 'startDate', width: 15 },
        { key: 'endDate', width: 15 },
        { key: 'clientName', width: 25 },
        { key: 'venue', width: 25 },
        { key: 'city', width: 15 },
        { key: 'manager', width: 20 },
        { key: 'karigar', width: 20 },
        { key: 'category', width: 18 },
        { key: 'product', width: 25 },
        { key: 'quantity', width: 10 },
        { key: 'unit', width: 10 },
        { key: 'price', width: 12 },
      ]

      // Freeze header row
      eventSheet.views = [{ state: 'frozen', ySplit: 1 }]

      // Add alternating row colors
      let rowIndex = 2

      // Collect all audit data first
      const allAuditData: Array<{
        event: Event
        entry: any
        timestamp: Date
        changedFields: Array<{ field: string; oldValue: string; newValue: string }>
      }> = []

      for (const event of finishedEvents) {
        // Add event data to Event Details sheet
        try {
          const eventProducts = await eventsApi.getEventProducts(event.id)
          if (eventProducts.length === 0) {
            const row = eventSheet.addRow([
              event.displayId || event.id,
              new Date(event.eventDate).toLocaleDateString('en-IN'),
              event.deliveryToDate ? new Date(event.deliveryToDate).toLocaleDateString('en-IN') : 'N/A',
              event.clientName,
              event.venue,
              event.city || 'N/A',
              event.managerName || 'N/A',
              event.headKarigarName || 'N/A',
              'N/A', 'No Products', '', '', '',
            ])
            if (rowIndex % 2 === 0) {
              row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5EB' } }
            }
            rowIndex++
          } else {
            let eventTotal = 0
            eventProducts.forEach((product: any, index: number) => {
              const price = product.price || 0
              eventTotal += price
              const row = eventSheet.addRow([
                index === 0 ? (event.displayId || event.id) : '',
                index === 0 ? new Date(event.eventDate).toLocaleDateString('en-IN') : '',
                index === 0 ? (event.deliveryToDate ? new Date(event.deliveryToDate).toLocaleDateString('en-IN') : 'N/A') : '',
                index === 0 ? event.clientName : '',
                index === 0 ? event.venue : '',
                index === 0 ? (event.city || 'N/A') : '',
                index === 0 ? (event.managerName || 'N/A') : '',
                index === 0 ? (event.headKarigarName || 'N/A') : '',
                product.categoryName || 'N/A',
                product.productName || 'N/A',
                product.quantity?.toString() || '0',
                product.unit || 'pcs',
                price.toString(),
              ])
              if (rowIndex % 2 === 0) {
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5EB' } }
              }
              rowIndex++
            })
            // Add total row for this event
            const totalRow = eventSheet.addRow([
              '', '', '', '', '', '', '', '', '', 'TOTAL', '', '', eventTotal.toString(),
            ])
            totalRow.font = { bold: true }
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FED7AA' } }
            rowIndex++
          }
        } catch {
          const row = eventSheet.addRow([
            event.displayId || event.id,
            new Date(event.eventDate).toLocaleDateString('en-IN'),
            event.deliveryToDate ? new Date(event.deliveryToDate).toLocaleDateString('en-IN') : 'N/A',
            event.clientName,
            event.venue,
            event.city || 'N/A',
            event.managerName || 'N/A',
            event.headKarigarName || 'N/A',
            'Error Loading', 'Error Loading Products', '', '', '',
          ])
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } }
          rowIndex++
        }

        // Add blank row separator
        eventSheet.addRow(Array(13).fill(''))
        rowIndex++

        // Fetch audit logs for this event
        try {
          const [eventAuditsRes, productAuditsRes] = await Promise.all([
            auditApi.getAuditLogs({ entity_id: event.id, entity_type: 'Event', limit: 100 }),
            auditApi.getAuditLogs({ event_id: event.id, entity_type: 'Event Product', limit: 100 }),
          ])

          const eventAudits = eventAuditsRes.data || []
          const productAudits = productAuditsRes.data || []
          const allAudits = [...eventAudits, ...productAudits]

          // Get value helper
          const getValue = (vals: any, key: string) => {
            if (!vals || typeof vals !== 'object') return ''
            const val = vals[key]
            if (val === null || val === undefined) return ''
            if (typeof val === 'object') return JSON.stringify(val)
            return String(val)
          }

          const getProductName = (vals: any) => {
            if (vals.product?.name) return vals.product.name
            if (vals.product_name) return vals.product_name
            if (typeof vals.product === 'string') return vals.product
            return ''
          }

          const fieldMappings: [string, string[]][] = [
            ['Event Name', ['client_name']],
            ['Venue', ['venue']],
            ['Event Date', ['event_date', 'delivery_from_date']],
            ['Delivery To', ['delivery_to_date']],
            ['Contact Phone', ['contact_phone']],
            ['Manager', ['manager_name']],
            ['Karigar', ['head_karigar_name']],
            ['Notes', ['notes']],
            ['Status', ['status']],
            ['Product', ['product', 'product_name']],
            ['Quantity', ['quantity']],
            ['Unit', ['unit']],
            ['Price', ['price']],
          ]

          for (const entry of allAudits) {
            const timestamp = new Date(entry.timestamp)
            const oldVals = entry.old_values || {}
            const newVals = entry.new_values || {}

            const changedFields: Array<{ field: string; oldValue: string; newValue: string }> = []
            
            for (const [displayName, keys] of fieldMappings) {
              for (const key of keys) {
                let oldVal = ''
                let newVal = ''
                
                if (key === 'product' || key === 'product_name') {
                  oldVal = getProductName(oldVals)
                  newVal = getProductName(newVals)
                } else {
                  for (const k of keys) {
                    oldVal = getValue(oldVals, k)
                    newVal = getValue(newVals, k)
                    if (oldVal || newVal) break
                  }
                }
                
                if (oldVal !== newVal || (key === 'product' && (oldVal || newVal))) {
                  changedFields.push({ field: displayName, oldValue: oldVal, newValue: newVal })
                  break
                }
              }
            }

            const standardKeys = [
              'client_name', 'venue', 'event_date', 'delivery_from_date', 'delivery_to_date',
              'contact_phone', 'manager_name', 'head_karigar_name', 'notes', 'status',
              'product', 'product_name', 'quantity', 'unit', 'price', 'category',
              'updated_at', 'id', 'created_at', 'event_id', 'created_by'
            ]
            const allKeys = new Set([...Object.keys(oldVals), ...Object.keys(newVals)])
            for (const key of allKeys) {
              if (!standardKeys.includes(key)) {
                const oldVal = getValue(oldVals, key)
                const newVal = getValue(newVals, key)
                if (oldVal !== newVal) {
                  changedFields.push({ field: key, oldValue: oldVal || '(empty)', newValue: newVal || '(empty)' })
                }
              }
            }

            if (changedFields.length === 0 && entry.action === 'create') {
              changedFields.push({ field: 'Action', oldValue: '', newValue: 'New entry created' })
            } else if (changedFields.length === 0 && entry.action === 'delete') {
              changedFields.push({ field: 'Action', oldValue: 'Entry existed', newValue: 'Entry deleted' })
            }

            allAuditData.push({
              event,
              entry,
              timestamp,
              changedFields
            })
          }
        } catch {
          // Silent error handling
        }
      }

      // --- Sheet 2: Audit Logs Grouped by Action ---
      const auditSheet = workbook.addWorksheet('Audit Logs')
      auditSheet.columns = [
        { key: 'field', width: 30 },
        { key: 'oldValue', width: 35 },
        { key: 'newValue', width: 35 },
      ]

      // Group audits by action type
      const createAudits = allAuditData.filter(a => a.entry.action === 'create')
      const updateAudits = allAuditData.filter(a => a.entry.action === 'update')
      const deleteAudits = allAuditData.filter(a => a.entry.action === 'delete')

      // Helper function to add audit section
      const addAuditSection = (title: string, audits: typeof allAuditData, color: string) => {
        if (audits.length === 0) return

        // Section title row
        const titleRow = auditSheet.addRow([title, '', ''])
        titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } }
        titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
        titleRow.alignment = { horizontal: 'center', vertical: 'middle' }

        // Add each audit entry in this section
        for (const { event, entry, timestamp, changedFields } of audits) {
          // Entry header
          const headerRow = auditSheet.addRow([
            `Event: ${entry.entityDisplayId || event.id} | By: ${entry.userName} (${entry.userRole})`,
            `Date: ${timestamp.toLocaleDateString('en-IN')} ${timestamp.toLocaleTimeString('en-IN')}`,
            `Entity: ${entry.entityType}`
          ])
          headerRow.font = { bold: true, size: 10 }
          headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } }

          // Column headers
          const colHeaderRow = auditSheet.addRow(['Field', 'Old Value', 'New Value'])
          colHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } }
          colHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6B7280' } }

          // Data rows
          for (const { field, oldValue, newValue } of changedFields) {
            auditSheet.addRow([field, oldValue, newValue])
          }

          // Blank row separator
          auditSheet.addRow(['', '', ''])
        }

        // Blank row between sections
        auditSheet.addRow(['', '', ''])
        auditSheet.addRow(['', '', ''])
      }

      // Add sections in order: Create (green), Update (blue), Delete (red)
      addAuditSection('CREATE ENTRIES', createAudits, '10B981') // Green
      addAuditSection('UPDATE ENTRIES', updateAudits, '3B82F6') // Blue  
      addAuditSection('DELETE ENTRIES', deleteAudits, 'EF4444') // Red

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
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
