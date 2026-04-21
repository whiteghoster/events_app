'use client'

import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { useAuth, canEditEvent } from '@/lib/auth-context'
import { useEventForm } from '@/hooks/use-event-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/page-transition'
import { FormSkeleton } from '@/components/skeletons'
import { EventFormFields } from '@/components/events/event-form-fields'

export default function EditEventPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { user } = useAuth()
  const {
    formData, errors, isLoading, isPageLoading,
    clients, selectedDropdownClient,
    karigars, managers,
    handleChange, handleClientSelect, handleSubmit,
  } = useEventForm(id)

  if (!user || !canEditEvent(user.role)) {
    router.replace('/events')
    return null
  }

  if (isPageLoading) {
    return <FormSkeleton />
  }

  return (
    <PageTransition>
      <PageHeader
        title="Edit Event"
        breadcrumbs={[
          { label: 'Events', href: '/events' },
          { label: formData.clientName || 'Edit', href: `/events/${id}` },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-6">
            <EventFormFields
              formData={formData}
              errors={errors}
              clients={clients}
              selectedDropdownClient={selectedDropdownClient}
              karigars={karigars}
              managers={managers}
              handleChange={handleChange}
              handleClientSelect={handleClientSelect}
              variant="edit"
            />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.push(`/events/${id}`)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading && <Skeleton className="h-4 w-16 mr-2" />}
            Save Changes
          </Button>
        </div>
      </form>
    </PageTransition>
  )
}
