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
import { OCCASION_TYPES, type User } from '@/lib/types'

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [staffList, setStaffList] = useState<User[]>([])
  const [formData, setFormData] = useState({
    name: '',
    occasionType: '',
    eventDate: '',
    venueName: '',
    venueAddress: '',
    contactName: '',
    contactPhone: '',
    notes: '',
    assignedTo: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loadEvent = useCallback(async () => {
    try {
      const data = await eventsApi.getEventById(id)
      setFormData({
        name: data.name,
        occasionType: data.occasionType,
        eventDate: data.eventDate ? data.eventDate.split('T')[0] : '',
        venueName: data.venueName,
        venueAddress: data.venueAddress || '',
        contactName: data.contactName || '',
        contactPhone: data.contactPhone || '',
        notes: data.notes || '',
        assignedTo: data.assignedTo || 'unassigned',
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
        setStaffList(data.filter(u => u.role === 'staff' || u.role === 'staff_member'))
      } catch (err) {
        console.error('Failed to fetch staff:', err)
      }
    }
    fetchStaff()
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
    if (!formData.name.trim()) newErrors.name = 'Event name is required'
    if (!formData.occasionType) newErrors.occasionType = 'Occasion type is required'
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required'
    if (!formData.venueName.trim()) newErrors.venueName = 'Venue name is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSaving(true)
    try {
      await eventsApi.updateEvent(id, {
        name: formData.name,
        occasionType: formData.occasionType,
        eventDate: formData.eventDate,
        venueName: formData.venueName,
        venueAddress: formData.venueAddress,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        notes: formData.notes,
        assigned_to: formData.assignedTo === 'unassigned' ? null : formData.assignedTo,
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
          { label: formData.name || 'Edit Event', href: `/events/${id}` },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto pb-10">
        <div className="bg-card rounded-xl border border-border p-6 space-y-8">
          {/* Section 1: Event Identity */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Event Identity</h2>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-label">
                Event Name <span className="text-primary">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="occasionType" className="text-label">
                Occasion Type <span className="text-primary">*</span>
              </Label>
              <Select value={formData.occasionType} onValueChange={(v) => handleChange('occasionType', v)}>
                <SelectTrigger className={errors.occasionType ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select occasion type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(OCCASION_TYPES).map(o => (
                    <SelectItem key={o} value={o} className="capitalize">
                      {o.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.occasionType && <p className="text-destructive text-sm">{errors.occasionType}</p>}
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
                className={errors.eventDate ? 'border-destructive' : ''}
              />
              {errors.eventDate && <p className="text-destructive text-sm">{errors.eventDate}</p>}
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Section 2: Staff Assignment */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Staff Assignment</h2>
            <div className="space-y-2">
              <Label htmlFor="assignedTo" className="text-label">
                Assigned Staff Member
              </Label>
              <Select value={formData.assignedTo} onValueChange={(v) => handleChange('assignedTo', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staffList.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground italic">
                The assigned staff member will be responsible for coordinating this event.
              </p>
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Section 3: Venue */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Venue</h2>
            
            <div className="space-y-2">
              <Label htmlFor="venueName" className="text-label">
                Venue Name <span className="text-primary">*</span>
              </Label>
              <Input
                id="venueName"
                value={formData.venueName}
                onChange={(e) => handleChange('venueName', e.target.value)}
                className={errors.venueName ? 'border-destructive' : ''}
              />
              {errors.venueName && <p className="text-destructive text-sm">{errors.venueName}</p>}
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
          </section>

          <div className="border-t border-border" />

          {/* Section 4: Contact */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Contact (Optional)</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName" className="text-label">Contact Person Name</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => handleChange('contactName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-label">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Section 5: Notes */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Notes</h2>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-label">Notes / Remarks</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
              />
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="ghost" onClick={() => router.push(`/events/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
