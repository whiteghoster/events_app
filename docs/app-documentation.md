# Floraindia Event - Application Documentation

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind 4  |
| UI       | shadcn/ui (Radix), React Hook Form, Zod       |
| Backend  | NestJS 10, TypeScript                         |
| Database | PostgreSQL (Supabase)                         |
| Auth     | Supabase Auth, JWT, Passport                  |

Frontend runs on port **3000**, backend on port **3002**.

---

## High-Level Architecture

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                        CLIENT (Browser)                         │
 │                                                                 │
 │  Next.js 16 + React 19                                         │
 │  ┌───────────┐ ┌──────────┐ ┌─────────┐ ┌───────┐ ┌─────────┐ │
 │  │  Events   │ │ Catalog  │ │  Users  │ │ Audit │ │  Login  │ │
 │  │  Pages    │ │  Pages   │ │  Pages  │ │ Pages │ │  Page   │ │
 │  └─────┬─────┘ └────┬─────┘ └────┬────┘ └───┬───┘ └────┬────┘ │
 │        └─────────────┴────────────┴──────────┴──────────┘      │
 │                              │                                  │
 │              ┌───────────────┴───────────────┐                  │
 │              │  Auth Context + API Client    │                  │
 │              │  (JWT in localStorage)        │                  │
 │              └───────────────┬───────────────┘                  │
 └──────────────────────────────┼──────────────────────────────────┘
                                │  HTTP + Bearer Token
                                ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                     BACKEND (NestJS)                             │
 │                                                                  │
 │  ┌────────────┐  ┌────────────┐  ┌──────────────┐               │
 │  │  JwtGuard  │  │ RolesGuard │  │  Validation  │  (Global)     │
 │  └────────────┘  └────────────┘  └──────────────┘               │
 │                          │                                       │
 │    ┌──────┬──────────┬───┴────┬──────────┬───────┐              │
 │    ▼      ▼          ▼       ▼          ▼       ▼              │
 │  Auth   Users     Events   Catalog   Audit   Health            │
 │  Ctrl   Ctrl      Ctrl     Ctrl      Ctrl    Ctrl              │
 │    │      │          │       │          │                        │
 │    ▼      ▼          ▼       ▼          ▼                        │
 │  Auth   Users     Events   Catalog   Audit                     │
 │  Svc    Svc       Svc      Svc       Svc                       │
 │    └──────┴──────────┴───┬───┴──────────┘                       │
 │                          ▼                                       │
 │              ┌─────────────────────┐                             │
 │              │   DatabaseService   │                             │
 │              │  (Supabase Client)  │                             │
 │              └──────────┬──────────┘                             │
 └─────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   Supabase PostgreSQL   │
              │                         │
              │  - RLS Policies         │
              │  - DB Triggers          │
              │    (auto audit logging) │
              └─────────────────────────┘
```

---

## Roles & Permissions

| Role           | Events          | Catalog         | Users   | Audit  |
|----------------|-----------------|-----------------|---------|--------|
| `admin`        | Full CRUD       | Full CRUD       | Full    | View + Export |
| `staff`        | Create, Edit, Close | Create, Edit | -       | -      |
| `staff_member` | View, Edit qty/unit only | View   | -       | -      |

---

## Database Schema

```
┌──────────┐       ┌────────────┐       ┌────────────────┐
│  users   │       │ categories │       │   audit_log    │
├──────────┤       ├────────────┤       ├────────────────┤
│ id       │       │ id         │       │ id             │
│ email    │       │ name       │       │ entity_type    │
│ name     │       └─────┬──────┘       │ entity_id      │
│ role     │             │ 1:N          │ action         │
│ is_active│       ┌─────▼──────┐       │ user_id (FK)   │
└─────┬────┘       │  products  │       │ old_values     │
      │            ├────────────┤       │ new_values     │
      │            │ id         │       └────────────────┘
      │            │ name       │
      │            │ category_id│
      │            │ default_unit│
      │            │ price      │
      │            │ is_active  │
      │ 1:N        └─────┬──────┘
      │                  │ 1:N
