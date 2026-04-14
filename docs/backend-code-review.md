# Backend Code Review

## Summary

The backend is a functional NestJS + Supabase application with clear module boundaries. However, it has security gaps, scattered types, duplicated patterns, dead code, and inconsistent error handling that need attention before production use.

**Verdict: Needs Changes**

---

## Critical Issues

| #  | File | Issue | Severity |
|----|------|-------|----------|
| 1  | `config/jwt.config.ts:2` | JWT secret hardcoded in source code. Anyone with repo access can forge tokens. | CRITICAL |
| 2  | `auth/guards/jwt.guard.ts:48` vs `auth/strategies/jwt.strategy.ts:20` | Role extraction logic differs between guard and strategy. Guard defaults to `'staff'`, strategy defaults to `null`. Inconsistent authorization. | HIGH |
| 3  | `auth/enums/audit-action.enum.ts` | Duplicate enum keys: `CREATE`/`CREATED`, `UPDATE`/`UPDATED`, `DELETE`/`DELETED` all map to same values. Confusing and redundant. | HIGH |
| 4  | `catalog/dto/update-cateogry.dto.ts` | Duplicate DTO file with typo in name ("cateogry"). Two different update-category DTOs exist with different validation rules. | HIGH |
| 5  | `events/events.service.ts:73-76` | `generateDisplayId()` uses `Math.random()` with only 90,000 possible values. No collision check or retry. Will fail at scale. | HIGH |
| 6  | `auth/auth.service.ts:24-27` | AuthService creates its own Supabase admin client instead of using DatabaseService. Duplicate client initialization. | HIGH |
| 7  | `audit/audit.service.ts:115` | Pagination bug: `query.range(offset, limit)` should be `query.range(offset, offset + limit - 1)`. Breaks for page > 1. | HIGH |

---

## Security

| #  | File | Issue |
|----|------|-------|
| 1  | `config/jwt.config.ts:2` | Hardcoded secret: `'event-management-secret-key-2024-very-secure-random-string-12345'`. Must be env variable. |
| 2  | `auth/auth.controller.ts:93` | Logout endpoint is `@Public()` and accepts no token. Cannot actually sign out the requesting user. |
| 3  | No file | No rate limiting on login, register, or refresh endpoints. Brute force vulnerable. |
| 4  | No file | No token revocation mechanism. Deactivated users keep valid tokens for up to 7 days. |
| 5  | `users/users.service.ts:54,61` | Dual Supabase clients (admin + regular) with no clear rules on which to use where. Privilege escalation risk. |
| 6  | `auth/auth.service.ts:40-43` | Manual email regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) duplicates `@IsEmail()` already on the DTO. Weaker validation. |
| 7  | `auth/auth.service.ts:45-48` | Password minimum is 6 characters with no complexity requirements. |
| 8  | `main.ts:51-56` | CORS origins hardcoded in source. Should come from env config. |

---

## Dead Code & Unnecessary Abstractions

| #  | File | Issue |
|----|------|-------|
| 1  | `auth/guards/auth.guard.ts` | Entire file is redundant. Returns `true` when token exists, then defers to JwtGuard. JwtGuard already handles everything. Remove. |
| 2  | `auth/strategies/jwt.strategy.ts` | PassportStrategy exported but never consumed. JwtGuard calls `authService.validateToken()` directly. Dead code. |
| 3  | `events/events.service.ts:232-240` | Commented-out validation block for HOLD status. Remove or restore, don't leave as comment. |
| 4  | `catalog/service.ts:89-95, 281-287` | Unreachable error check: second `if (error)` block after already throwing `NotFoundException` on same condition. Dead code, repeated twice. |
| 5  | `auth/auth.service.ts:40-48` | Manual email and password validation in service duplicates DTO decorators (`@IsEmail`, `@MinLength`). Global ValidationPipe already handles this. Remove. |

---

## Duplicated Patterns

| Pattern | Occurrences | Where |
|---------|-------------|-------|
| Response wrapping `{ success: true, data }` | 20+ | Every controller method. Use a NestJS interceptor instead. |
| Pagination logic (offset, range, totalPages) | 5x | `events.service`, `catalog.service` (x3), `users.service`. Extract to shared helper. |
| `Object.fromEntries(Object.entries(x).filter(...))` to strip undefined | 2x | `events.service.ts:188, 375`. Extract utility. |
| Audit log creation boilerplate | 15+ | Every mutation in every service. Same shape each time. |
| `findXById()` before every update/delete | 10+ | All services call find before mutate. Redundant DB round-trip. |

