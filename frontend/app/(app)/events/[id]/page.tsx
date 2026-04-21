'use client'

import { useRouter } from 'next/navigation'
import { PencilEdit01Icon, Delete01Icon, Refresh01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/icon'
import { PageHeader } from '@/components/page-header'
import { useAuth, canEditEvent, canCloseEvent, canEditProductRow, canEditQuantityOnly } from '@/lib/auth-context'
import { useEventDetail } from '@/hooks/use-event-detail'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageTransition } from '@/components/page-transition'
import { EventDetailSkeleton } from '@/components/skeletons'
import { EventInfoCard } from '@/components/events/event-info-card'
import { ProductsTable } from '@/components/events/products-table'
import { CategorySummary } from '@/components/events/category-summary'
import { CloseEventDialog } from '@/components/events/close-event-dialog'

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { user } = useAuth()
  const detail = useEventDetail(id)

  if (detail.isLoading) {
    return <EventDetailSkeleton />
  }

  if (!detail.event) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Event not found.</p>
        <Button variant="outline" onClick={() => router.push('/events')}>Back to Events</Button>
      </div>
    )
  }

  const event = detail.event
  const isEditable = event.status !== 'finished'
  const canEdit = !!(user && canEditProductRow(user.role))
  const quantityOnly = !!(user && canEditQuantityOnly(user.role))
  const canEditQty = !!(user && (canEditProductRow(user.role) || canEditQuantityOnly(user.role)))

  return (
    <PageTransition>
      <PageHeader
        title={event.clientName}
        breadcrumbs={[
          { label: 'Events', href: '/events' },
          { label: event.clientName },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {event.displayId && (
              <Badge variant="outline" className="font-mono">{event.displayId}</Badge>
            )}
            <Button variant="outline" size="sm" onClick={detail.reload}>
              <Icon icon={Refresh01Icon} size={16} className="sm:mr-2" />
              <span className="hidden sm:inline">Reload</span>
            </Button>
            {user && canEditEvent(user.role) && isEditable && (
              <Button variant="outline" size="sm" onClick={() => router.push(`/events/${id}/edit`)}>
                <Icon icon={PencilEdit01Icon} size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
            {user && canCloseEvent(user.role) && event.status !== 'hold' && event.status !== 'finished' && (
              <Button variant="outline" size="sm" onClick={() => { detail.setCloseStatus('hold'); detail.setCloseModalOpen(true) }}>
                Hold
              </Button>
            )}
            {user && canCloseEvent(user.role) && event.status !== 'finished' && (
              <Button size="sm" onClick={() => { detail.setCloseStatus('finished'); detail.setCloseModalOpen(true) }}>
                Finish
              </Button>
            )}
            {user?.role === 'admin' && (
              <Button variant="outline" size="sm" className="text-destructive" onClick={detail.handleDeleteEvent}>
                <Icon icon={Delete01Icon} size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}
          </div>
        }
      />

      <EventInfoCard
        event={event}
        infoExpanded={detail.infoExpanded}
        setInfoExpanded={detail.setInfoExpanded}
      />

      <ProductsTable
        eventProductsList={detail.eventProductsList}
        allCategories={detail.allCategories}
        allProducts={detail.allProducts}
        filteredProducts={detail.filteredProducts}
        units={detail.units}
        isEditable={isEditable}
        canEdit={canEdit}
        quantityOnly={quantityOnly}
        canEditQty={canEditQty}
        editingRow={detail.editingRow}
        editingData={detail.editingData}
        setEditingData={detail.setEditingData}
        addingNew={detail.addingNew}
        setAddingNew={detail.setAddingNew}
        newProductData={detail.newProductData}
        setNewProductData={detail.setNewProductData}
        handleStartEdit={detail.handleStartEdit}
        handleSaveEdit={detail.handleSaveEdit}
        handleCancelEdit={detail.handleCancelEdit}
        handleDeleteProduct={detail.handleDeleteProduct}
        handleAddProduct={detail.handleAddProduct}
        resetNewProduct={detail.resetNewProduct}
      />

      <CategorySummary
        categorySummary={detail.categorySummary}
        totalRows={detail.eventProductsList.length}
      />

      <CloseEventDialog
        open={detail.closeModalOpen}
        onOpenChange={detail.setCloseModalOpen}
        clientName={event.clientName}
        closeStatus={detail.closeStatus}
        setCloseStatus={detail.setCloseStatus}
        onConfirm={detail.handleCloseEvent}
      />
    </PageTransition>
  )
}
