export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  STAFF_MEMBER = 'staff_member',
}

export const SELF_REGISTERABLE_ROLES = [UserRole.STAFF, UserRole.STAFF_MEMBER] as const;

export enum EventStatus {
  LIVE = 'live',
  HOLD = 'hold',
  FINISHED = 'finished',
}

export enum OccasionType {
  HALDI = 'haldi',
  BHAAT = 'bhaat',
  MEHENDI = 'mehendi',
  WEDDING = 'wedding',
  RECEPTION = 'reception',
  COCKTAIL = 'cocktail',
  AFTER_PARTY = 'after_party',
  OTHER = 'others',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export interface AuthenticatedUser {
  id: string;
  sub: string;
  email: string;
  role: UserRole | null;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResult<T = any> {
  data: T[];
  meta: PaginationMeta;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  user_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  users?: {
    email: string;
    name: string;
    role: string;
  };
}

export interface AuditLogResult {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
