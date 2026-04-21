'use client'

import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { useAuth, canCreateEvent } from '@/lib/auth-context'
import { useEventForm } from '@/hooks/use-event-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/page-transition'
import { EventFormFields } from '@/components/events/event-form-fields'

export default function NewEventPage() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    formData, errors, isLoading,
    clients, selectedDropdownClient,
    karigars, managers,
    handleChange, handleClientSelect, handleSubmit,
  } = useEventForm()

  if (!user || !canCreateEvent(user.role)) {
    router.replace('/events')
    return null
  }

  return (
    <PageTransition>
      <PageHeader
        title="Create Event"
        breadcrumbs={[
          { label: 'Events', href: '/events' },
          { label: 'New Event' },
        ]}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-6 space-y-6">
            <EventFormFields
              formData={formData}
              errors={errors}
              clients={clients}
              selectedDropdownClient={selectedDropdownClient}
              karigars={karigars}
              managers={managers}
              handleChange={handleChange}
              handleClientSelect={handleClientSelect}
              variant="new"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.push('/events')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Skeleton className="h-4 w-16 mr-2" />}
            Create Event
          </Button>
        </div>
      </form>
    </PageTransition>
  )
}
