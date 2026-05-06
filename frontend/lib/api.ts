import type { Event, EventsResponse, EventProduct, EventStatus, Category, Product, User, AuditEntry, Contractor, EventContractor, ContractorEventAssignment } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

// -------------------------------------------------------------------
// 1. UTILS & HELPERS
// -------------------------------------------------------------------

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
  if (!refreshToken) return null

  try {
    const res = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
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

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  _retry = true,
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })
  } catch (networkErr) {
    console.error('[API] Network error - API may be unreachable:', { 
      url: `${API_BASE_URL}${endpoint}`,
      error: networkErr 
    })
    throw new Error(`API unreachable. Check NEXT_PUBLIC_API_URL (${API_BASE_URL})`)
  }

  if (response.status === 401 && _retry) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return apiRequest<T>(endpoint, options, false)
    }
    if (typeof window !== 'undefined') {
      localStorage.clear()
      window.location.href = '/login'
    }
    throw new Error('Session expired. Please log in again.')
  }

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status} ${response.statusText}`
    console.error('[API] Request failed:', { 
      url: `${API_BASE_URL}${endpoint}`, 
      status: response.status, 
      statusText: response.statusText 
    })
    try {
      const errorData = await response.json()
      errorMessage = errorData?.message || errorData?.error || errorMessage
    } catch { /* ignore */ }
    throw new Error(errorMessage)
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  try {
    const json = await response.json()
    if (json && typeof json === 'object' && 'data' in json) {
      // Paginated response — return full object so caller gets meta
      if ('meta' in json) {
        return json as T
      }
      return json.data as T
    }
    return json as T
  } catch {
    throw new Error('Failed to parse server response')
  }
}

// -------------------------------------------------------------------
// 2. MAPPERS
// -------------------------------------------------------------------

function normalizeStatus(status: string): EventStatus {
  const s = String(status || '').toLowerCase()
  return (['live', 'hold', 'finished'].includes(s)) ? (s as EventStatus) : 'live'
}

function mapEventFromBackend(event: any): Event {
  return {
    id: event.id,
    displayId: event.display_id || event.displayId || undefined,
    clientName: event.client_name || event.clientName || '',
    companyName: event.company_name || event.companyName || undefined,
    contactPhone: event.contact_phone || event.contactPhone || undefined,
    eventDate: event.event_date || event.eventDate || '',
    venue: event.venue || event.venue || '',
    venueAddress: event.venue_address || event.venueAddress || undefined,
    city: event.city || undefined,
    headKarigarName: event.head_karigar_name || event.headKarigarName || undefined,
    managerName: event.manager_name || event.managerName || undefined,
    notes: event.notes || undefined,
    deliveryFromDate: event.delivery_from_date || event.deliveryFromDate || undefined,
    deliveryToDate: event.delivery_to_date || event.deliveryToDate || undefined,
    contractorsWorkFrom: event.contractors_work_from || undefined,
    contractorsWorkTo: event.contractors_work_to || undefined,
    status: normalizeStatus(event.status),
    createdAt: event.created_at || event.createdAt || undefined,
    updatedAt: event.updated_at || event.updatedAt || null,
    eventFromDate: event.event_from_date || undefined,
    eventEndDate: event.event_end_date || undefined,
    contractors: event.contractors?.map((c: any) => ({
      id: c.id,
      eventId: c.event_id,
      contractorId: c.contractor_id,
      contractorName: c.contractor?.name || '',
      shift: c.shift,
      memberQuantity: c.member_quantity || 0,
      workDate: c.work_date || undefined,
    })),
  }
}

function mapUserFromBackend(user: any): User {
  return {
    id: user.id || '',
    name: user.name || '',
    email: user.email || '',
    role: (user.role || 'karigar').toLowerCase() as any,
    isActive: user.is_active !== false,
    createdAt: user.created_at || user.createdAt || new Date().toISOString(),
  }
}

function mapAuditEntryFromBackend(log: any): AuditEntry {
  const entityName = log.new_values?.name || log.old_values?.name || log.entity_id || 'Unknown'
  let change = ''
  if (log.action === 'Created') {
    change = `New ${log.entity_type} created`
  } else if (log.action === 'Deleted') {
    change = `${log.entity_type} removed`
  } else {
    const keys = Object.keys(log.new_values || {}).filter(k => k !== 'updated_at')
    change = keys.length > 0 ? `Updated ${keys.join(', ')}` : 'Entry updated'
  }

  return {
    id: log.id,
    timestamp: log.created_at || new Date().toISOString(),
    userId: log.user_id || '',
    userEmail: log.users?.email || '',
    userName: log.users?.name || log.users?.email || 'System',
    userRole: (log.users?.role || 'admin').toLowerCase(),
    action: log.action as any,
    entityType: log.entity_type || 'Unknown',
    entityName: entityName,
    entityId: log.entity_id || '',
    entityDisplayId: log.event_code || log.entity_display_id,
    change: change,
    old_values: log.old_values,
    new_values: log.new_values,
  }
}

// -------------------------------------------------------------------
// 3. AUTH
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

  async register(payload: { email: string; password: string; name: string; role: string }) {
    return await apiRequest<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch { /* ignore */ }
  },

  async refreshToken(refreshToken: string) {
    return await apiRequest<{
      access_token: string
      refresh_token: string
    }>('/auth/token/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  },
}

// -------------------------------------------------------------------
// 4. EVENTS
// -------------------------------------------------------------------

export const eventsApi = {
  async getEvents(status?: string, page = 1, pageSize = 20): Promise<EventsResponse> {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    params.set('page', page.toString())
    params.set('page_size', pageSize.toString())

    const res = await apiRequest<any>(`/events?${params.toString()}`)
    return {
      events: res.data.map(mapEventFromBackend),
      pagination: {
        page: res.meta?.page || 1,
        pageSize: res.meta?.page_size || 20,
        total: res.meta?.total || 0,
        totalPages: res.meta?.total_pages || 0,
      },
    }
  },

  async createEvent(payload: {
    clientName: string
    companyName?: string
    contactPhone?: string
    eventDate: string
    venue: string
    venueAddress?: string
    city?: string
    headKarigarName?: string
    managerName?: string
    deliveryFromDate?: string
    deliveryToDate?: string
    eventFromDate?: string
    eventEndDate?: string
  }): Promise<Event> {
    const { clientName, companyName, contactPhone, eventDate, venue, venueAddress, city, headKarigarName, managerName, deliveryFromDate, deliveryToDate, eventFromDate, eventEndDate } = payload
    const data = await apiRequest<any>('/events', {
      method: 'POST',
      body: JSON.stringify({
        client_name: clientName,
        company_name: companyName,
        contact_phone: contactPhone,
        event_date: eventDate,
        venue: venue,
        venue_address: venueAddress,
        city: city,
        head_karigar_name: headKarigarName,
        manager_name: managerName,
        delivery_from_date: deliveryFromDate,
        delivery_to_date: deliveryToDate,
        event_from_date: eventFromDate,
        event_end_date: eventEndDate,
      }),
    })
    return mapEventFromBackend(data)
  },

  async getClients(): Promise<{ client_name: string; company_name?: string; contact_phone?: string }[]> {
    try {
      const res = await apiRequest<any>('/events/clients')
      // Handle both wrapped {data: [...]} and direct array responses
      const clients = Array.isArray(res) ? res : (res?.data || [])
      return clients
    } catch (err) {
      console.error('Failed to fetch clients:', err)
      return []
    }
  },

  async getEventById(id: string): Promise<Event> {
    const data = await apiRequest<any>(`/events/${id}`)
    return mapEventFromBackend(data)
  },

  async getProductById(id: string): Promise<any> {
    const res = await apiRequest<any>(`/products/${id}`)
    return res.data || res
  },

  async updateEvent(id: string, payload: Partial<Event> & { displayId?: string }): Promise<Event> {
    const { clientName, companyName, contactPhone, eventDate, venue, venueAddress, city, headKarigarName, managerName, deliveryFromDate, deliveryToDate, displayId, eventFromDate, eventEndDate } = payload
    const data = await apiRequest<any>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        client_name: clientName,
        company_name: companyName,
        contact_phone: contactPhone,
        event_date: eventDate,
        venue: venue,
        venue_address: venueAddress,
        city: city,
        head_karigar_name: headKarigarName,
        manager_name: managerName,
        delivery_from_date: deliveryFromDate,
        delivery_to_date: deliveryToDate,
        display_id: displayId,
        event_from_date: eventFromDate,
        event_end_date: eventEndDate,
      }),
    })
    return mapEventFromBackend(data)
  },

  async closeEvent(id: string, status: string): Promise<void> {
    await apiRequest(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  async deleteEvent(id: string): Promise<void> {
    await apiRequest(`/events/${id}`, { method: 'DELETE' })
  },

  // Event Products
  async getEventProducts(eventId: string): Promise<EventProduct[]> {
    const res = await apiRequest<any>(`/events/${eventId}/products?page=1&page_size=100`)
    const data = Array.isArray(res) ? res : (res.data || [])
    return data.map((item: any) => ({
      id: item.id,
      eventId: item.event_id || eventId,
      productId: item.product_id,
      productName: item.product?.name || 'Unknown Item',
      categoryId: item.product?.category?.id || '',
      categoryName: item.product?.category?.name || 'Unknown Category',
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
    }))
  },

  async addEventProduct(eventId: string, payload: {
    productId: string; quantity: number; unit: string; price?: number
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

  async updateEventProduct(eventId: string, rowId: string, payload: any): Promise<void> {
    await apiRequest(`/events/${eventId}/products/${rowId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  async deleteEventProduct(eventId: string, rowId: string): Promise<void> {
    await apiRequest(`/events/${eventId}/products/${rowId}`, { method: 'DELETE' })
  },

  async getCategorySummary(eventId: string): Promise<any[]> {
    return await apiRequest<any[]>(`/events/${eventId}/products/summary`)
  },

  // ── Event Contractors ──

  async getEventContractors(eventId: string): Promise<EventContractor[]> {
    const res = await apiRequest<any>(`/events/${eventId}/contractors`)
    const contractors = Array.isArray(res) ? res : (res.data || [])
    return contractors.map((c: any) => ({
      id: c.id,
      eventId: c.event_id,
      contractorId: c.contractor_id,
      contractorName: c.contractor?.name || '',
      shift: c.shift,
      memberQuantity: c.member_quantity || 0,
      workDate: c.work_date || undefined,
    }))
  },

  async syncEventContractors(
    eventId: string,
    entries: Array<{
      contractorId: string
      shift?: string
      memberQuantity: number
      workDate?: string
    }>,
    universalWorkDates?: {
      workFrom?: string
      workTo?: string
    },
  ): Promise<EventContractor[]> {
    const res = await apiRequest<any>(`/events/${eventId}/contractors`, {
      method: 'PUT',
      body: JSON.stringify({
        contractors: entries.map(e => ({
          contractor_id: e.contractorId,
          shift: e.shift,
          member_quantity: e.memberQuantity,
          work_date: e.workDate || null,
        })),
        workFrom: universalWorkDates?.workFrom || null,
        workTo: universalWorkDates?.workTo || null,
      }),
    })
    const list = Array.isArray(res) ? res : (res?.data || res || [])
    return list.map((c: any) => ({
      id: c.id,
      eventId: c.event_id,
      contractorId: c.contractor_id,
      contractorName: c.contractor?.name || '',
      shift: c.shift,
      memberQuantity: c.member_quantity || 0,
      workDate: c.work_date || undefined,
    }))
  },
}