---

## Scattered Types

| Issue | Where |
|-------|-------|
| DTOs defined inside service files, not in `/dto` folder | `users.service.ts` (CreateUserDto, UpdateUserDto), `audit.service.ts` (FindAuditLogsDto) |
| Enums that don't belong in auth module | `auth/enums/event-status.enum.ts`, `auth/enums/occasion-type.enum.ts`, `auth/enums/audit-action.enum.ts` — these are domain enums, not auth enums |
| `any` type used instead of interfaces | `events.service.ts:56,479`, `catalog.controller.ts:28,63`, `users.controller.ts:28`, `users.service.ts:191`, `audit.service.ts:32` |
| No shared interfaces for: User, Event, Product, ApiResponse, PaginatedResponse | Nowhere defined. Every service uses raw Supabase `data` with `any` casts. |

---

## Code Clarity

| #  | File | Issue |
|----|------|-------|
| 1  | `events/events.service.ts` | 523 lines, mixes event CRUD + event-product CRUD + reporting. Split into two services. |
| 2  | `catalog/catalog.service.ts` | 527 lines, mixes category + product + seed logic. Split or extract seed to standalone. |
| 3  | `events/events.service.ts:131-143` | Tab filtering uses `tab === 'live' \|\| tab === 'LIVE'` for each status. Normalize once with `.toLowerCase()`. |
| 4  | `events` controller + service | `rowId` parameter name is unclear. It's `event_products.id`. Use `eventProductId`. |
| 5  | `auth/auth.service.ts` | Handles registration, login, token refresh, metadata sync, and signout. Too many responsibilities. |
| 6  | `catalog/catalog.service.ts:454-526` | `seedProducts()` does 26 sequential category lookups (N+1). Pre-fetch all categories in one query. |

---

## Error Handling

| #  | File | Issue |
|----|------|-------|
| 1  | `auth/auth.controller.ts:35-40` | Catches all errors and always returns 401. A validation error (400) becomes 401. |
| 2  | `auth/auth.service.ts:144-152` | Silent catch on metadata sync failure. Login succeeds but role may be wrong. |
| 3  | `catalog/catalog.service.ts:447,503,521` | Seed endpoints log errors but return success. Partial failures invisible to client. |
| 4  | `users/users.service.ts:393-398` | `hardDelete()` logs auth deletion failure as warning but still deletes DB record. Leaves orphaned auth user. |
| 5  | All services | Generic `throw new BadRequestException('Failed to X: ' + error.message)`. Supabase errors may leak DB details. Classify errors properly. |

---

## Missing

| What | Why It Matters |
|------|---------------|
| Rate limiting | Auth endpoints exposed to brute force |
| Token revocation | Deactivated users retain access for token lifetime (7 days) |
| Request logging middleware | No HTTP request/response logs for debugging |
| Structured logging | Mix of `console.log/warn/error` and NestJS `Logger`. No correlation IDs. |
| Transaction support | Event creation + product addition not atomic. Partial failures leave orphaned data. |
| Pagination bounds validation | Client can request `page=-1` or `pageSize=999999` |
| Admin self-delete guard | Admin can permanently delete their own account |

---

## What Looks Good

- Clean module boundaries (auth, events, catalog, users, audit, health)
- Global guards (JWT + Roles) with `@Public()` escape hatch
- `ALLOWED_TRANSITIONS` matrix for event status is clear and maintainable
- `getEventOrThrow()` handles both UUID and display_id lookups elegantly
- Audit trail via PostgreSQL triggers covers all tables automatically
- `AllExceptionsFilter` handles Postgres error codes (23505, 23503, 23502) well
- Password sanitization in audit logs before storage
- Rollback in user creation (deletes auth user if DB insert fails)
- Global `ValidationPipe` with whitelist mode prevents mass assignment

---

## Priority Actions

1. **Move JWT secret to environment variable** — security critical
2. **Fix audit pagination bug** — functional breakage
3. **Delete dead code** — AuthGuard, JwtStrategy, commented blocks, duplicate DTOs
4. **Centralize types** — move DTOs to `/dto` folders, create shared interfaces, move enums to owning modules
5. **Extract duplicated patterns** — response interceptor, pagination helper, audit logging helper
6. **Add rate limiting** — at minimum on auth endpoints
7. **Fix display ID generation** — add collision check with retry
