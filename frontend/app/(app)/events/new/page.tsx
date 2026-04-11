'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useAuth, canCreateEvent } from '@/lib/auth-context'
import { events } from '@/lib/mock-data'
import { eventsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { OccasionType } from '@/lib/types'

const occasions: { value: OccasionType; label: string }[] = [
  { value: 'haldi', label: 'Haldi' },
  { value: 'bhaat', label: 'Bhaat' },
  { value: 'mehandi', label: 'Mehandi' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'reception', label: 'Reception' },
  { value: 'cocktail', label: 'Cocktail' },
  { value: 'after_party', label: 'After Party' },
  { value: 'other', label: 'Other' },
]



export default function NewEventPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    occasionType: '' as OccasionType | '',
    eventDate: '',
    venueName: '',
    venueAddress: '',
    contactName: '',
    contactPhone: '',
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check for venue/date conflict
  const conflictEvent = useMemo(() => {
    if (!formData.venueName || !formData.eventDate) return null
    return events.find(
      e => e.venueName.toLowerCase() === formData.venueName.toLowerCase() && 
           e.eventDate === formData.eventDate &&
           e.status === 'Live'
    )
  }, [formData.venueName, formData.eventDate])

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

    setIsLoading(true)
    try {
      await eventsApi.createEvent({
        name: formData.name,
        occasionType: formData.occasionType as OccasionType,
        eventDate: formData.eventDate,
        venueName: formData.venueName,
        venueAddress: formData.venueAddress,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        notes: formData.notes,
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
                placeholder="e.g., Sharma Wedding"
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
                  {occasions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
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

          {/* Section 2: Venue */}
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
                placeholder="e.g., The Grand Banquet Hall"
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
                placeholder="Full address (optional)"
                rows={3}
              />
            </div>

            {conflictEvent && (
              <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Another event is already scheduled at this venue on this date:</p>
                  <p className="text-muted-foreground mt-1">&quot;{conflictEvent.name}&quot;. You can still create this event.</p>
                </div>
              </div>
            )}
          </section>

          <div className="border-t border-border" />

          {/* Section 3: Contact */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Contact (Optional)</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName" className="text-label">Contact Person Name</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => handleChange('contactName', e.target.value)}
                  placeholder="e.g., Rahul Sharma"
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
          </section>

          <div className="border-t border-border" />

          {/* Section 4: Notes */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Notes</h2>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-label">Notes / Remarks</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any special instructions, setup notes..."
                rows={4}
              />
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
