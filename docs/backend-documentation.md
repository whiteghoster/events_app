# Events App - Backend Documentation

## Tech Stack

| Layer          | Technology                     |
|----------------|--------------------------------|
| Framework      | NestJS 10 (TypeScript)         |
| Database       | PostgreSQL (Supabase)          |
| Authentication | Supabase Auth + JWT + Passport |
| Validation     | class-validator                |

Server runs on port **3002** by default.

---

## High-Level Architecture

```
                          ┌─────────────────────────────┐
                          │         Client (App)         │
                          └──────────────┬──────────────┘
                                         │  HTTP + Bearer Token
                                         ▼
                          ┌─────────────────────────────┐
                          │        NestJS Server         │
                          │         (port 3002)          │
                          └──────────────┬──────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │         Global Middleware & Guards                  │
              │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
              │  │  JwtGuard  │  │ RolesGuard │  │  Validation  │  │
              │  │ (auth all) │  │ (per-role) │  │   Pipe       │  │
              │  └────────────┘  └────────────┘  └──────────────┘  │
              └──────────────────────────┬─────────────────────────┘
                                         │
           ┌─────────┬──────────┬────────┼────────┬──────────┬─────────┐
           ▼         ▼          ▼        ▼        ▼          ▼         ▼
       ┌───────┐ ┌───────┐ ┌────────┐ ┌──────┐ ┌───────┐ ┌───────┐ ┌──────┐
       │ Auth  │ │ Users │ │ Events │ │Cata- │ │ Audit │ │Health │ │  App │
       │ Ctrl  │ │ Ctrl  │ │  Ctrl  │ │ log  │ │ Ctrl  │ │ Ctrl  │ │ Ctrl │
       └───┬───┘ └───┬───┘ └───┬────┘ │Ctrl  │ └───┬───┘ └───────┘ └──────┘
           │         │         │      └──┬───┘     │
           ▼         ▼         ▼         ▼         ▼
       ┌───────┐ ┌───────┐ ┌────────┐ ┌──────┐ ┌───────┐
       │ Auth  │ │ Users │ │ Events │ │Cata- │ │ Audit │
       │  Svc  │ │  Svc  │ │  Svc   │ │ log  │ │  Svc  │
       └───┬───┘ └───┬───┘ └───┬────┘ │ Svc  │ └───┬───┘
           │         │         │      └──┬───┘     │
           └─────────┴─────────┴────┬────┴─────────┘
                                    ▼
                          ┌─────────────────────┐
                          │   DatabaseService    │
                          │  (Supabase Client)   │
                          └──────────┬──────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │  Supabase PostgreSQL │
                          │                     │
                          │  ┌───────────────┐  │
                          │  │  RLS Policies  │  │
                          │  │  DB Triggers   │  │
                          │  │  (auto-audit)  │  │
                          │  └───────────────┘  │
                          └─────────────────────┘
```

---

## Roles

| Role           | Access Level                                              |
|----------------|-----------------------------------------------------------|
| `admin`        | Full access. Manage users, events, catalog, view audits.  |
| `staff`        | Manage catalog and events. Cannot manage users or audits. |
| `staff_member` | View events, update event product quantity/unit only.      |

---

## Database Tables

```
┌──────────┐       ┌────────────┐       ┌────────────────┐
│  users   │       │ categories │       │   audit_log    │
├──────────┤       ├────────────┤       ├────────────────┤
│ id (PK)  │       │ id (PK)    │       │ id (PK)        │
│ email    │       │ name       │       │ entity_type    │
│ name     │       │ created_at │       │ entity_id      │
│ role     │       │ updated_at │       │ action         │
│ is_active│       └─────┬──────┘       │ user_id (FK)   │
│ created_at│            │              │ old_values     │
│ updated_at│            │ 1:N          │ new_values     │
└─────┬────┘       ┌─────▼──────┐       │ created_at     │
      │            │  products  │       └────────────────┘
      │            ├────────────┤
      │            │ id (PK)    │
      │            │ name       │
      │            │ category_id│
      │            │ default_unit│
      │            │ price      │
      │            │ is_active  │
      │            └─────┬──────┘
      │                  │
      │ 1:N              │ 1:N
      │                  │
┌─────▼──────┐    ┌──────▼─────────┐
│   events   │    │ event_products │
├────────────┤    ├────────────────┤
│ id (PK)    │    │ id (PK)        │
│ display_id │    │ event_id (FK)  │◄──┐
│ name       │    │ product_id(FK) │   │
│ occasion   │    │ quantity       │   │
│ date       │    │ unit           │   │
│ venue_name │    │ price          │   │
│ status     │    └────────────────┘   │
│ assigned_to│                         │
│ ...        ├─────────────────────────┘
└────────────┘          1:N
```

