import { PaginatedResult } from './types';

export function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined),
  ) as Partial<T>;
}

export function paginate<T>(
  data: T[] | null,
  count: number | null,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const total = count ?? 0;
  return {
    data: data ?? [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function paginationOffset(page: number, pageSize: number): number {
  return Math.max(0, (page - 1) * pageSize);
}