┌─────▼──────┐    ┌──────▼─────────┐
│   events   │───►│ event_products │
├────────────┤ 1:N├────────────────┤
│ id         │    │ id             │
│ display_id │    │ event_id (FK)  │
│ name       │    │ product_id(FK) │
│ occasion   │    │ quantity       │
│ date       │    │ unit           │
│ venue_name │    │ price          │
│ status     │    └────────────────┘
│ assigned_to│
└────────────┘
```

---

## Features

### Event Management
- Create events with occasion type, venue, date, contact info, staff assignment
- Status lifecycle: `live` → `hold` → `finished` (irreversible once finished)
- Human-readable display IDs (EVT-xxxxx)
- Filter by status tab and occasion type, paginated listing

### Event Products
- Attach catalog products to events with custom quantity, unit, price
- Role-restricted editing (staff_member can only update quantity/unit)
- Category-wise summary with aggregated totals
- Cannot add products to finished events

### Product Catalog
- Categories and products with soft-delete (deactivation)
- Seed endpoints for bootstrapping demo data
- Guards against deleting categories with active products

### User Management (Admin only)
- Create staff/staff_member accounts (admin role locked to registration)
- Deactivate, re-activate, or permanently delete users
- Role synced to Supabase Auth metadata

### Audit Trail (Admin only)
- Automatic logging via PostgreSQL triggers on all CRUD operations
- Stores old/new values as JSONB
- Filter by entity type, action, user, date range
- CSV export

### Authentication
- Supabase-managed auth with JWT (access + refresh tokens)
- Frontend stores tokens in localStorage with proactive refresh (60s before expiry)
- Auto-retry on 401 with silent token refresh
- Global JWT guard on backend, `@Public()` decorator for open endpoints

---

## Frontend Pages

| Route                | Page             | Access         |
|----------------------|------------------|----------------|
| `/login`             | Login            | Public         |
| `/events`            | Events List      | All roles      |
| `/events/new`        | Create Event     | Admin          |
| `/events/[id]`       | Event Detail     | All roles      |
| `/events/[id]/edit`  | Edit Event       | Admin          |
| `/catalog`           | Product Catalog  | All roles      |
| `/users`             | Team Members     | Admin          |
| `/audit`             | Audit Trail      | Admin          |

UI: Responsive sidebar on desktop, bottom tab bar on mobile. Dark/light theme support. Toast notifications via Sonner.

---

## API Endpoints

### Auth `/auth`

| Method | Path             | Auth   | Description            |
|--------|------------------|--------|------------------------|
| POST   | `/auth/login`    | Public | Login, returns JWT     |
| POST   | `/auth/register` | Public | Register admin         |
| POST   | `/auth/refresh`  | Public | Refresh access token   |
| POST   | `/auth/logout`   | Public | Sign out               |

### Users `/users`

| Method | Path                   | Role  | Description             |
|--------|------------------------|-------|-------------------------|
| POST   | `/users`               | Admin | Create staff user       |
| GET    | `/users`               | Admin | List users (paginated)  |
| GET    | `/users/:id`           | Admin | Get user                |
| PUT    | `/users/:id`           | Admin | Update user             |
| DELETE | `/users/:id`           | Admin | Deactivate user         |
| POST   | `/users/:id/activate`  | Admin | Re-activate user        |
| DELETE | `/users/:id/permanent` | Admin | Permanently delete user |

### Events `/events`

| Method | Path                            | Role             | Description            |
|--------|---------------------------------|------------------|------------------------|
| POST   | `/events`                       | Admin            | Create event           |
| GET    | `/events`                       | All              | List events            |
| GET    | `/events/:id`                   | All              | Get event              |
| PUT    | `/events/:id`                   | Admin            | Update event           |
| PATCH  | `/events/:id/close`             | Admin            | Change status          |
| DELETE | `/events/:id`                   | Admin            | Delete event           |
| POST   | `/events/:id/products`          | Admin, Staff     | Add product to event   |
| GET    | `/events/:id/products`          | All              | List event products    |
| PUT    | `/events/:id/products/:rowId`   | Admin, Staff, SM | Update event product   |
| DELETE | `/events/:id/products/:rowId`   | Admin, Staff     | Remove event product   |
| GET    | `/events/:id/category-summary`  | All              | Category-wise totals   |

### Catalog `/catalog`

| Method | Path                                     | Role         | Description         |
|--------|------------------------------------------|--------------|---------------------|
| POST   | `/catalog/categories`                    | Admin, Staff | Create category     |
| GET    | `/catalog/categories`                    | All          | List categories     |
| GET    | `/catalog/categories/:id`                | All          | Get category        |
| PUT    | `/catalog/categories/:id`                | Admin, Staff | Update category     |
| DELETE | `/catalog/categories/:id`                | Admin, Staff | Delete category     |
| POST   | `/catalog/products`                      | Admin, Staff | Create product      |
| GET    | `/catalog/products`                      | All          | List products       |
| GET    | `/catalog/products/:id`                  | All          | Get product         |
| GET    | `/catalog/products/category/:categoryId` | All          | Products by category|
| PUT    | `/catalog/products/:id`                  | Admin, Staff | Update product      |
| POST   | `/catalog/products/:id/deactivate`       | Admin, Staff | Soft-delete product |
| DELETE | `/catalog/products/:id`                  | Admin, Staff | Hard-delete product |
| POST   | `/catalog/seed/categories`               | Admin        | Seed categories     |
| POST   | `/catalog/seed/products`                 | Admin        | Seed products       |

### Audit `/audit`

| Method | Path            | Role  | Description               |
|--------|-----------------|-------|---------------------------|
| GET    | `/audit`        | Admin | List audit logs (filtered)|
| GET    | `/audit/:id`    | Admin | Get single audit log      |
| POST   | `/audit/export` | Admin | Export logs as CSV        |

### Health `/health`

| Method | Path      | Auth   | Description     |
|--------|-----------|--------|-----------------|
| GET    | `/health` | Public | Status + uptime |

---

## Event Status Transitions

```
  ┌──────┐      ┌──────┐      ┌──────────┐
  │ live │ ───► │ hold │ ───► │ finished │
  └──────┘      └──────┘      └──────────┘
      │                             ▲
      └─────────────────────────────┘
               (direct close)
```

Once `finished`, status cannot be changed.

---

## Occasion Types

`haldi` · `bhaat` · `mehendi` · `wedding` · `reception` · `cocktail` · `after_party` · `others`

---

## Environment Variables

**Frontend** (`.env`):
- `NEXT_PUBLIC_API_URL` — Backend URL (default: `http://localhost:3002`)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase public anon key

**Backend** (`.env`):
- `PORT` — Server port (default: 3002)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `SUPABASE_ANON_KEY` — Supabase anon key
- `JWT_SECRET` — JWT signing secret
