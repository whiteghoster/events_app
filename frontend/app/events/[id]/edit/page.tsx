'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useAuth, canEditEvent } from '@/lib/auth-context'
import { useEventForm } from '@/hooks/use-event-form'
import { FormSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const {
    formData, errors, isLoading, isPageLoading, clients, selectedDropdownClient,
    karigars, managers, handleChange, handleClientSelect, handleSubmit,
  } = useEventForm(id)

  if (user && !canEditEvent(user.role)) {
    router.replace('/events')
    return null
  }

  if (isPageLoading) {
    return <FormSkeleton />
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        title="Edit Event"
        breadcrumbs={[
          { label: 'Events', href: '/events' },
          { label: formData.clientName || 'Edit Event', href: `/events/${id}` },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto pb-10 px-4 sm:px-0">
        <div className="bg-card rounded-md border border-border p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Section 1: Event Identity */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Event Identity</h2>

            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-label">
                Client Name <span className="text-primary">*</span>
              </Label>
              <Select
                value={selectedDropdownClient}
                onValueChange={handleClientSelect}
              >
                <SelectTrigger className={errors.clientName ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select or type client name" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      No existing clients found
                    </div>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.client_name} value={client.client_name}>
                        {client.client_name} {client.company_name ? `(${client.company_name})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.clientName && <p className="text-destructive text-sm">{errors.clientName}</p>}
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                placeholder="Or type new client name"
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-label">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-label">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  placeholder="e.g., 9876543210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate" className="text-label">
                Event Date <span className="text-primary">*</span>
              </Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => handleChange('eventDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={errors.eventDate ? 'border-destructive' : ''}
              />
              {errors.eventDate && <p className="text-destructive text-sm">{errors.eventDate}</p>}
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Section: Delivery Dates */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Delivery Dates</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryFromDate" className="text-label">Delivery From</Label>
                <Input
                  id="deliveryFromDate"
                  type="date"
                  value={formData.deliveryFromDate}
                  onChange={(e) => handleChange('deliveryFromDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryToDate" className="text-label">Delivery To</Label>
                <Input
                  id="deliveryToDate"
                  type="date"
                  value={formData.deliveryToDate}
                  onChange={(e) => handleChange('deliveryToDate', e.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Section 3: Venue */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Venue</h2>

            <div className="space-y-2">
              <Label htmlFor="venue" className="text-label">
                Venue <span className="text-primary">*</span>
              </Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => handleChange('venue', e.target.value)}
                className={errors.venue ? 'border-destructive' : ''}
              />
              {errors.venue && <p className="text-destructive text-sm">{errors.venue}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="venueAddress" className="text-label">Venue Address</Label>
              <Textarea
                id="venueAddress"
                value={formData.venueAddress}
                onChange={(e) => handleChange('venueAddress', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-label">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Section 4: Staff Assignment */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Staff Assignment</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="headKarigarName" className="text-label">Head Karigar</Label>
                <Select
                  value={formData.headKarigarName}
                  onValueChange={(v) => handleChange('headKarigarName', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select karigar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {karigars.map(s => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerName" className="text-label">Manager</Label>
                <Select
                  value={formData.managerName}
                  onValueChange={(v) => handleChange('managerName', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {managers.map(s => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <Button type="button" variant="ghost" onClick={() => router.push(`/events/${id}`)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
