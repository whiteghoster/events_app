export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  STAFF_MEMBER = 'staff_member',
}

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

export interface PaginatedResult<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
