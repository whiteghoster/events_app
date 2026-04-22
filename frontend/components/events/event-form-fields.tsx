'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface Client {
  client_name: string
  company_name?: string
}

interface StaffMember {
  id: string
  name: string
}

interface FormData {
  clientName: string
  companyName: string
  contactPhone: string
  eventDate: string
  deliveryFromDate: string
  deliveryToDate: string
  venue: string
  venueAddress: string
  city: string
  headKarigarName: string
  managerName: string
}

interface FormErrors {
  clientName?: string
  deliveryFromDate?: string
  deliveryToDate?: string
  venue?: string
}

interface EventFormFieldsProps {
  formData: FormData
  errors: FormErrors
  clients: Client[]
  selectedDropdownClient: string
  karigars: StaffMember[]
  managers: StaffMember[]
  handleChange: (field: string, value: string) => void
  handleClientSelect: (value: string) => void
  variant: 'new' | 'edit'
}

export function EventFormFields({
  formData,
  errors,
  clients,
  selectedDropdownClient,
  karigars,
  managers,
  handleChange,
  handleClientSelect,
  variant,
}: EventFormFieldsProps) {
  const isNew = variant === 'new'

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Client Details</h2>

        <div className="space-y-2">
          <Label>Client Name *</Label>
          <Select value={selectedDropdownClient} onValueChange={handleClientSelect}>
            <SelectTrigger className={errors.clientName ? 'border-destructive' : ''}>
              <SelectValue placeholder={isNew && clients.length === 0 ? 'No clients available' : 'Select client'} />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.client_name} value={client.client_name}>
                  {client.client_name} {client.company_name ? `(${client.company_name})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.clientName && <p className="text-destructive text-sm">{errors.clientName}</p>}
          <Input
            value={formData.clientName}
            onChange={(e) => handleChange('clientName', e.target.value)}
            placeholder="Or type new client name"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder={isNew ? 'e.g., ABC Corp' : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label>Contact Phone</Label>
            <Input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              placeholder="e.g., 9876543210"
            />
          </div>
        </div>

      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Event Dates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Delivery From *</Label>
            <Input
              type="date"
              value={formData.deliveryFromDate}
              onChange={(e) => handleChange('deliveryFromDate', e.target.value)}
              className={errors.deliveryFromDate ? 'border-destructive' : ''}
            />
            {errors.deliveryFromDate && <p className="text-destructive text-sm">{errors.deliveryFromDate}</p>}
          </div>
          <div className="space-y-2">
            <Label>Delivery To *</Label>
            <Input
              type="date"
              value={formData.deliveryToDate}
              onChange={(e) => handleChange('deliveryToDate', e.target.value)}
              className={errors.deliveryToDate ? 'border-destructive' : ''}
            />
            {errors.deliveryToDate && <p className="text-destructive text-sm">{errors.deliveryToDate}</p>}
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          {isNew ? 'Venue Details' : 'Venue'}
        </h2>
        <div className="space-y-2">
          <Label>Venue *</Label>
          <Input
            value={formData.venue}
            onChange={(e) => handleChange('venue', e.target.value)}
            placeholder={isNew ? 'e.g., The Grand Banquet Hall' : undefined}
            className={errors.venue ? 'border-destructive' : ''}
          />
          {errors.venue && <p className="text-destructive text-sm">{errors.venue}</p>}
        </div>
        <div className="space-y-2">
          <Label>Venue Address</Label>
          <Textarea
            value={formData.venueAddress}
            onChange={(e) => handleChange('venueAddress', e.target.value)}
            placeholder={isNew ? 'Full address (optional)' : undefined}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Input
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder={isNew ? 'e.g., Mumbai' : undefined}
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          {isNew ? 'Staff Details (Optional)' : 'Staff Assignment'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Head Karigar</Label>
            <Select value={formData.headKarigarName} onValueChange={(v) => handleChange('headKarigarName', v)}>
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
            <Label>Manager</Label>
            <Select value={formData.managerName} onValueChange={(v) => handleChange('managerName', v)}>
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
    </>
  )
}