---

## API Endpoints

### Auth `/auth`

| Method | Path             | Auth     | Description              |
|--------|------------------|----------|--------------------------|
| POST   | `/auth/login`    | Public   | Login, returns JWT       |
| POST   | `/auth/register` | Public   | Register admin user      |
| POST   | `/auth/refresh`  | Public   | Refresh access token     |
| POST   | `/auth/logout`   | Public   | Sign out                 |

### Users `/users`

| Method | Path                      | Role  | Description                |
|--------|---------------------------|-------|----------------------------|
| POST   | `/users`                  | Admin | Create staff user          |
| GET    | `/users`                  | Admin | List users (paginated)     |
| GET    | `/users/:id`              | Admin | Get user by ID             |
| PUT    | `/users/:id`              | Admin | Update user                |
| DELETE | `/users/:id`              | Admin | Deactivate user            |
| POST   | `/users/:id/activate`     | Admin | Re-activate user           |
| DELETE | `/users/:id/permanent`    | Admin | Permanently delete user    |

### Events `/events`

| Method | Path                              | Role               | Description                 |
|--------|-----------------------------------|--------------------|-----------------------------|
| POST   | `/events`                         | Admin              | Create event                |
| GET    | `/events`                         | All                | List events (filter/page)   |
| GET    | `/events/:id`                     | All                | Get event by ID/display_id  |
| PUT    | `/events/:id`                     | Admin              | Update event                |
| PATCH  | `/events/:id/close`               | Admin              | Change event status         |
| DELETE | `/events/:id`                     | Admin              | Delete event                |
| POST   | `/events/:id/products`            | Admin, Staff       | Add product to event        |
| GET    | `/events/:id/products`            | All                | List event products         |
| PUT    | `/events/:id/products/:rowId`     | Admin, Staff, SM   | Update event product        |
| DELETE | `/events/:id/products/:rowId`     | Admin, Staff       | Remove product from event   |
| GET    | `/events/:id/category-summary`    | All                | Category-wise totals        |

### Catalog `/catalog`

| Method | Path                                     | Role          | Description              |
|--------|------------------------------------------|---------------|--------------------------|
| POST   | `/catalog/categories`                    | Admin, Staff  | Create category          |
| GET    | `/catalog/categories`                    | All           | List categories          |
| GET    | `/catalog/categories/:id`                | All           | Get category             |
| PUT    | `/catalog/categories/:id`                | Admin, Staff  | Update category          |
| DELETE | `/catalog/categories/:id`                | Admin, Staff  | Delete category          |
| POST   | `/catalog/products`                      | Admin, Staff  | Create product           |
| GET    | `/catalog/products`                      | All           | List products            |
| GET    | `/catalog/products/:id`                  | All           | Get product              |
| GET    | `/catalog/products/category/:categoryId` | All           | Products by category     |
| PUT    | `/catalog/products/:id`                  | Admin, Staff  | Update product           |
| POST   | `/catalog/products/:id/deactivate`       | Admin, Staff  | Soft-delete product      |
| DELETE | `/catalog/products/:id`                  | Admin, Staff  | Hard-delete product      |
| POST   | `/catalog/seed/categories`               | Admin         | Seed default categories  |
| POST   | `/catalog/seed/products`                 | Admin         | Seed default products    |

### Audit `/audit`

| Method | Path          | Role  | Description                              |
|--------|---------------|-------|------------------------------------------|
| GET    | `/audit`      | Admin | List audit logs (filter by entity/date)  |
| GET    | `/audit/:id`  | Admin | Get single audit log                     |
| POST   | `/audit/export`| Admin | Export logs as CSV                       |

### Health `/health`

| Method | Path      | Auth   | Description         |
|--------|-----------|--------|---------------------|
| GET    | `/health` | Public | Status + uptime     |

---

## Features Summary

- **Event lifecycle** - Create events with occasion type, venue, date. Transition through `live` → `hold` → `finished`.
- **Event products** - Attach catalog products to events with custom quantity, unit, and price. Category-wise summary view.
- **Product catalog** - Categories and products with soft-delete support. Seed endpoints for demo data.
- **User management** - Admin creates staff accounts. Soft deactivation and permanent deletion. Role synced to Supabase Auth.
- **Audit trail** - Automatic logging via PostgreSQL triggers on all data changes. Filterable and exportable as CSV.
- **Auth** - Supabase-managed authentication with JWT. Role-based access enforced globally.

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
