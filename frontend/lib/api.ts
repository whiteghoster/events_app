import type { Event, EventProduct, PaginatedResponse } from './types'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`

    try {
      const errorData = await response.json()
      errorMessage = errorData?.message || errorData?.error || errorMessage
    } catch { }

    throw new Error(errorMessage)
  }

  return response.json()
}

function normalizeStatus(status: string) {
  if (!status) return 'Live'
  const s = String(status).toLowerCase()

  if (s === 'live') return 'Live'
  if (s === 'hold') return 'Hold'
  if (s === 'finished') return 'Finished'

  return status
}

function mapEventFromBackend(event: any): Event {
  return {
    id: event.id,
    name: event.name,
    occasionType: event.occasion_type || 'Other',
    eventDate: event.date || '',
    venueName: event.venue_name || '',
    venueAddress: event.venue_address || '',
    contactName: event.contact_person || '',
    contactPhone: event.contact_phone || '',
    notes: event.notes || '',
    status: normalizeStatus(event.status) as Event['status'],
    closedAt: event.closed_at || null,
    closedBy: event.closed_by || null,
    createdAt: event.created_at || null,
    updatedAt: event.updated_at || null,
  }
}

function mapEventProductFromBackend(row: any): EventProduct {
  const product = row.product || {}
  const category = product.category || {}
  return {
    id: row.id,
    eventId: row.event_id,
    productId: row.product_id,
    productName: product.name || '',
    categoryId: category.id || '',
    categoryName: category.name || '',
    quantity: row.quantity,
    unit: row.unit,
    price: row.price,
  }
}

export const eventsApi = {
  async getEvents(params?: { tab?: string; occasionType?: string }): Promise<Event[]> {
    const query = new URLSearchParams()
    if (params?.tab) query.set('tab', params.tab)
    if (params?.occasionType) query.set('occasionType', params.occasionType)
    const qs = query.toString() ? `?${query.toString()}` : ''

    const response = await apiRequest<{ success: boolean; data: any[] }>(`/events${qs}`)
    const data = response?.data ?? (Array.isArray(response) ? response : [])
    return data.map(mapEventFromBackend)
  },

  async getEventById(id: string): Promise<Event> {
    const response = await apiRequest<{ success: boolean; data: any }>(`/events/${id}`)
    return mapEventFromBackend(response?.data ?? response)
  },

  async createEvent(payload: {
    name: string
    occasion_type?: string
    date?: string
    venue_name?: string
    venue_address?: string
    contact_person?: string
    contact_phone?: string
    notes?: string
  }): Promise<Event> {
    const response = await apiRequest<{ success: boolean; data: any }>('/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return mapEventFromBackend(response?.data ?? response)
  },

  async updateEvent(
    id: string,
    payload: {
      name?: string
      occasion_type?: string
      date?: string
      venue_name?: string
      venue_address?: string
      contact_person?: string
      contact_phone?: string
      notes?: string
    },
  ): Promise<Event> {
    const response = await apiRequest<{ success: boolean; data: any }>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    return mapEventFromBackend(response?.data ?? response)
  },

  async closeEvent(id: string, status: 'Hold' | 'Finished'): Promise<Event> {
    const response = await apiRequest<{ success: boolean; data: any }>(`/events/${id}/close`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
    return mapEventFromBackend(response?.data ?? response)
  },
}

export const eventProductsApi = {
  async getEventProducts(
    eventId: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResponse<EventProduct>> {
    const response = await apiRequest<{
      success: boolean
      data: any[]
      total: number
      page: number
      pageSize: number
    }>(`/events/${eventId}/products?page=${page}&pageSize=${pageSize}`)

    return {
      data: (response?.data ?? []).map(mapEventProductFromBackend),
      total: response?.total ?? 0,
      page: response?.page ?? page,
      pageSize: response?.pageSize ?? pageSize,
    }
  },

  async createEventProduct(
    eventId: string,
    payload: {
      product_id: string
      quantity: number
      unit: string
      price?: number
    },
  ): Promise<EventProduct> {
    const response = await apiRequest<{ success: boolean; data: any }>(
      `/events/${eventId}/products`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )
    return mapEventProductFromBackend(response?.data ?? response)
  },

  async updateEventProduct(
    eventId: string,
    rowId: string,
    payload: { quantity?: number; unit?: string; price?: number },
  ): Promise<EventProduct> {
    const response = await apiRequest<{ success: boolean; data: any }>(
      `/events/${eventId}/products/${rowId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    )
    return mapEventProductFromBackend(response?.data ?? response)
  },

  async deleteEventProduct(eventId: string, rowId: string): Promise<void> {
    await apiRequest<{ success: boolean }>(`/events/${eventId}/products/${rowId}`, {
      method: 'DELETE',
    })
  },
}