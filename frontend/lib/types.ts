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
export type OccasionType = 'wedding' | 'birthday' | 'corporate' | 'religious' | 'social' | 'other'

export const OCCASION_TYPES = {
  WEDDING: 'wedding' as const,
  BIRTHDAY: 'birthday' as const,
  CORPORATE: 'corporate' as const,
  RELIGIOUS: 'religious' as const,
  SOCIAL: 'social' as const,
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
  createdAt?: string
}

/**
 * Category Model
 */
export interface Category {
  id: string
  name: string
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