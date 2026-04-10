import type { EventStatus } from './types'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

// -------------------------------------------------------------------
// Core request helper
// The backend wraps all responses as { success: boolean, data: T }
// -------------------------------------------------------------------
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

  const json = await response.json()

  // Unwrap { success, data } envelope if present
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T
  }

  return json as T
}

// -------------------------------------------------------------------
// Status / field normalisers
// -------------------------------------------------------------------
function normalizeStatus(status: string): EventStatus {
  if (!status) return 'Live'
  const s = String(status).toLowerCase()
  if (s === 'live') return 'Live'
  if (s === 'hold') return 'Hold'
  if (s === 'finished') return 'Finished'
  return 'Live'
}

function mapEventFromBackend(event: any) {
  return {
    id: event.id,
    name: event.name,
    occasionType: event.occasion_type || event.occasionType || 'Other',
    eventDate: event.date || event.eventDate || '',
    venueName: event.venue_name || event.venueName || '',
    venueAddress: event.venue_address || event.venueAddress || '',
    contactName: event.contact_person || event.contactName || '',
    contactPhone: event.contact_phone || event.contactPhone || '',
    notes: event.notes || '',
    status: normalizeStatus(event.status),
    closedAt: event.closed_at || event.closedAt || null,
    closedBy: event.closed_by || event.closedBy || null,
    createdAt: event.created_at || event.createdAt || null,
    updatedAt: event.updated_at || event.updatedAt || null,
  }
}

// -------------------------------------------------------------------
// Core request helper - full response variant (for paginated endpoints)
// -------------------------------------------------------------------
async function apiRequestFull<T>(
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

  return response.json() as Promise<T>
}

// -------------------------------------------------------------------
// Catalog API
// -------------------------------------------------------------------
export const catalogApi = {
  async getCategories() {
    try {
      return await apiRequest<any[]>('/catalog/categories')
    } catch (error) {
      console.error('catalogApi.getCategories failed:', error)
      return []
    }
  },

  async getProducts(page?: number, limit?: number) {
    try {
      const params = new URLSearchParams()
      if (page !== undefined) params.set('page', String(page))
      if (limit !== undefined) params.set('limit', String(limit))
      const query = params.toString() ? `?${params.toString()}` : ''

      if (page !== undefined && limit !== undefined) {
        const json = await apiRequestFull<{ success: boolean; data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
          `/catalog/products${query}`
        )
        return { data: json.data ?? [], meta: json.meta }
      }

      const data = await apiRequest<any[]>(`/catalog/products${query}`)
      return { data: Array.isArray(data) ? data : [] }
    } catch (error) {
      console.error('catalogApi.getProducts failed:', error)
      return { data: [] }
    }
  },

  async getProductsByCategory(categoryId: string) {
    try {
      return await apiRequest<any[]>(`/catalog/products/category/${categoryId}`)
    } catch (error) {
      console.error('catalogApi.getProductsByCategory failed:', error)
      return []
    }
  },
}

// -------------------------------------------------------------------
// Auth API  –  POST /auth/login, POST /auth/logout, POST /auth/refresh
// -------------------------------------------------------------------
export const authApi = {
  async login(email: string, password: string) {
    const data = await apiRequest<{ access_token: string; refresh_token: string; expires_at: number; user: { id: string; email: string; role: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    )
    return data
  },

  async refresh(refreshToken: string) {
    const data = await apiRequest<{ access_token: string; refresh_token: string; expires_at: number; user: { id: string; email: string } | null }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
    )
    return data
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch {
      // always clear token even if API call fails
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
  },
}

// -------------------------------------------------------------------
// Events API  –  GET /events  |  POST /events
// -------------------------------------------------------------------
export const eventsApi = {
  /** Fetches real events from the backend */
  async getEvents(tab?: string, occasionType?: string) {
    try {
      const params = new URLSearchParams()
      if (tab) params.set('tab', tab)
      if (occasionType) params.set('occasionType', occasionType)
      const query = params.toString() ? `?${params.toString()}` : ''

      const data = await apiRequest<any[]>(`/events${query}`)
      return Array.isArray(data) ? data.map(mapEventFromBackend) : []
    } catch (error) {
      console.error('eventsApi.getEvents failed:', error)
      return []
    }
  },

  /** Creates a new event via the backend */
  async createEvent(payload: {
    name: string
    occasionType?: string
    eventDate?: string
    venueName?: string
    venueAddress?: string
    contactName?: string
    contactPhone?: string
    notes?: string
  }) {
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

  /** Fetch single event by id */
  async getEventById(id: string) {
    const data = await apiRequest<any>(`/events/${id}`)
    return mapEventFromBackend(data)
  },
}