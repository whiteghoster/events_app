'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { History, Trash2, Check, X } from 'lucide-react'
import { auditApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSkeleton } from '@/components/skeletons'
import { Checkbox } from '@/components/ui/checkbox'

interface EventAuditDialogProps {
  eventId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AUTHORIZED_EMAIL = 'anshumanprajapati575@gmail.com'

export function EventAuditDialog({ eventId, open, onOpenChange }: EventAuditDialogProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch event product audit logs for this event
  const { data: auditData, isLoading, error, refetch } = useQuery({
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

  const canDelete = user?.email === AUTHORIZED_EMAIL

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === eventProductLogs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(eventProductLogs.map((log: any) => log.id)))
    }
  }

  const handleDelete = async () => {
    if (selectedIds.size === 0) return
    
    setIsDeleting(true)
    try {
      await auditApi.deleteAuditLogs(Array.from(selectedIds))
      setSelectedIds(new Set())
      setIsDeleteMode(false)
      setShowConfirmDialog(false)
      await refetch()
    } catch (err) {
      console.error('Failed to delete audit logs:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const exitDeleteMode = () => {
    setIsDeleteMode(false)
    setSelectedIds(new Set())
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-8">
              <div>
                <DialogTitle className="text-xl">Event Product Audit Log</DialogTitle>
                <DialogDescription className="text-sm">
                  View audit history for products in this event
                </DialogDescription>
              </div>
              {canDelete && !isDeleteMode && (
                <Button
                  size="sm"
                  onClick={() => setIsDeleteMode(true)}
                  className="gap-2 bg-red-700 hover:bg-red-800 text-white self-start sm:self-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              )}
              {isDeleteMode && (
                <div className="flex gap-2 self-start sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exitDeleteMode}
                    disabled={isDeleting}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={selectedIds.size === 0 || isDeleting}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedIds.size})
                  </Button>
                </div>
              )}
            </div>
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
                      {isDeleteMode && (
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedIds.size === eventProductLogs.length && eventProductLogs.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                      )}
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
                        {isDeleteMode && (
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(entry.id)}
                              onCheckedChange={() => toggleSelect(entry.id)}
                            />
                          </TableCell>
                        )}
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} audit log{selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
