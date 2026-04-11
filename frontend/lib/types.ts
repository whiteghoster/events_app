/**
 * User Roles - MUST match backend enums (lowercase)
 */
export type UserRole = 'admin' | 'staff' | 'staff_member'

export const USER_ROLES = {
  ADMIN: 'admin' as const,
  STAFF: 'staff' as const,
  STAFF_MEMBER: 'staff_member' as const,
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
  | 'other'

export const OCCASION_TYPES = {
  HALDI: 'haldi' as const,
  BHAAT: 'bhaat' as const,
  MEHENDI: 'mehendi' as const,
  WEDDING: 'wedding' as const,
  RECEPTION: 'reception' as const,
  COCKTAIL: 'cocktail' as const,
  AFTER_PARTY: 'after_party' as const,
  OTHER: 'other' as const,
} as const


/**
 * User Model
 */
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

/**
 * Event Model
 */
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
  closedAt?: string | null
  closedBy?: string | null
  createdAt?: string
  updatedAt?: string | null
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
 * Audit Log Entry
 */
export interface AuditEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: 'Created' | 'Updated' | 'Deleted'
  entityType: string
  entityName: string
  change: string
}