// -------------------------------------------------------------------
// 5. CATEGORIES
// -------------------------------------------------------------------

export const catalogApi = {
  async getCategories(): Promise<Category[]> {
    const res = await apiRequest<any>('/categories')
    const categories = Array.isArray(res) ? res : (res.data || [])

    return categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      isActive: c.is_active !== false,
      createdAt: c.created_at
    }))
  },

  async createCategory(name: string): Promise<Category> {
    return await apiRequest<any>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  },

  async updateCategory(id: string, name: string): Promise<Category> {
    return await apiRequest<any>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    })
  },

  async deleteCategory(id: string): Promise<void> {
    await apiRequest(`/categories/${id}`, { method: 'DELETE' })
  },

  async getProducts(params?: { categoryId?: string; page?: number; pageSize?: number }): Promise<{
    data: Product[]; total: number
  }> {
    const q = new URLSearchParams()
    if (params?.categoryId) q.set('category_id', params.categoryId)
    if (params?.page) q.set('page', params.page.toString())
    if (params?.pageSize) q.set('page_size', params.pageSize.toString())

    const res = await apiRequest<any>(`/products?${q.toString()}`)
    const products = Array.isArray(res.data) ? res.data : (res.products || [])

    return {
      data: products.map((p: any) => ({
        id: p.id,
        name: p.name,
        categoryId: p.category?.id || p.category_id,
        categoryName: p.category?.name || 'Uncategorized',
        defaultUnit: p.default_unit || p.defaultUnit || 'pcs',
        price: p.price,
        description: p.description,
        isActive: p.is_active !== false,
        createdAt: p.created_at
      })),
      total: res.meta?.total || 0
    }
  },

  async createProduct(payload: any): Promise<Product> {
    const { categoryId, defaultUnit, ...rest } = payload
    return await apiRequest<any>('/products', {
      method: 'POST',
      body: JSON.stringify({
        ...rest,
        category_id: categoryId,
        default_unit: defaultUnit,
      }),
    })
  },

  async updateProduct(id: string, payload: any): Promise<Product> {
    const { categoryId, defaultUnit, isActive, ...rest } = payload
    return await apiRequest<any>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...rest,
        category_id: categoryId,
        default_unit: defaultUnit,
        is_active: isActive,
      }),
    })
  },

  async deactivateProduct(id: string): Promise<void> {
    await apiRequest(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: false }),
    })
  },

  async deleteProduct(id: string): Promise<void> {
    await apiRequest(`/products/${id}`, { method: 'DELETE' })
  },

}

