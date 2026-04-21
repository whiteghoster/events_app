# API Reference

Base URL: `http://localhost:3002`

## Authentication

All endpoints except **Public** require a Bearer token.

```
Authorization: Bearer <access_token>
```

## Roles

| Role | Value |
|------|-------|
| Admin | `admin` |
| Staff | `staff` |
| Staff Member | `staff_member` |

---

## Auth

### POST /auth/login (Public)

```json
// Request
{ "email": "admin@example.com", "password": "password123" }

// Response
{
  "data": {
    "user": { "id": "uuid", "email": "admin@example.com", "name": "Admin", "role": "admin" },
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_at": 1713100000
  }
}
```

### POST /auth/register (Public)

```json
// Request
{ "email": "staff@example.com", "password": "password123", "name": "Staff User", "role": "staff" }

// Response
{ "data": { "id": "uuid", "email": "staff@example.com", "name": "Staff User", "role": "staff" } }
```

### POST /auth/token/refresh (Public)

```json
// Request
{ "refresh_token": "eyJ..." }

// Response
{ "data": { "access_token": "eyJ...", "refresh_token": "eyJ...", "expires_at": 1713100000 } }
```

### POST /auth/logout

```json
// Response
{ "data": null }
```

---

## Events

### POST /events (Admin)

```json
// Request
{
  "name": "Wedding Reception",
  "occasion_type": "wedding",
  "date": "2025-06-15",
  "venue_name": "Grand Hotel",
  "venue_address": "123 Main St",
  "contact_person": "John",
  "contact_phone": "9876543210",
  "notes": "VIP event",
  "assigned_to": "user-uuid"
}

// Response 201
{ "data": { "id": "uuid", "display_id": "EVT-48201", "name": "Wedding Reception", "status": "live", ... } }
```

### GET /events?status=live&occasion_type=wedding&page=1&page_size=20 (All)

```json
// Response
{
  "data": [...],
  "meta": { "page": 1, "page_size": 20, "total": 15, "total_pages": 1 }
}
```

Status values: `live` (default), `hold`, `finished`, `over`

### GET /events/:id (All)

Accepts UUID or display ID (e.g. `EVT-48201`).

### PATCH /events/:id (Admin)

Updates event fields and/or status. Status transitions: `live` → `hold`/`finished`, `hold` → `live`/`finished`.

```json
// Request (fields or status or both)
{ "status": "hold" }
```

### DELETE /events/:id (Admin)

Returns `204 No Content`.

---

## Event Products

### POST /events/:id/products (Admin, Staff)

```json
// Request
{ "product_id": "uuid", "quantity": 10, "unit": "bunch", "price": 500 }
```

### GET /events/:id/products?page=1&page_size=20 (All)

### PATCH /events/:id/products/:eventProductId (Admin, Staff, Staff Member)

Staff Member can only update `quantity` and `unit`.

### DELETE /events/:id/products/:eventProductId (Admin, Staff)

Returns `204 No Content`.

### GET /events/:id/products/summary (All)

```json
// Response
{
  "data": [
    { "category": "Flowers", "totals": [{ "unit": "bunch", "quantity": 25 }] },
    { "category": "Lighting", "totals": [{ "unit": "set", "quantity": 4 }] }
  ]
}
```

---

## Categories

### POST /categories (Admin, Staff)

```json
// Request
{ "name": "Flowers" }
```

### GET /categories?page=1&page_size=20 (All)

### PATCH /categories/:id (Admin, Staff)

### DELETE /categories/:id (Admin, Staff)

Returns `204 No Content`. Fails if active products exist in category.

### POST /categories/seed (Admin)

Seeds default categories. Disabled in production.

---

## Products

### POST /products (Admin, Staff)

```json
// Request
{ "name": "Roses", "category_id": "uuid", "default_unit": "bunch", "price": 500, "description": "Red roses" }
```

### GET /products?category_id=uuid&page=1&page_size=20 (All)

### PATCH /products/:id (Admin, Staff)

Use `{ "is_active": false }` to deactivate. Fails if product is in a live event.

### POST /products/seed (Admin)

Seeds default products. Disabled in production.

---

## Users

### POST /users (Admin)

```json
// Request
{ "email": "new@example.com", "password": "password123", "name": "New User", "role": "staff" }
```

Cannot create admin users.

### GET /users?page=1&page_size=20 (Admin)

### GET /users/:id (Admin)

### PATCH /users/:id (Admin)

```json
// Request
{ "name": "Updated Name", "role": "staff_member", "is_active": true }
```

Use `{ "is_active": true/false }` to activate/deactivate.

### DELETE /users/:id (Admin)

Soft delete (deactivate). Add `?permanent=true` for hard delete from auth and database. Cannot delete yourself.

Returns `204 No Content`.

---

## Audit

### GET /audit?entity_type=Event&action=create&page=1&limit=50 (Admin)

Add `&format=csv` to export as CSV.

### GET /audit/:id (Admin)

---

## Health

### GET /health (Public)

```json
// Response
{ "status": "ok", "timestamp": "2025-06-15T10:00:00.000Z", "uptime": 3600 }
```

---

## API Table

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | /auth/login | Public | Login |
| POST | /auth/register | Public | Register |
| POST | /auth/token/refresh | Public | Refresh token |
| POST | /auth/logout | Auth | Logout |
| POST | /events | Admin | Create event |
| GET | /events | All | List events |
| GET | /events/:id | All | Get event |
| PATCH | /events/:id | Admin | Update event / change status |
| DELETE | /events/:id | Admin | Delete event |
| POST | /events/:id/products | Admin, Staff | Add product to event |
| GET | /events/:id/products | All | List event products |
| PATCH | /events/:id/products/:pid | All roles | Update event product |
| DELETE | /events/:id/products/:pid | Admin, Staff | Remove event product |
| GET | /events/:id/products/summary | All | Category totals |
| POST | /categories | Admin, Staff | Create category |
| GET | /categories | All | List categories |
| PATCH | /categories/:id | Admin, Staff | Update category |
| DELETE | /categories/:id | Admin, Staff | Delete category |
| POST | /categories/seed | Admin | Seed categories |
| POST | /products | Admin, Staff | Create product |
| GET | /products | All | List products |
| PATCH | /products/:id | Admin, Staff | Update / deactivate product |
| POST | /products/seed | Admin | Seed products |
| POST | /users | Admin | Create user |
| GET | /users | Admin | List users |
| GET | /users/:id | Admin | Get user |
| PATCH | /users/:id | Admin | Update user / activate / deactivate |
| DELETE | /users/:id | Admin | Delete user (soft or ?permanent=true) |
| GET | /audit | Admin | List audit logs (or ?format=csv to export) |
| GET | /audit/:id | Admin | Get audit log |
| GET | /health | Public | Health check |
