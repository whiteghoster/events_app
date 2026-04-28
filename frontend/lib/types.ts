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
  createdBy?: string
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
  userId?: string
  userEmail?: string
  userName: string
  userRole: string
  action: AuditAction
  entityType: string
  entityName?: string
  entityId?: string
  entityDisplayId?: string
  change?: string
  old_values?: any
  new_values?: any
}

// ─── Form types ──────────────────────────────────────────────────────────────

export interface EventFormData {
  clientName: string
  companyName: string
  contactPhone: string
  eventDate: string
  venue: string
  venueAddress: string
  city: string
  headKarigarName: string
  managerName: string
  deliveryFromDate: string
  deliveryToDate: string
  displayId?: string
}

export interface ProductFormData {
  name: string
  categoryId: string
  defaultUnit: ProductUnit
  price: string
  isActive: boolean
}

// ─── Component prop types ────────────────────────────────────────────────────

export interface BreadcrumbEntry {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  breadcrumbs?: BreadcrumbEntry[]
  action?: React.ReactNode
  className?: string
}

export interface EventCardProps {
  event: Event
  products?: EventProduct[]
  productCount?: number
}

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export interface StatusBadgeProps {
  status: EventStatus | 'active' | 'inactive' | 'Active' | 'Inactive'
  className?: string
}

export interface UserFormData {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface UserDialogProps {
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  editingUser: User | null
  isLoading: boolean
  formData: UserFormData
  setFormData: (updater: (prev: UserFormData) => UserFormData) => void
  generatePassword: () => void
  saveUser: () => void
}

export interface UserCardProps {
  user: User
  currentUser: { id: string; role: string }
  onEdit: (user: User) => void
  onDeactivate: (user: User) => void
  onActivate: (user: User) => void
  onPermanentlyDelete: (user: User) => void
}

export interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCategory: Category | null
  newCategoryName: string
  setNewCategoryName: (name: string) => void
  isSaving: boolean
  saveCategory: () => void
}

export interface CatalogProductsTableProps {
  products: Product[]
  categories: Category[]
  canManage: boolean
  openProductSheet: (product?: Product) => void
  deactivateProduct: (product: Product) => void
  reactivateProduct: (product: Product) => void
}

export interface DeactivateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  confirmDeactivate: () => void
}

export interface ProductSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingProduct: Product | null
  categories: Category[]
  productFormData: ProductFormData
  setProductFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
  isSaving: boolean
  saveProduct: () => void
}

export interface AuditTableProps {
  logs: AuditEntry[]
  isLoading: boolean
}

export interface AuditPaginationProps {
  page: number
  totalPages: number
  total: number
  setPage: (page: number | ((prev: number) => number)) => void
}

export interface AuditFiltersProps {
  entityFilter: string
  setEntityFilter: (value: string) => void
  actionFilter: AuditAction | 'All'
  setActionFilter: (value: AuditAction | 'All') => void
  dateFrom: string
  setDateFrom: (value: string) => void
  dateTo: string
  setDateTo: (value: string) => void
  setPage: (page: number) => void
}