export type AuditOperation = 'CREATE' | 'UPDATE' | 'DELETE'

export interface AuditEntry {
  id: string
  entity_type: string
  entity_id: string
  entity_display_id?: string
  action: AuditOperation
  user_id: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
  users?: {
    email: string
    name: string
    role: string
  }
}

export interface AuditFilter {
  entity_type?: string
  action?: AuditOperation
  user_id?: string
  entity_id?: string
  date_from?: string
  date_to?: string
  user_role?: string
  event_id?: string
  search?: string
}

export interface AuditPaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: AuditFilter
}

export interface AuditResponse {
  data: AuditEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DashboardStats {
  totalAudits: number
  today: number
  thisWeek: number
  thisMonth: number
  operationBreakdown: Record<AuditOperation, number>
  topUsers: Array<{ name: string; count: number }>
  topClients: Array<{ name: string; count: number }>
}

export interface AnalyticsTrend {
  date: string
  total: number
  creates: number
  updates: number
  deletes: number
}

export interface ExportFormat {
  format: 'csv' | 'xlsx' | 'pdf'
  includeFilters?: boolean
}

export interface AuthToken {
  access_token: string
  token_type: string
  expires_in: number
}

export interface LoginCredentials {
  username: string
  password: string
}
