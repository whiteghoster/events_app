'use client'

import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useAuth, canCreateEvent } from '@/lib/auth-context'
import { useEventForm } from '@/hooks/use-event-form'
import { EventContractorForm } from '@/components/events/event-contractor-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function NewEventPage() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    formData, errors, isLoading, clients, contractors, isLoadingContractors, selectedDropdownClient,
    karigars, managers, handleChange, handleClientSelect, handleSubmit,
    addContractorEntry, removeContractorEntry, updateContractorEntry,
  } = useEventForm()

  if (!user || !canCreateEvent(user.role)) {
    router.replace('/events')
    return null
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        title="Create Event"
        breadcrumbs={[
          { label: 'Events', href: '/events' },
          { label: 'New Event' },
        ]}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="bg-card rounded-md border border-border p-6 space-y-8">
          {/* Section 1: Client Details */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Client Details</h2>

            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-label">
                Client Name <span className="text-primary">*</span>
              </Label>
              <Select
                value={selectedDropdownClient}
                onValueChange={handleClientSelect}
              >
                <SelectTrigger className={errors.clientName ? 'border-destructive' : ''}>
                  <SelectValue placeholder={clients.length === 0 ? "No clients available" : "Select or type client name"} />
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
                id="clientNameInput"
                value={formData.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                placeholder="Or type new client name"
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-label">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="e.g., ABC Corp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-label">
                  Contact Phone
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  placeholder="e.g., 9876543210"
                />
              </div>
            </div>

          </section>

          <div className="border-t border-border" />

          {/* Section: Event Dates */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Event Dates *</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryFromDate" className="text-label">
                  Delivery From <span className="text-primary">*</span>
                </Label>
                <Input
                  id="deliveryFromDate"
                  type="date"
                  value={formData.deliveryFromDate}
                  onChange={(e) => handleChange('deliveryFromDate', e.target.value)}
                  className={errors.deliveryFromDate ? 'border-destructive' : ''}
                />
                {errors.deliveryFromDate && <p className="text-destructive text-sm">{errors.deliveryFromDate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryToDate" className="text-label">
                  Delivery To <span className="text-primary">*</span>
                </Label>
                <Input
                  id="deliveryToDate"
                  type="date"
                  value={formData.deliveryToDate}
                  onChange={(e) => handleChange('deliveryToDate', e.target.value)}
                  className={errors.deliveryToDate ? 'border-destructive' : ''}
                />
                {errors.deliveryToDate && <p className="text-destructive text-sm">{errors.deliveryToDate}</p>}
              </div>
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Section 3: Venue Details */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Venue Details</h2>

            <div className="space-y-2">
              <Label htmlFor="venue" className="text-label">
                Venue <span className="text-primary">*</span>
              </Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => handleChange('venue', e.target.value)}
                placeholder="e.g., The Grand Banquet Hall"
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
                placeholder="Full address (optional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-label">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="e.g., Mumbai"
              />
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Section: Contractors */}
          <section className="space-y-4">
            <EventContractorForm
              entries={formData.contractorEntries}
              contractors={contractors}
              isLoadingContractors={isLoadingContractors}
              fromDate={formData.eventFromDate}
              toDate={formData.eventEndDate}
              onFromDateChange={(value) => handleChange('eventFromDate', value)}
              onToDateChange={(value) => handleChange('eventEndDate', value)}
              onAdd={addContractorEntry}
              onRemove={removeContractorEntry}
              onUpdate={updateContractorEntry}
            />
          </section>

          <div className="border-t border-border" />

          {/* Section: Staff Details */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Staff Details (Optional)</h2>

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
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="ghost" onClick={() => router.push('/events')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Event
          </Button>
        </div>
      </form>
    </div>
  )
}
