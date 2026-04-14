# API Reference

Base URL: `http://localhost:3002`

## Authentication

All endpoints except those marked **Public** require a Bearer token.

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
  "success": true,
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
{ "success": true, "data": { "id": "uuid", "email": "staff@example.com", "name": "Staff User", "role": "staff" } }
```

### POST /auth/refresh (Public)

```json
// Request
{ "refresh_token": "eyJ..." }

// Response
{ "success": true, "data": { "access_token": "eyJ...", "refresh_token": "eyJ...", "expires_at": 1713100000 } }
```

### POST /auth/logout (Public)

```json
// Response
{ "success": true }
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

// Response
{ "success": true, "data": { "id": "uuid", "display_id": "EVT-48201", "name": "Wedding Reception", "status": "live", ... } }
```

### GET /events?tab=live&occasionType=wedding&page=1&pageSize=20 (All)

```json
// Response
{ "success": true, "data": [...], "total": 15, "page": 1, "pageSize": 20, "totalPages": 1 }
```

Tab values: `live` (default), `hold`, `finished`, `over`

### GET /events/:id (All)

Accepts UUID or display ID (e.g. `EVT-48201`).

### PUT /events/:id (Admin)

### PATCH /events/:id/close (Admin)

```json
// Request
{ "status": "hold" }
```

Valid transitions: `live` -> `hold`/`finished`, `hold` -> `live`/`finished`

### DELETE /events/:id (Admin)

---

## Event Products

### POST /events/:id/products (Admin, Staff)

```json
// Request
{ "product_id": "uuid", "quantity": 10, "unit": "bunch", "price": 500 }
```

### GET /events/:id/products?page=1&pageSize=20 (All)

### PUT /events/:id/products/:eventProductId (Admin, Staff, Staff Member)

Staff Member can only update `quantity` and `unit`.

```json
// Request
{ "quantity": 15, "unit": "kg" }
```

### DELETE /events/:id/products/:eventProductId (Admin, Staff)

### GET /events/:id/category-summary (All)

```json
// Response
{
  "success": true,
  "data": [
    { "category": "Flowers", "totals": [{ "unit": "bunch", "quantity": 25 }] },
    { "category": "Lighting", "totals": [{ "unit": "set", "quantity": 4 }] }
  ]
}
```

---

## Catalog

### POST /catalog/categories (Admin, Staff)

```json
// Request
{ "name": "Flowers" }
```

### GET /catalog/categories?page=1&pageSize=20 (All)

### GET /catalog/categories/:id (All)

### PUT /catalog/categories/:id (Admin, Staff)

### DELETE /catalog/categories/:id (Admin, Staff)

Fails if active products exist in category.

### POST /catalog/products (Admin, Staff)

```json
// Request
{ "name": "Roses", "category_id": "uuid", "default_unit": "bunch", "price": 500, "description": "Red roses" }
```

### GET /catalog/products?page=1&pageSize=20 (All)

### GET /catalog/products/category/:categoryId?page=1&pageSize=20 (All)

### GET /catalog/products/:id (All)

### PUT /catalog/products/:id (Admin, Staff)

### POST /catalog/products/:id/deactivate (Admin, Staff)

Fails if product is in a live event.

### DELETE /catalog/products/:id (Admin, Staff)

Hard delete. Fails if product is in any event.

### POST /catalog/seed/categories (Admin)

### POST /catalog/seed/products (Admin)

---

## Users

### POST /users (Admin)

```json
// Request
{ "email": "new@example.com", "password": "password123", "name": "New User", "role": "staff" }
```

Cannot create admin users.

### GET /users?page=1&pageSize=20 (Admin)

### GET /users/:id (Admin)

### PUT /users/:id (Admin)

```json
// Request
{ "name": "Updated Name", "role": "staff_member" }
```

Cannot change admin role.

### DELETE /users/:id (Admin)

Soft delete (deactivate).

### POST /users/:id/activate (Admin)

### DELETE /users/:id/permanent (Admin)

Hard delete from auth and database. Cannot delete yourself.

---

## Audit

### GET /audit?entity_type=Event&action=create&user_id=uuid&date_from=2025-01-01&date_to=2025-12-31&page=1&limit=50 (Admin)

### GET /audit/:id (Admin)

### POST /audit/export (Admin)

```json
// Request (filters, all optional)
{ "entity_type": "Event", "action": "create" }

// Response
{ "success": true, "data": [...], "filename": "audit_logs_2025-06-15.csv" }
```

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
| POST | /auth/refresh | Public | Refresh token |
| POST | /auth/logout | Public | Logout |
| POST | /events | Admin | Create event |
| GET | /events | All | List events |
| GET | /events/:id | All | Get event |
| PUT | /events/:id | Admin | Update event |
| PATCH | /events/:id/close | Admin | Change event status |
| DELETE | /events/:id | Admin | Delete event |
| POST | /events/:id/products | Admin, Staff | Add product to event |
| GET | /events/:id/products | All | List event products |
| PUT | /events/:id/products/:eventProductId | Admin, Staff, SM | Update event product |
| DELETE | /events/:id/products/:eventProductId | Admin, Staff | Remove event product |
| GET | /events/:id/category-summary | All | Category totals |
| POST | /catalog/categories | Admin, Staff | Create category |
| GET | /catalog/categories | All | List categories |
| GET | /catalog/categories/:id | All | Get category |
| PUT | /catalog/categories/:id | Admin, Staff | Update category |
| DELETE | /catalog/categories/:id | Admin, Staff | Delete category |
| POST | /catalog/products | Admin, Staff | Create product |
| GET | /catalog/products | All | List products |
| GET | /catalog/products/category/:categoryId | All | Products by category |
| GET | /catalog/products/:id | All | Get product |
| PUT | /catalog/products/:id | Admin, Staff | Update product |
| POST | /catalog/products/:id/deactivate | Admin, Staff | Deactivate product |
| DELETE | /catalog/products/:id | Admin, Staff | Hard delete product |
| POST | /catalog/seed/categories | Admin | Seed categories |
| POST | /catalog/seed/products | Admin | Seed products |
| POST | /users | Admin | Create user |
| GET | /users | Admin | List users |
| GET | /users/:id | Admin | Get user |
| PUT | /users/:id | Admin | Update user |
| DELETE | /users/:id | Admin | Deactivate user |
| POST | /users/:id/activate | Admin | Re-activate user |
| DELETE | /users/:id/permanent | Admin | Permanently delete user |
| GET | /audit | Admin | List audit logs |
| GET | /audit/:id | Admin | Get audit log |
| POST | /audit/export | Admin | Export audit logs CSV |
| GET | /health | Public | Health check |
