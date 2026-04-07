'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useAuth, canEditEvent } from '@/lib/auth-context'
import { events } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { OccasionType } from '@/lib/types'

const occasions: OccasionType[] = ['Wedding', 'Birthday', 'Pooja', 'Corporate', 'Festival', 'Other']

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const event = events.find(e => e.id === id)
  
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: event?.name || '',
    occasionType: event?.occasionType || '' as OccasionType | '',
    eventDate: event?.eventDate || '',
    venueName: event?.venueName || '',
    venueAddress: event?.venueAddress || '',
    contactName: event?.contactName || '',
    contactPhone: event?.contactPhone || '',
    notes: event?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!event || !user || !canEditEvent(user.role)) {
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
    await new Promise(resolve => setTimeout(resolve, 800))
    
    toast.success('Event updated successfully')
    router.push(`/events/${id}`)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        title="Edit Event"
        breadcrumbs={[
          { label: 'Events', href: '/events' },
          { label: event.name, href: `/events/${id}` },
          { label: 'Edit' },
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
                    <SelectItem key={o} value={o}>{o}</SelectItem>
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

          {/* Section 4: Notes */}
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
          <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
