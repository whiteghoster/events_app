export type UserRole = 'admin' | 'staff' | 'staff_member'

export const userRoleLabel: Record<UserRole, string> = {
  admin: 'Admin',
  staff: 'Staff',
  staff_member: 'Staff Member',
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  avatar?: string
}

export type OccasionType = 'Wedding' | 'Birthday' | 'Pooja' | 'Corporate' | 'Festival' | 'Other'

export type EventStatus = 'Live' | 'Hold' | 'Finished'

export interface Event {
  id: string
  name: string
  occasionType: OccasionType
  eventDate: string
  venueName: string
  venueAddress?: string
  contactName?: string
  contactPhone?: string
  notes?: string
  status: EventStatus
  closedBy?: string
  createdAt: string
  updatedAt: string
}

export type ProductUnit = 'kg' | 'g' | 'pcs' | 'bunch' | 'dozen' | 'box' | 'bundle' | 'set' | 'roll' | 'metre' | 'litre' | 'ml'

export interface Category {
  id: string
  name: string
  productCount: number
  isActive: boolean
}

export interface Product {
  id: string
  name: string
  categoryId: string
  categoryName: string
  defaultUnit: ProductUnit
  price?: number
  description?: string
  isActive: boolean
}

export interface EventProduct {
  id: string
  eventId: string
  productId: string
  productName: string
  categoryId: string
  categoryName: string
  quantity: number
  unit: string
  price?: number
}

export type AuditAction = 'Created' | 'Updated' | 'Deleted'

export interface AuditEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: AuditAction
  entityType: 'Event' | 'Product' | 'Category' | 'Event Row' | 'User'
  entityName: string
  change: string
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiErrorResponse {
  statusCode: number
  message: string
  error: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_at: number
  user: {
    id: string
    email: string
    role: UserRole
  }
}
