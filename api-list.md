# Event Manager API Documentation

This document lists all available API endpoints for the Event Manager backend.

**Base URL**: `http://localhost:3002`

## Global Headers
For most endpoints (except public ones), the following headers are required:
- `Content-Type: application/json`
- `Authorization: Bearer <your_access_token>`

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/auth/login` | Log in and receive tokens | No |
| POST | `/auth/register` | Register a new admin user | No |
| POST | `/auth/refresh` | Get new access token | No |
| POST | `/auth/logout` | Sign out and clear session | No |

### Request Bodies
**POST `/auth/login`**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**POST `/auth/register`**
```json
{
  "email": "admin@example.com",
  "password": "password123",
  "name": "Admin User",
  "role": "admin"
}
```

**POST `/auth/refresh`**
```json
{
  "refresh_token": "your_refresh_token_string"
}
```

---

## 2. Event Management (`/events`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/events` | List events with filters | Yes |
| POST | `/events` | Create a new event | Admin |
| GET | `/events/:id` | Get event details (UUID or Display ID) | Yes |
| PUT | `/events/:id` | Update event (UUID or Display ID) | Admin |
| PATCH | `/events/:id/close` | Transition event (UUID or Display ID) | Admin |
| DELETE | `/events/:id` | Delete an event (UUID or Display ID) | Admin |
| GET | `/events/:id/products` | List assigned items (UUID or Display ID) | Yes |
| POST | `/events/:id/products` | Add item to event (UUID or Display ID) | Admin, Staff |
| PUT | `/events/:id/products/:rowId` | Update item quantity/unit | All Staff |
| DELETE | `/events/:id/products/:rowId` | Remove item from event | Admin, Staff |

### Request Bodies
**POST `/events`**
```json
{
  "name": "Grand Wedding Gala",
  "occasion_type": "wedding",
  "date": "2026-06-15",
  "venue_name": "Royal Palace Hall",
  "venue_address": "123 Elegance St, NY",
  "contact_person": "Jane Smith",
  "contact_phone": "+1234567890",
  "notes": "Premium floral setup required"
}
```

**PATCH `/events/:id/close`**
```json
{
  "status": "hold" 
}
// Allowed status: "live", "hold", "finished"
```

**POST `/events/:id/products`**
```json
{
  "product_id": "product-uuid",
  "quantity": 50,
  "unit": "bunch",
  "notes": "Fresh red roses"
}
```

---

## 3. Catalog & Products (`/catalog`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/catalog/categories` | List all categories | Yes |
| POST | `/catalog/categories` | Create new category | Admin, Staff |
| GET | `/catalog/products` | List all active products | Yes |
| POST | `/catalog/products` | Create new product | Admin, Staff |
| POST | `/catalog/products/:id/deactivate` | Soft-delete a product | Admin, Staff |
| POST | `/catalog/seed/categories` | Populate default categories | Admin |
| POST | `/catalog/seed/products` | Populate default products | Admin |

### Request Bodies
**POST `/catalog/categories`**
```json
{
  "name": "Flowers"
}
```

**POST `/catalog/products`**
```json
{
  "name": "Red Roses",
  "category_id": "category-uuid",
  "default_unit": "bunch",
  "price": 450,
  "description": "Standard Dutch Red Roses"
}
```

---

## 4. User Management (`/users`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/users` | List all team members | Admin |
| POST | `/users` | Invite/Create new user | Admin |
| PUT | `/users/:id` | Update user role/status | Admin |
| DELETE | `/users/:id` | Deactivate user account | Admin |

### Request Bodies
**POST `/users`**
```json
{
  "email": "staff@example.com",
  "password": "password123",
  "name": "Staff Member",
  "role": "staff"
}
// Roles: "admin", "staff", "staff_member"
```

---

## 5. Audit & Logs (`/audit`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/audit` | View paginated system logs | Admin |
| POST | `/audit/export` | Export logs filter results | Admin |

### Request Bodies
**POST `/audit/export`**
```json
{
  "email": "admin@example.com",
  "action": "CREATE_EVENT",
  "startDate": "2026-04-01",
  "endDate": "2026-04-30"
}
```
