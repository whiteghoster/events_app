'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { eventsApi } from '@/lib/api'
import type { AuditEntry } from '@/lib/types'

interface AuditDetailsDialogProps {
  entry: AuditEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuditDetailsDialog({ entry, open, onOpenChange }: AuditDetailsDialogProps) {
  // Only fetch parent event data for Event entities, not Event Products
  const isEventProduct = entry?.entityType?.toLowerCase().includes('product')
  const parentEventId = isEventProduct ? null : entry?.entityId

  // For Event Products, fetch product details if not already in audit data
  const productId = entry?.new_values?.product_id || entry?.old_values?.product_id
  const hasProductData = entry?.new_values?.product?.name || entry?.old_values?.product?.name

  const { data: eventData, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event', parentEventId],
    queryFn: () => eventsApi.getEventById(parentEventId || ''),
    enabled: !!parentEventId && open,
  })

  const { data: productData } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => eventsApi.getProductById(productId || ''),
    enabled: isEventProduct && !!productId && !hasProductData && open,
  })

  if (!entry) return null

  // Merge product data from audit log or fetched from API
  const productInfo = entry?.new_values?.product || entry?.old_values?.product || productData

  const isEventDeleted = !isLoadingEvent && !eventData
  const event = eventData

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Details</DialogTitle>
          <DialogDescription>
            {entry.action === 'create' && 'Created '}
            {entry.action === 'update' && 'Updated '}
            {entry.action === 'delete' && 'Deleted '}
            {entry.entityType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium">{entry.userName}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(entry.timestamp).toLocaleString('en-IN')}
              </p>
            </div>
            <Badge variant="secondary" className="capitalize text-xs">
              {entry.userRole}
            </Badge>
          </div>

          {/* Entity Details */}
          {entry.entityId && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                {entry.entityType?.toLowerCase().includes('product') ? 'Event Product Details' : 'Event Details'}
              </h3>
              
              {/* For Event Products, show details from old_values/new_values */}
              {entry.entityType?.toLowerCase().includes('product') ? (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Product:</span>{' '}
                      <span className="ml-1 font-medium">
                        {productInfo?.name || 'N/A'}
                        {entry.action && ` (${entry.action.charAt(0).toUpperCase() + entry.action.slice(1)})`}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>{' '}
                      <span className="ml-1">{productInfo?.category?.name || productInfo?.category_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>{' '}
                      <span className="ml-1">{entry.new_values?.quantity || entry.old_values?.quantity || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Unit:</span>{' '}
                      <span className="ml-1">{entry.new_values?.unit || entry.old_values?.unit || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>{' '}
                      <span className="ml-1">{entry.new_values?.price || entry.old_values?.price ? `₹${(entry.new_values?.price || entry.old_values?.price).toLocaleString('en-IN')}` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">UUID:</span>{' '}
                      <span className="ml-1 font-mono text-xs">{entry.entityId.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* For Events, show parent event details */
                <>
                  {isEventDeleted ? (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive font-medium">Event Deleted</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This event no longer exists in the database.
                      </p>
                    </div>
                  ) : isLoadingEvent ? (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Loading event details...</p>
                    </div>
                  ) : event ? (
                    <div className="p-3 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{event.clientName}</p>
                        {event.displayId && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {event.displayId}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Status:</span>{' '}
                          <Badge variant="secondary" className="ml-1 capitalize">
                            {event.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>{' '}
                          <span className="ml-1">{event.eventDate || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Venue:</span>{' '}
                          <span className="ml-1">{event.venue || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">UUID:</span>{' '}
                          <span className="ml-1 font-mono text-xs">{entry.entityId.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