// -------------------------------------------------------------------
// 6. USERS
// -------------------------------------------------------------------

export const usersApi = {
  async getUsers(page: number = 1, pageSize: number = 50): Promise<{ data: User[]; total: number }> {
    const res = await apiRequest<any>(`/users?page=${page}&page_size=${pageSize}`)
    return {
      data: (Array.isArray(res.data) ? res.data : []).map(mapUserFromBackend),
      total: res.meta?.total || 0
    }
  },

  async createUser(payload: { name: string; email: string; password: string; role: string }): Promise<User> {
    const data = await apiRequest<any>('/users', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        role: payload.role.toLowerCase().replace(' ', '_'),
      }),
    })
    return mapUserFromBackend(data)
  },

  async updateUser(id: string, payload: any): Promise<User> {
    const data = await apiRequest<any>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...payload,
        role: payload.role ? payload.role.toLowerCase().replace(' ', '_') : undefined,
      }),
    })
    return mapUserFromBackend(data)
  },

  async deleteUser(id: string): Promise<void> {
    await apiRequest(`/users/${id}`, { method: 'DELETE' })
  },

  async activateUser(id: string): Promise<User> {
    const data = await apiRequest<any>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: true }),
    })
    return mapUserFromBackend(data)
  },

  async permanentlyDeleteUser(id: string): Promise<void> {
    await apiRequest(`/users/${id}?permanent=true`, { method: 'DELETE' })
  },
}

