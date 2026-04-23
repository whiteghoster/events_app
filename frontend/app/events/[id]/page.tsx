
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, Pencil, Trash2,
  MapPin, Calendar, RefreshCw, MoreVertical, Phone, User, Crown,
  Pause, CheckCircle2, Building2, FileText, Info,
} from 'lucide-react'
import { useAuth, canEditEvent, canCloseEvent, canEditProductRow, canEditQuantityOnly, canRevertFinishedEvent, canDeleteFinishedEvent } from '@/lib/auth-context'
import { useEventDetail } from '@/hooks/use-event-detail'
import { EventDetailSkeleton } from '@/components/skeletons'
import { EventProductsTable } from '@/components/events/event-products-table'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Event as EventType, EventProduct } from '@/lib/types'

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { user } = useAuth()
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false)
  const [actionsDialogOpen, setActionsDialogOpen] = useState(false)
  const {
    event, isLoading, eventProductsList, categorySummary,
    allCategories, allProducts, filteredProducts, units,
    closeModalOpen, setCloseModalOpen, closeStatus, setCloseStatus,
    editingRow, editingData, setEditingData,
    addingNew, setAddingNew, newProductData, setNewProductData,
    handleStartEdit, handleSaveEdit, handleCancelEdit,
    handleDeleteProduct, handleDeleteEvent, handleAddProduct, handleCloseEvent,
    reload, resetNewProduct,
  } = useEventDetail(id)

  if (isLoading) return <EventDetailSkeleton />

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Event not found in database.</p>
        <Button variant="outline" onClick={() => router.push('/events')}>Back to Events</Button>
      </div>
    )
  }

  const isEditable = event.status !== 'finished'
  const isFinished = event.status === 'finished'
  // Allow all users to edit products (only event status changes are restricted)
  const canEdit = !!user && isEditable
  const canEditQuantity = !!user && isEditable
  const quantityOnly = false
  // Check if user can revert or delete finished events
  const canRevertFinished = user && isFinished && canRevertFinishedEvent(user.role, event.createdBy, user.id)
  const canDeleteFinished = user && isFinished && canDeleteFinishedEvent(user.role, event.createdBy, user.id)
  const pricedItems = eventProductsList.filter(p => p.price && p.price > 0)
  const grandTotal = eventProductsList.reduce((sum, p) => sum + (p.price || 0), 0)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="mb-6 space-y-3">
        {/* Row 1: Back + title + actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 -ml-1 h-9 w-9"
            onClick={() => router.push('/events')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <h1 className="flex-1 min-w-0 text-lg sm:text-xl font-bold tracking-tight truncate">
            {event.clientName}
          </h1>

          {/* Actions */}
          <div className="flex items-center shrink-0 bg-muted/50 rounded-lg p-0.5 gap-0.5">
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 rounded-md" onClick={() => setInfoDrawerOpen(true)}>
              <Info className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={reload} className="h-8 w-8 rounded-md">
              <RefreshCw className="w-4 h-4" />
            </Button>
            {user && canEditEvent(user.role) && isEditable && (
              <Button variant="ghost" size="icon" onClick={() => router.push(`/events/${id}/edit`)} className="h-8 w-8 rounded-md">
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-md gap-1"
              onClick={() => setActionsDialogOpen(true)}
            >
              <MoreVertical className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Actions</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Status + ID on their own line */}
        <div className="flex items-center gap-2 pl-10 sm:pl-11">
          {event.status && <StatusBadge status={event.status} />}
          {event.displayId && (
            <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {event.displayId}
            </span>
          )}
          {event.companyName && (
            <>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-xs text-muted-foreground truncate">{event.companyName}</span>
            </>
          )}
        </div>
      </div>

      {/* ─── Two-column layout ──────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left Sidebar — desktop only */}
        <div className="hidden lg:block w-72 xl:w-80 shrink-0 space-y-4">
          <EventInfoPanel event={event} categorySummary={categorySummary} eventProductsList={eventProductsList} grandTotal={grandTotal} pricedItems={pricedItems} />
        </div>

        {/* Mobile Info Drawer */}
        <Drawer open={infoDrawerOpen} onOpenChange={setInfoDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Event Details</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto max-h-[70vh] space-y-4">
              <EventInfoPanel event={event} categorySummary={categorySummary} eventProductsList={eventProductsList} grandTotal={grandTotal} pricedItems={pricedItems} />
            </div>
          </DrawerContent>
        </Drawer>

        {/* Right: Products Table (TanStack Table) */}
        <div className="flex-1 min-w-0">
          <EventProductsTable
            products={eventProductsList}
            canEdit={!!canEdit}
            canEditQuantity={!!canEditQuantity}
            quantityOnly={!!quantityOnly}
            isEditable={isEditable}
            allCategories={allCategories}
            allProducts={allProducts}
            filteredProducts={filteredProducts}
            units={units}
            editingRow={editingRow}
            editingData={editingData}
            setEditingData={setEditingData}
            addingNew={addingNew}
            setAddingNew={setAddingNew}
            newProductData={newProductData}
            setNewProductData={setNewProductData}
            onStartEdit={handleStartEdit}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onDeleteProduct={handleDeleteProduct}
            onAddProduct={handleAddProduct}
            onResetNewProduct={resetNewProduct}
          />
        </div>
      </div>

      {/* ─── Close Event Modal ──────────────────────────────────── */}
      <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Event Status</DialogTitle>
            <DialogDescription>
              Choose the new status for &quot;{event.clientName}&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <label className={cn('flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors', closeStatus === 'hold' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30')}>
              <input type="radio" name="closeStatus" value="hold" checked={closeStatus === 'hold'} onChange={() => setCloseStatus('hold')} className="accent-primary" />
              <div>
                <p className="text-sm font-medium">Hold</p>
                <p className="text-xs text-muted-foreground">Admin can still edit</p>
              </div>
            </label>
            <label className={cn('flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors', closeStatus === 'finished' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30')}>
              <input type="radio" name="closeStatus" value="finished" checked={closeStatus === 'finished'} onChange={() => setCloseStatus('finished')} className="accent-primary" />
              <div>
                <p className="text-sm font-medium">Finished</p>
                <p className="text-xs text-muted-foreground">Permanently read-only</p>
              </div>
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCloseModalOpen(false)} className="flex-1 sm:flex-none">Cancel</Button>
            <Button onClick={handleCloseEvent} className="flex-1 sm:flex-none">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Actions Dialog ─────────────────────────────────────── */}
      <Dialog open={actionsDialogOpen} onOpenChange={setActionsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Event Actions</DialogTitle>
            <DialogDescription>
              Manage event status for &quot;{event.clientName}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-2">
            {user && canCloseEvent(user.role) && isEditable ? (
              <>
                {event.status !== 'hold' && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => {
                      setActionsDialogOpen(false)
                      setCloseStatus('hold')
                      setCloseModalOpen(true)
                    }}
                  >
                    <Pause className="w-5 h-5 text-amber-500" />
                    <div className="text-left">
                      <p className="font-medium">Put on Hold</p>
                      <p className="text-xs text-muted-foreground">Pause the event - admin can still edit</p>
                    </div>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => {
                    setActionsDialogOpen(false)
                    setCloseStatus('finished')
                    setCloseModalOpen(true)
                  }}
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div className="text-left">
                    <p className="font-medium">Mark as Finished</p>
                    <p className="text-xs text-muted-foreground">Complete the event - becomes read-only</p>
                  </div>
                </Button>
                {user.role === 'admin' && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3 border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setActionsDialogOpen(false)
                      handleDeleteEvent()
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Delete Event</p>
                      <p className="text-xs text-muted-foreground">Permanently remove this event</p>
                    </div>
                  </Button>
                )}
              </>
            ) : isFinished && (canRevertFinished || canDeleteFinished) ? (
              <>
                {canRevertFinished && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => {
                      setActionsDialogOpen(false)
                      setCloseStatus('hold')
                      setCloseModalOpen(true)
                    }}
                  >
                    <RefreshCw className="w-5 h-5 text-amber-500" />
                    <div className="text-left">
                      <p className="font-medium">Revert to Hold</p>
                      <p className="text-xs text-muted-foreground">Restore event for editing</p>
                    </div>
                  </Button>
                )}
                {canDeleteFinished && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3 border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setActionsDialogOpen(false)
                      handleDeleteEvent()
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Delete Event</p>
                      <p className="text-xs text-muted-foreground">Permanently remove this finished event</p>
                    </div>
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {!user ? 'Please log in to manage events' : !canCloseEvent(user.role) ? `Your role "${user.role}" cannot change event status` : 'Event is finished and locked'}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionsDialogOpen(false)} className="w-full">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ─── Shared info panel (sidebar + drawer) ────────────────────── */
function EventInfoPanel({ event, categorySummary, eventProductsList, grandTotal, pricedItems }: {
  event: EventType; categorySummary: any[]; eventProductsList: EventProduct[]; grandTotal: number; pricedItems: EventProduct[]
}) {
  return (
    <>
      <div className="bg-card rounded-md border border-border p-4 space-y-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Event Details</h3>
        <div className="space-y-3">
          {event.venue && <InfoRow icon={<MapPin className="w-4 h-4" />} label="Venue"><span>{event.venue}</span>{event.city && <span className="text-muted-foreground text-xs"> ({event.city})</span>}</InfoRow>}
          {event.venueAddress && <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address"><span className="text-xs">{event.venueAddress}</span></InfoRow>}
          {event.deliveryFromDate && (
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Delivery">
              <span>{new Date(event.deliveryFromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {event.deliveryToDate ? new Date(event.deliveryToDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'TBD'}</span>
            </InfoRow>
          )}
          {event.companyName && <InfoRow icon={<Building2 className="w-4 h-4" />} label="Company"><span>{event.companyName}</span></InfoRow>}
          {event.contactPhone && <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone"><span>{event.contactPhone}</span></InfoRow>}
          {event.managerName && <InfoRow icon={<User className="w-4 h-4" />} label="Manager"><span>{event.managerName}</span></InfoRow>}
          {event.headKarigarName && <InfoRow icon={<Crown className="w-4 h-4" />} label="Head Karigar"><span>{event.headKarigarName}</span></InfoRow>}
          {event.notes && <InfoRow icon={<FileText className="w-4 h-4" />} label="Notes"><span className="text-xs leading-relaxed">{event.notes}</span></InfoRow>}
        </div>
      </div>

      {categorySummary.length > 0 && (
        <div className="bg-card rounded-md border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category Summary</h3>
          </div>
          <div className="p-4 space-y-3">
            {categorySummary.map((item, idx) => (
              <div key={idx}>
                <span className="text-sm font-medium text-foreground">{item.category}</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {item.totals.map((t: any, tidx: number) => (
                    <Badge key={tidx} variant="secondary" className="text-[11px] font-mono tabular-nums">{t.quantity} {t.unit}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-4 py-2 bg-muted/30">
            <span className="text-xs text-muted-foreground">{categorySummary.length} categor{categorySummary.length !== 1 ? 'ies' : 'y'} · {eventProductsList.length} item{eventProductsList.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {eventProductsList.length > 0 && (
        <div className="bg-card rounded-md border border-border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <span className="text-xl font-bold text-primary tabular-nums">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
          {pricedItems.length > 0 && pricedItems.length < eventProductsList.length && (
            <p className="text-[11px] text-muted-foreground mt-1 text-right">{eventProductsList.length - pricedItems.length} of {eventProductsList.length} items unpriced</p>
          )}
        </div>
      )}
    </>
  )
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  )
}
