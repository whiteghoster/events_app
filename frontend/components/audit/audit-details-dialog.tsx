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
  const { data: eventData, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event', entry?.entityId],
    queryFn: () => eventsApi.getEventById(entry?.entityId || ''),
    enabled: !!entry?.entityId && open,
  })

  if (!entry) return null

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

          {/* Event Details */}
          {entry.entityId && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Event Details</h3>
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
            </div>
          )}

          {/* Audit Changes */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Changes</h3>
            <div className="space-y-2">
              {entry.change && (
                <p className="text-sm text-muted-foreground">{entry.change}</p>
              )}
              
              {entry.old_values || entry.new_values ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 font-medium">Field</th>
                        <th className="text-left p-2 font-medium">Old Value</th>
                        <th className="text-left p-2 font-medium">New Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys({ ...entry.old_values, ...entry.new_values }).map(key => {
                        const oldValue = entry.old_values?.[key];
                        const newValue = entry.new_values?.[key];
                        const isChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);
                        
                        return (
                          <tr key={key} className={isChanged ? 'bg-blue-50/50' : ''}>
                            <td className="p-2 border-t font-medium">{key}</td>
                            <td className="p-2 border-t text-muted-foreground">
                              {oldValue !== undefined ? (
                                typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue)
                              ) : '-'}
                            </td>
                            <td className="p-2 border-t">
                              {newValue !== undefined ? (
                                typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)
                              ) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No changes recorded</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