// -------------------------------------------------------------------
// 7. AUDIT
// -------------------------------------------------------------------

export const auditApi = {
  async getAuditLogs(params?: any): Promise<{ data: AuditEntry[]; pagination: any }> {
    const q = new URLSearchParams()
    if (params?.entity_type) q.set('entity_type', params.entity_type)
    if (params?.entity_id) q.set('entity_id', params.entity_id)
    if (params?.event_id) q.set('event_id', params.event_id)
    if (params?.action) q.set('action', params.action)
    if (params?.user_id) q.set('user_id', params.user_id)
    if (params?.user_role) q.set('user_role', params.user_role)
    if (params?.date_from) q.set('date_from', params.date_from)
    if (params?.date_to) q.set('date_to', params.date_to)
    if (params?.page) q.set('page', params.page.toString())
    if (params?.limit) q.set('limit', params.limit.toString())

    const url = `/audit?${q.toString()}`
    console.log('[API] auditApi.getAuditLogs:', { apiUrl: API_BASE_URL, endpoint: url, params })
    const res = await apiRequest<any>(url)
    console.log('[API] auditApi.getAuditLogs response:', { count: Array.isArray(res) ? res.length : res.data?.length })
    const logs = Array.isArray(res) ? res : (res.data || [])

    return {
      data: logs.map(mapAuditEntryFromBackend),
      pagination: res.meta?.pagination || res.pagination || { page: 1, limit: 50, total: 0, hasMore: false },
    }
  },

  async exportAuditLogs(filters: any): Promise<{ data: any[]; filename: string }> {
    const q = new URLSearchParams()
    if (filters?.entity_type) q.set('entity_type', filters.entity_type)
    if (filters?.action) q.set('action', filters.action)
    q.set('format', 'csv')

    const res = await apiRequest<any>(`/audit?${q.toString()}`)
    return {
      data: res.data || [],
      filename: res.filename || 'audit_export.csv'
    }
  },

  async deleteAuditLogs(ids: string[]): Promise<void> {
    await apiRequest('/audit/logs', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    })
  },
}

// -------------------------------------------------------------------
// 6. ContractorS API
// -------------------------------------------------------------------

export const ContractorsApi = {
  async getAll(): Promise<Contractor[]> {
    return await apiRequest<Contractor[]>('/Contractors')
  },

  async create(data: { name: string; isActive?: boolean }): Promise<Contractor> {
    return await apiRequest<Contractor>('/Contractors', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: { name?: string; isActive?: boolean }): Promise<Contractor> {
    return await apiRequest<Contractor>(`/Contractors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<{ success: boolean }> {
    return await apiRequest<{ success: boolean }>(`/Contractors/${id}`, {
      method: 'DELETE',
    })
  },

  async getContractorEvents(contractorId: string): Promise<ContractorEventAssignment[]> {
    const res = await apiRequest<any>(`/Contractors/${contractorId}/events`)
    const rows: any[] = Array.isArray(res) ? res : (res.data || [])
    return rows.map((r: any) => ({
      eventId: r.eventId,
      eventCode: r.eventCode || undefined,
      eventName: r.eventName,
      eventStatus: r.eventStatus || undefined,
      shift: r.shift || undefined,
      memberQuantity: r.memberQuantity ?? 0,
      workDate: r.workDate || undefined,
    }))
  },
}
