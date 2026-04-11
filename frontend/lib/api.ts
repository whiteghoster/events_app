const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002' // ✅ Updated default


// -------------------------------------------------------------------
// Core request helper
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
function normalizeStatus(status: string) {
  if (!status) return 'Live'
  const s = String(status).toLowerCase()
  if (s === 'live') return 'Live'
  if (s === 'hold') return 'Hold'
  if (s === 'finished') return 'Finished'
  return status
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
// Auth API
// -------------------------------------------------------------------
export const authApi = {
  async login(email: string, password: string) {
    const response = await apiRequest<{
      access_token: string
      refresh_token: string
      user: { id: string; email: string; role: string }
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return response
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
// Events API
// -------------------------------------------------------------------
export const eventsApi = {
  async getEvents(tab?: string, occasionType?: string, page: number = 1, pageSize: number = 20) {
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

  async getEventById(id: string) {
    const data = await apiRequest<any>(`/events/${id}`)
    return mapEventFromBackend(data)
  },
}