/**
 * User Roles - MUST match backend enums (lowercase)
 */
export type UserRole = 'admin' | 'karigar' | 'manager'

export const USER_ROLES = {
  ADMIN: 'admin' as const,
  KARIGAR: 'karigar' as const,
  MANAGER: 'manager' as const,
} as const

/**
 * Event Statuses - MUST match backend enums (lowercase)
 */
export type EventStatus = 'live' | 'hold' | 'finished'

export const EVENT_STATUSES = {
  LIVE: 'live' as const,
  HOLD: 'hold' as const,
  FINISHED: 'finished' as const,
} as const

/**
 * Occasion Types - MUST match database constraint (lowercase)
 */
export type OccasionType = 
  | 'haldi' 
  | 'bhaat' 
  | 'mehendi' 
  | 'wedding' 
  | 'reception' 
  | 'cocktail' 
  | 'after_party' 
  | 'others'

export const OCCASION_TYPES = {
  HALDI: 'haldi' as const,
  BHAAT: 'bhaat' as const,
  MEHENDI: 'mehendi' as const,
  WEDDING: 'wedding' as const,
  RECEPTION: 'reception' as const,
  COCKTAIL: 'cocktail' as const,
  AFTER_PARTY: 'after_party' as const,
  OTHERS: 'others' as const,
} as const


/**
 * User Model
 */
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive?: boolean
  createdAt: string
}

/**
 * Client Model (for dropdown)
 */
export interface Client {
  client_name: string
  company_name?: string
  contact_phone?: string
}

/**
 * Event Model
 */
export interface Event {
  id: string
  displayId?: string
  clientName: string
  companyName?: string
  contactPhone?: string
  eventDate: string
  venue: string
  venueAddress?: string
  city?: string
  headKarigarName?: string
  managerName?: string
  notes?: string
  deliveryFromDate?: string
  deliveryToDate?: string
  status?: EventStatus
  createdAt?: string
  updatedAt?: string | null
}

/**
 * Events Response with pagination
 */
export interface EventsResponse {
  events: Event[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * Category Model
 */
export interface Category {
  id: string
  name: string
  isActive?: boolean
  productCount?: number
  createdAt: string
}

/**
 * Product Model
 */
export interface Product {
  id: string
  name: string
  categoryId: string
  category?: Category
  defaultUnit: string
  price?: number
  description?: string
  isActive: boolean
  createdAt: string
}

/**
 * Product Unit
 */
export type ProductUnit = 'kg' | 'g' | 'pcs' | 'bunch' | 'dozen' | 'box' | 'bundle' | 'set' | 'roll' | 'metre' | 'litre' | 'ml'

export const PRODUCT_UNITS: ProductUnit[] = ['kg', 'g', 'pcs', 'bunch', 'dozen', 'box', 'bundle', 'set', 'roll', 'metre', 'litre', 'ml']

/**
 * Event Product Model (Line item in an event)
 */
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

/**
 * Audit Log Action - MUST match backend enum (lowercase)
 */
export type AuditAction = 'create' | 'update' | 'delete'

/**
 * Audit Log Entry
 */
export interface AuditEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: UserRole
  action: AuditAction
  entityType: string
  entityName: string
  entityId: string
  change: string
}