'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useAuth, canEditEvent } from '@/lib/auth-context'
import { eventsApi, usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { OCCASION_TYPES, type User, type Client } from '@/lib/types'

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [staffList, setStaffList] = useState<User[]>([])
  const [formData, setFormData] = useState({
    clientName: '',
    companyName: '',
    contactPhone: '',
    eventDate: '',
    venue: '',
    venueAddress: '',
    city: '',
    headKarigarName: '',
    managerName: '',
    deliveryFromDate: '',
    deliveryToDate: '',
  })
  const [clients, setClients] = useState<Client[]>([])
  const [selectedDropdownClient, setSelectedDropdownClient] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loadEvent = useCallback(async () => {
    try {
      const data = await eventsApi.getEventById(id)
      
      // Prevent editing finished events
      if (data.status === 'finished') {
        toast.error('Finished events cannot be edited')
        router.push(`/events/${id}`)
        return
      }
      
      setFormData({
        clientName: data.clientName,
        companyName: data.companyName || '',
        contactPhone: data.contactPhone || '',
        eventDate: data.eventDate ? data.eventDate.split('T')[0] : '',
        venue: data.venue,
        venueAddress: data.venueAddress || '',
        city: data.city || '',
        headKarigarName: data.headKarigarName || 'unassigned',
        managerName: data.managerName || 'unassigned',
        deliveryFromDate: data.deliveryFromDate ? data.deliveryFromDate.split('T')[0] : '',
        deliveryToDate: data.deliveryToDate ? data.deliveryToDate.split('T')[0] : '',
      })
    } catch (err) {
      toast.error('Failed to load event details')
      router.push('/events')
    } finally {
      setIsPageLoading(false)
    }
  }, [id, router])

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

  useEffect(() => {
    if (user && !canEditEvent(user.role)) {
      router.replace('/events')
      return
    }
    loadEvent()
  }, [user, loadEvent, router])

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
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

    setIsSaving(true)
    try {
      await eventsApi.updateEvent(id, {
        clientName: formData.clientName,
        companyName: formData.companyName,
        contactPhone: formData.contactPhone,
        eventDate: formData.eventDate,
        venue: formData.venue,
        venueAddress: formData.venueAddress,
        city: formData.city,
        headKarigarName: formData.headKarigarName === 'unassigned' ? '' : formData.headKarigarName,
        managerName: formData.managerName === 'unassigned' ? '' : formData.managerName,
        deliveryFromDate: formData.deliveryFromDate || undefined,
        deliveryToDate: formData.deliveryToDate || undefined,
      })
      toast.success('Event updated successfully')
      router.push(`/events/${id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update event')
    } finally {
      setIsSaving(false)
    }
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
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Section 1: Event Identity */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Event Identity</h2>
            
            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-label">
                Client Name <span className="text-primary">*</span>
              </Label>
              <Select
                value={selectedDropdownClient}
                onValueChange={(value) => {
                  setSelectedDropdownClient(value)
                  const selectedClient = clients.find(c => c.client_name === value)
                  if (selectedClient) {
                    setFormData(prev => ({
                      ...prev,
                      clientName: selectedClient.client_name,
                      companyName: selectedClient.company_name || '',
                      contactPhone: selectedClient.contact_phone || '',
                    }))
                  }
                }}
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

          <div className="border-t border-border" />

        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <Button type="button" variant="ghost" onClick={() => router.push(`/events/${id}`)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
