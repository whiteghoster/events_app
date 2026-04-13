import type { Event, EventProduct, EventStatus, Category, Product, OccasionType } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

// -------------------------------------------------------------------
// Token refresh helper (mirrors auth-context logic, for use outside React)
// -------------------------------------------------------------------
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken =
    typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
  if (!refreshToken) return null

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return null

    const json = await res.json()
    const data = json.data ?? json
    if (!data?.access_token) return null

    localStorage.setItem('access_token', data.access_token)
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
    if (data.expires_at) localStorage.setItem('expires_at', String(data.expires_at))

    return data.access_token
  } catch {
    return null
  }
}

// -------------------------------------------------------------------
// Core request helper — auto-refreshes on 401 and retries once
// -------------------------------------------------------------------
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  _retry = true,
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

  // On 401: try to refresh the token once, then retry the original request
  if (response.status === 401 && _retry) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return apiRequest<T>(endpoint, options, false) // retry with fresh token
    }
    // Refresh failed — clear session and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('expires_at')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
    }
    throw new Error('Session expired. Please log in again.')
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData?.message || errorData?.error || errorMessage
    } catch {
      // Response is not JSON
    }
    throw new Error(errorMessage)
  }

  try {
    const json = await response.json()

    // Handle paginated responses
    if (json && typeof json === 'object' && 'data' in json && 'total' in json) {
      return json as T
    }

    // Handle simple success wrapper
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as T
    }

    return json as T
  } catch (error) {
    throw new Error('Failed to parse response')
  }
}

// -------------------------------------------------------------------
// Status / field normalizers
// -------------------------------------------------------------------
function normalizeStatus(status: string): EventStatus {
  if (!status) return 'live'
  const s = String(status).toLowerCase()
  if (s === 'live' || s === 'hold' || s === 'finished') {
    return s as EventStatus
  }
  return 'live'
}


function mapEventFromBackend(event: any): Event {
  return {
    id: event.id,
    name: event.name,
    occasionType: (event.occasion_type || event.occasionType || 'other') as OccasionType,

    eventDate: event.date || event.eventDate || '',
    venueName: event.venue_name || event.venueName || '',
    venueAddress: event.venue_address || event.venueAddress || '',
    contactName: event.contact_person || event.contactName || '',
    contactPhone: event.contact_phone || event.contactPhone || '',
    notes: event.notes || '',
    status: normalizeStatus(event.status),
    closedAt: event.closed_at || event.closedAt || null,
    closedBy: event.closed_by || event.closedBy || null,
    createdAt: event.created_at || event.createdAt || undefined,
    updatedAt: event.updated_at || event.updatedAt || null,
  }
}

// -------------------------------------------------------------------
// Auth API
// -------------------------------------------------------------------
export const authApi = {
  async login(email: string, password: string) {
    return await apiRequest<{
      access_token: string
      refresh_token: string
      user: { id: string; email: string; role: string }
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch {
      // Always clear token even if API call fails
    }
  },

  async refreshToken(refreshToken: string) {
    return await apiRequest<{
      access_token: string
      refresh_token: string
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  },
}

// -------------------------------------------------------------------
// Catalog API
// -------------------------------------------------------------------
export const catalogApi = {
  async getCategories(): Promise<Category[]> {
    return await apiRequest<any[]>('/catalog/categories')
  },

  async getProducts(params?: { categoryId?: string; page?: number; pageSize?: number }): Promise<{
    data: Product[]
    total: number
  }> {
    const q = new URLSearchParams()
    if (params?.categoryId) q.set('categoryId', params.categoryId)
    if (params?.page) q.set('page', params.page.toString())
    if (params?.pageSize) q.set('pageSize', params.pageSize.toString())

    return await apiRequest<{
      data: Product[]
      total: number
    }>(`/catalog/products?${q.toString()}`)
  },
}


// -------------------------------------------------------------------
// Events API
// -------------------------------------------------------------------
export const eventsApi = {
  async getEvents(tab?: string, occasionType?: string, page: number = 1, pageSize: number = 20): Promise<{
    events: Event[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  }> {
    try {
      const params = new URLSearchParams()
      if (tab) params.set('tab', tab)
      if (occasionType) params.set('occasionType', occasionType)
      params.set('page', page.toString())
      params.set('pageSize', pageSize.toString())
      const query = `?${params.toString()}`

      const response = await apiRequest<{
        data: any[]
        total: number
        page: number
        pageSize: number
        totalPages: number
      }>(`/events${query}`)

      return {
        events: (response?.data || []).map(mapEventFromBackend),
        pagination: {
          page: response?.page || 1,
          pageSize: response?.pageSize || 20,
          total: response?.total || 0,
          totalPages: response?.totalPages || 0,
        },
      }
    } catch (error) {
      console.error('eventsApi.getEvents failed:', error)
      return {
        events: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      }
    }
  },

  async createEvent(payload: {
    name: string
    occasionType?: string
    eventDate?: string
    venueName?: string
    venueAddress?: string
    contactName?: string
    contactPhone?: string
    notes?: string
  }): Promise<Event> {
    const data = await apiRequest<any>('/events', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        occasion_type: payload.occasionType,
        date: payload.eventDate,
        venue_name: payload.venueName,
        venue_address: payload.venueAddress,
        contact_person: payload.contactName,
        contact_phone: payload.contactPhone,
        notes: payload.notes,
      }),
    })
    return mapEventFromBackend(data)
  },

  async updateEvent(id: string, payload: {
    name?: string
    occasionType?: string
    eventDate?: string
    venueName?: string
    venueAddress?: string
    contactName?: string
    contactPhone?: string
    notes?: string
  }): Promise<Event> {
    const data = await apiRequest<any>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: payload.name,
        occasion_type: payload.occasionType,
        date: payload.eventDate,
        venue_name: payload.venueName,
        venue_address: payload.venueAddress,
        contact_person: payload.contactName,
        contact_phone: payload.contactPhone,
        notes: payload.notes,
      }),
    })
    return mapEventFromBackend(data)
  },

  async getEventById(id: string): Promise<Event> {
    const data = await apiRequest<any>(`/events/${id}`)
    return mapEventFromBackend(data)
  },

  async getEventProducts(eventId: string): Promise<EventProduct[]> {
    const response = await apiRequest<{
      data: any[]
      total: number
    }>(`/events/${eventId}/products`)

    return (response?.data || []).map(item => ({
      id: item.id,
      eventId: item.event_id || eventId,
      productId: item.product_id,
      productName: item.product?.name || 'Unknown Product',
      categoryId: item.product?.category?.id || '',
      categoryName: item.product?.category?.name || 'Unknown Category',
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
    }))
  },

  async addEventProduct(eventId: string, payload: {
    productId: string
    quantity: number
    unit: string
    price?: number
  }): Promise<void> {
    await apiRequest(`/events/${eventId}/products`, {
      method: 'POST',
      body: JSON.stringify({
        product_id: payload.productId,
        quantity: payload.quantity,
        unit: payload.unit,
        price: payload.price,
      }),
    })
  },

  async updateEventProduct(eventId: string, rowId: string, payload: {
    product_id?: string
    quantity?: number
    unit?: string
    price?: number
  }): Promise<void> {
    await apiRequest(`/events/${eventId}/products/${rowId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  async deleteEventProduct(eventId: string, rowId: string): Promise<void> {
    await apiRequest(`/events/${eventId}/products/${rowId}`, {
      method: 'DELETE',
    })
  },


  async closeEvent(id: string, status: string): Promise<void> {
    await apiRequest(`/events/${id}/close`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}