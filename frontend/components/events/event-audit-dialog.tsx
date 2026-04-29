'use client'

import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { auditApi } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSkeleton } from '@/components/skeletons'

interface EventAuditDialogProps {
  eventId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventAuditDialog({ eventId, open, onOpenChange }: EventAuditDialogProps) {
  // Fetch event product audit logs for this event
  const { data: auditData, isLoading, error } = useQuery({
    queryKey: ['audit', 'event-products', eventId],
    queryFn: async () => {
      console.log('[Audit] Fetching product audits for event:', eventId)
      try {
        // First try with event_id filter
        let result = await auditApi.getAuditLogs({
          event_id: eventId,
          limit: 100,
        })
        
        // If no results, try without filter and filter client-side as fallback
        if (result.data?.length === 0) {
          console.log('[Audit] No results with event_id filter, trying fallback...')
          const allResult = await auditApi.getAuditLogs({ limit: 200 })
          // Filter client-side for this event
          const filtered = allResult.data?.filter((entry: any) => {
            const entryEventId = entry.new_values?.event_id || entry.old_values?.event_id
            const hasProductData = entry.new_values?.product || entry.old_values?.product
            return entryEventId === eventId && hasProductData
          }) || []
          console.log('[Audit] Fallback found', filtered.length, 'entries')
          result = { ...allResult, data: filtered }
        }
        
        console.log('[Audit] API response:', { count: result.data?.length, firstItem: result.data?.[0] })
        return result
      } catch (err) {
        console.error('[Audit] API fetch failed:', err)
        throw err
      }
    },
    enabled: open && !!eventId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  // Event product audits: event_id stored in new_values/old_values + has product data
  const eventProductLogs = auditData?.data?.filter((entry: any) => {
    const entryEventId = entry.new_values?.event_id || entry.old_values?.event_id
    const hasProductData = entry.new_values?.product || entry.old_values?.product
    return entryEventId === eventId && hasProductData
  }) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Event Product Audit Log</DialogTitle>
          <DialogDescription className="text-sm">
            View audit history for products in this event
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive mb-4">
            <p className="font-semibold">Failed to load audit logs</p>
            <p className="text-xs mt-1 opacity-80">{(error as Error)?.message || 'Unknown error'}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : eventProductLogs.length > 0 ? (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[140px] font-semibold">When</TableHead>
                    <TableHead className="w-[100px] font-semibold">User</TableHead>
                    <TableHead className="w-[80px] font-semibold">Role</TableHead>
                    <TableHead className="w-[80px] font-semibold">Action</TableHead>
                    <TableHead className="font-semibold">Product</TableHead>
                    <TableHead className="font-semibold">Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventProductLogs.map((entry: any) => (
                    <TableRow key={entry.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        <div className="font-medium">{new Date(entry.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="text-[10px]">{new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{entry.userName}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px] px-2 py-0.5 capitalize">{entry.userRole}</Badge></TableCell>
                      <TableCell>
                        <Badge 
                          variant={entry.action === 'create' ? 'default' : entry.action === 'delete' ? 'destructive' : 'outline'}
                          className="text-[10px] px-2 py-0.5 capitalize"
                        >
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {entry.new_values?.product?.name || entry.old_values?.product?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {entry.action === 'create' && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            ✓ Added: Qty {entry.new_values?.quantity} {entry.new_values?.unit}
                            {entry.new_values?.price && ` · ₹${entry.new_values?.price}`}
                          </span>
                        )}
                        {entry.action === 'delete' && (
                          <span className="text-xs text-red-600 dark:text-red-400">
                            ✗ Removed: Qty {entry.old_values?.quantity} {entry.old_values?.unit}
                            {entry.old_values?.price && ` · ₹${entry.old_values?.price}`}
                          </span>
                        )}
                        {entry.action === 'update' && (
                          <span className="text-xs">
                            <span className="text-blue-600 dark:text-blue-400">Qty:</span> {entry.old_values?.quantity} to {entry.new_values?.quantity}
                            {entry.old_values?.price !== entry.new_values?.price && (
                              <span className="ml-2"><span className="text-blue-600 dark:text-blue-400">Price:</span> ₹{entry.old_values?.price} to ₹{entry.new_values?.price}</span>
                            )}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <History className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No audit entries found for event products.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
