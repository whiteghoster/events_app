import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { eventsApi, usersApi } from '@/lib/api'
import type { EventFormData } from '@/lib/types'

const DEFAULT_FORM_DATA: EventFormData = {
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
  eventFromDate: '',
  eventEndDate: '',
  notes: '',
}

export function useEventForm(eventId?: string) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(!!eventId)
  const [selectedDropdownClient, setSelectedDropdownClient] = useState('')
  const [formData, setFormData] = useState<EventFormData>(DEFAULT_FORM_DATA)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: () => usersApi.getUsers(1, 100),
    staleTime: 1000 * 60 * 5,
  })
  const staffList = staffData?.data || []

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => eventsApi.getClients(),
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (!eventId) return
    const loadEvent = async () => {
      try {
        const data = await eventsApi.getEventById(eventId)
        if (data.status === 'finished') {
          toast.error('Finished events cannot be edited')
          router.push(`/events/${eventId}`)
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
          eventFromDate: data.eventFromDate ? data.eventFromDate.split('T')[0] : '',
          eventEndDate: data.eventEndDate ? data.eventEndDate.split('T')[0] : '',
          notes: data.notes || '',
        })
      } catch (err: any) {
        console.error('Failed to load event:', err)
        toast.error(err?.message || 'Failed to load event details')
        router.push('/events')
      } finally {
        setIsPageLoading(false)
      }
    }
    loadEvent()
  }, [eventId, router])

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
    if (!formData.deliveryFromDate) newErrors.deliveryFromDate = 'Delivery start date is required'
    if (!formData.deliveryToDate) newErrors.deliveryToDate = 'Delivery end date is required'
    if (!formData.venue.trim()) newErrors.venue = 'Venue is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const payload = {
        clientName: formData.clientName,
        companyName: formData.companyName || undefined,
        contactPhone: formData.contactPhone || undefined,
        eventDate: formData.deliveryFromDate,
        venue: formData.venue,
        venueAddress: formData.venueAddress || undefined,
        city: formData.city || undefined,
        headKarigarName: formData.headKarigarName === 'unassigned' ? undefined : formData.headKarigarName,
        managerName: formData.managerName === 'unassigned' ? undefined : formData.managerName,
        deliveryFromDate: formData.deliveryFromDate,
        deliveryToDate: formData.deliveryToDate,
        eventFromDate: formData.eventFromDate || undefined,
        eventEndDate: formData.eventEndDate || undefined,
        notes: formData.notes || undefined,
      }

      if (eventId) {
        await eventsApi.updateEvent(eventId, {
          ...payload,
          headKarigarName: formData.headKarigarName === 'unassigned' ? '' : formData.headKarigarName,
          managerName: formData.managerName === 'unassigned' ? '' : formData.managerName,
        })
        toast.success('Event updated successfully')
        await queryClient.invalidateQueries({ queryKey: ['event', eventId], exact: true })
        await queryClient.invalidateQueries({ queryKey: ['events', 'list'], exact: false })
        router.push(`/events/${eventId}`)
      } else {
        const newEvent = await eventsApi.createEvent(payload)
        toast.success('Event created successfully')
        queryClient.setQueriesData({ queryKey: ['events', 'list'], exact: false }, (oldData: any) => {
          if (!oldData?.pages?.[0]) return oldData
          const newEventWithStatus = { ...newEvent, status: 'live' }
          return {
            ...oldData,
            pages: [
              {
                ...oldData.pages[0],
                events: [newEventWithStatus, ...oldData.pages[0].events],
              },
              ...oldData.pages.slice(1),
            ],
          }
        })
        queryClient.invalidateQueries({ queryKey: ['events', 'list'], exact: false })
        router.push('/events')
      }
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${eventId ? 'update' : 'create'} event`)
    } finally {
      setIsLoading(false)
    }
  }

  const karigars = staffList.filter(s => s.role === 'karigar')
  const managers = staffList.filter(s => s.role === 'manager')

  return {
    formData,
    errors,
    isLoading,
    isPageLoading,
    clients,
    selectedDropdownClient,
    karigars,
    managers,
    handleChange,
    handleClientSelect,
    handleSubmit,
  }
}
