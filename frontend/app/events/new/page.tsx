'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useAuth, canCreateEvent } from '@/lib/auth-context'
import { eventsApi, usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { User, Client } from '@/lib/types'




export default function NewEventPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [staffList, setStaffList] = useState<User[]>([])

  const [formData, setFormData] = useState({
    clientName: '',
    companyName: '',
    contactPhone: '',
    eventDate: '',
    venue: '',
    venueAddress: '',
    city: '',
    headKarigarName: 'unassigned',
    managerName: 'unassigned',
    deliveryFromDate: '',
    deliveryToDate: '',
  })
  const [clients, setClients] = useState<Client[]>([])
  const [selectedDropdownClient, setSelectedDropdownClient] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data } = await usersApi.getUsers(1, 100)
        setStaffList(data.filter(u => u.role === 'karigar' || u.role === 'manager'))
      } catch (err) {
        console.error('Failed to fetch staff:', err)
      }
    }
    const fetchClients = async () => {
      try {
        const data = await eventsApi.getClients()
        setClients(data)
      } catch (err) {
        console.error('Failed to fetch clients:', err)
        setClients([])
      }
    }
    fetchStaff()
    fetchClients()
  }, [])

  if (!user || !canCreateEvent(user.role)) {
    router.replace('/events')
    return null
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleClientSelect = (clientName: string) => {
    setSelectedDropdownClient(clientName)
    const selectedClient = clients.find(c => c.client_name === clientName)
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        clientName: selectedClient.client_name,
        companyName: selectedClient.company_name || '',
        contactPhone: selectedClient.contact_phone || '',
      }))
    }
    if (errors.clientName) {
      setErrors(prev => ({ ...prev, clientName: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.clientName.trim()) newErrors.clientName = 'Client name is required'
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required'
    if (!formData.venue.trim()) newErrors.venue = 'Venue is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await eventsApi.createEvent({
        clientName: formData.clientName,
        companyName: formData.companyName || undefined,
        contactPhone: formData.contactPhone || undefined,
        eventDate: formData.eventDate,
        venue: formData.venue,
        venueAddress: formData.venueAddress || undefined,
        city: formData.city || undefined,
        headKarigarName: formData.headKarigarName === 'unassigned' ? undefined : formData.headKarigarName,
        managerName: formData.managerName === 'unassigned' ? undefined : formData.managerName,
        deliveryFromDate: formData.deliveryFromDate || undefined,
        deliveryToDate: formData.deliveryToDate || undefined,
      })
      toast.success('Event created successfully')
      router.push('/events')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create event')
    } finally {
      setIsLoading(false)
    }
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
        <div className="bg-card rounded-xl border border-border p-6 space-y-8">
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

          {/* Section 2: Event Date */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Event Date</h2>

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
                <Label htmlFor="deliveryFromDate" className="text-label">
                  Delivery From
                </Label>
                <Input
                  id="deliveryFromDate"
                  type="date"
                  value={formData.deliveryFromDate}
                  onChange={(e) => handleChange('deliveryFromDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryToDate" className="text-label">
                  Delivery To
                </Label>
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

          {/* Section 4: Staff Details */}
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
                    {staffList.filter(s => s.role === 'karigar').map(s => (
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
                    {staffList.filter(s => s.role === 'manager').map(s => (
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
