# 🎯 Event Management System - Role-Based Access Control

> Complete implementation of auto-generated Event IDs, hierarchical event assignments, and role-based access control for your event management platform.

---

## 📚 Quick Navigation

- **🚀 [START HERE](SETUP_INSTRUCTIONS.md)** - Step-by-step setup guide
- **📖 [IMPLEMENTATION GUIDE](IMPLEMENTATION_GUIDE.md)** - Deep technical reference
- **⚡ [QUICK REFERENCE](QUICK_REFERENCE.md)** - API endpoints & permission matrix
- **📊 [VISUAL ARCHITECTURE](VISUAL_ARCHITECTURE.md)** - Diagrams & flowcharts
- **📦 [DELIVERABLES](DELIVERABLES_SUMMARY.md)** - What you're getting
- **🗄️ [DATABASE SCHEMA](002_event_assignment_and_id.sql)** - SQL migration
- **💻 [SOURCE CODE](#source-code-files)** - TypeScript implementation

---

## ✨ What You Get

### Core Features
```
✅ Auto-Generated Event IDs          (Format: EVT-001000, EVT-001001, ...)
✅ Event Assignment System            (Admin → Staff → Staff Members)
✅ Role-Based Access Control (RBAC)   (Multi-layer enforcement)
✅ Full Audit Trail                   (Complete change history)
✅ Permission Enforcement             (DB + API + Business Logic)
```

### Security
```
✅ Row-Level Security (RLS)           (Database-level enforcement)
✅ JWT Authentication                 (Token-based access)
✅ Role Guards                        (Controller-level validation)
✅ Business Logic Checks              (Service-level RBAC)
✅ Audit Logging                      (Track all changes)
```

---

## 🎭 Role Overview

### Admin Role
- **Full access** to all events
- **Create** new events with auto-generated IDs
- **Assign** events to staff or staff members
- **Manage** all event products
- **Control** event status transitions
- **View** complete audit logs

### Staff Role
- **View** only assigned events
- **Update** assigned events
- **Assign** staff members to their events
- **Manage** products on assigned events
- **No access** to other staff's events

### Staff Member Role
- **View** assigned events
- **Update** only quantity & unit fields
- **Limited** product management
- **No event creation** permissions
- **No direct** assignment capabilities

---

## 🗂️ What's Included

### Database Files
| File | Size | Purpose |
|------|------|---------|
| `002_event_assignment_and_id.sql` | 6.5 KB | Database schema migration |

### Backend Services
| File | Size | Purpose |
|------|------|---------|
| `event-assignment.service.ts` | 14 KB | Assignment business logic |
| `events.service.updated.ts` | 13 KB | Updated events service with RBAC |
| `events.controller.updated.ts` | 7.7 KB | API endpoints with assignments |
| `assign-event.dto.ts` | 775 B | Data validation DTOs |

### Documentation
| File | Size | Content |
|------|------|---------|
| `SETUP_INSTRUCTIONS.md` | 12 KB | Step-by-step implementation |
| `IMPLEMENTATION_GUIDE.md` | 15 KB | Complete technical reference |
| `QUICK_REFERENCE.md` | 9.9 KB | API & permission lookup |
| `VISUAL_ARCHITECTURE.md` | 29 KB | Diagrams & flowcharts |
| `DELIVERABLES_SUMMARY.md` | 12 KB | Overview of deliverables |
| `README.md` | This file | Complete overview |

---

## 🚀 Quick Start

### Prerequisites
- ✅ NestJS backend running
- ✅ PostgreSQL/Supabase database connected
- ✅ Node.js 16+ installed
- ✅ Admin access to database

### 5-Minute Setup

**1. Apply Database Migration**
```bash
# Via Supabase SQL Editor or psql
psql -h host -U user -d db -f 002_event_assignment_and_id.sql
```

**2. Update Events Module**
```typescript
// src/events/events.module.ts
import { EventAssignmentService } from './event-assignment.service';

@Module({
  providers: [EventsService, EventAssignmentService],
})
export class EventsModule {}
```

**3. Add New Service**
```bash
cp event-assignment.service.ts src/events/
cp assign-event.dto.ts src/events/dto/
```

**4. Update Services**
```bash
cp events.service.updated.ts src/events/events.service.ts
cp events.controller.updated.ts src/events/events.controller.ts
```

**5. Test**
```bash
npm run build
npm run start

# POST /events should return "event_id": "EVT-001000"
```

---

## 📊 Permission Matrix

|                          | Admin | Staff | Staff Member |
|--------------------------|:-----:|:-----:|:------------:|
| **View all events**      |  ✅   |  ❌   |     ❌       |
| **View own events**      |  ✅   |  ✅   |     ✅       |
| **Create event**         |  ✅   |  ❌   |     ❌       |
| **Update event**         |  ✅   |  ✅*  |     ❌       |
| **Close event**          |  ✅   |  ❌   |     ❌       |
| **Assign event**         |  ✅   |  ❌   |     ❌       |
| **Assign staff member**  |  ✅   |  ✅** |     ❌       |
| **Create product**       |  ✅   |  ✅*  |     ❌       |
| **Update product**       |  ✅   |  ✅*  |     ✅***    |
| **Delete product**       |  ✅   |  ✅*  |     ❌       |

- `*` = Only for assigned events
- `**` = Only to their events
- `***` = Only quantity & unit

---

## 🔌 API Endpoints

### Event Management (Admin)
```
POST   /events                        Create event
GET    /events                        List all events
GET    /events/:id                    Get event details
PUT    /events/:id                    Update event
PATCH  /events/:id/close              Change status
```

### Event Assignment (Admin)
```
POST   /events/:id/assign             Assign to staff/member
POST   /events/:id/unassign           Remove assignment
GET    /events/:id/assignments        View history
```

### Staff Management
```
GET    /events/assigned-to-me         My events (Staff/Member)
POST   /events/:id/staff-members/assign    Assign team member (Staff)
POST   /events/:id/staff-members/:id/unassign    Remove (Staff)
GET    /events/:id/staff-members      View team (All)
```

### Event Products (All)
```
POST   /events/:id/products           Add product
GET    /events/:id/products           List products
PUT    /events/:id/products/:rowId    Update product
DELETE /events/:id/products/:rowId    Remove product
GET    /events/:id/category-summary   Summary by category
```

---

## 💾 Database Changes

### New Columns in `events`
```sql
event_id TEXT UNIQUE              -- EVT-001000 format
assigned_to UUID                  -- Who it's assigned to
assigned_at TIMESTAMP             -- When assigned
assigned_by UUID                  -- Who assigned (admin)
```

### New Tables
```sql
event_assignments                 -- Complete audit trail
event_staff_members              -- Staff → Member assignments
```

### New View
```sql
events_with_assignments          -- Joined event + assignment data
```

---

## 🔐 Security Layers

### Layer 1: Database (Row-Level Security)
```sql
-- Users can only see/modify their assigned events
WHERE assigned_to = auth.uid() OR auth.jwt() ->> 'role' = 'admin'
```

### Layer 2: API Guards (Controller)
```typescript
@Roles(UserRole.ADMIN)            -- Enforce at controller level
@Roles(UserRole.STAFF)
@Roles(UserRole.STAFF_MEMBER)
```

### Layer 3: Business Logic (Service)
```typescript
if (user.role === 'staff' && event.assigned_to !== user.id) {
  throw new ForbiddenException('...')
}
```

### Layer 4: Authentication (JWT)
```
Authorization: Bearer <token>    -- Validate token signature
```

---

## 📈 Event Lifecycle

```
LIVE → HOLD → FINISHED
 │      │       │
 └──────┴───────┘
Admin can transition
(Requires ≥1 product LIVE→HOLD)
```

---

## 📖 Documentation Files

### For Setup & Implementation
- **SETUP_INSTRUCTIONS.md** - Follow this first! Step-by-step guide
- **IMPLEMENTATION_GUIDE.md** - Deep dive into architecture

### For Development & Reference
- **QUICK_REFERENCE.md** - API endpoints, responses, errors
- **VISUAL_ARCHITECTURE.md** - Diagrams, flowcharts, data flows

### For Understanding
- **DELIVERABLES_SUMMARY.md** - What you're getting and why
- **This README** - Overview and quick links

---

## 🧪 Testing Examples

### Create Event (Get Event ID)
```bash
curl -X POST http://localhost:3000/events \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wedding Reception",
    "occasion_type": "wedding",
    "date": "2024-05-15",
    "venue_name": "Grand Hall"
  }'

# Response includes:
# "event_id": "EVT-001000"
```

### Assign Event
```bash
curl -X POST http://localhost:3000/events/EVENT_UUID/assign \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assigned_to": "STAFF_UUID",
    "role_assigned": "staff"
  }'
```

### Get My Events (Staff)
```bash
curl http://localhost:3000/events/assigned-to-me \
  -H "Authorization: Bearer $STAFF_TOKEN"

# Only returns events assigned to this staff
```

---

## 🛠️ Technical Stack

```
Backend Framework:  NestJS
Language:          TypeScript
Database:          PostgreSQL (Supabase)
Authentication:    JWT
Authorization:     Role-based (RBAC)
ORM:               Supabase Client
Validation:        class-validator
```

---

## 📁 File Structure

```
src/events/
├── events.controller.ts          ← REPLACE with updated version
├── events.service.ts             ← REPLACE with updated version
├── events.module.ts              ← UPDATE with new service
├── event-assignment.service.ts   ← NEW FILE
├── dto/
│   ├── create-event.dto.ts
│   ├── assign-event.dto.ts       ← NEW FILE
│   ├── create-event-product.dto.ts
│   └── ...
└── ...

database/
├── migrations/
│   ├── 001_initial_schema.sql
│   └── 002_event_assignment_and_id.sql ← NEW MIGRATION
└── ...
```

---

## ⚠️ Important Notes

### Breaking Changes
- ✅ None! Fully backward compatible
- ✅ Existing events continue to work
- ✅ Can rollback if needed

### Prerequisites
- ✅ NestJS 9+ or 10+
- ✅ PostgreSQL 13+
- ✅ Node.js 16+
- ✅ Supabase or self-hosted PostgreSQL

### Performance
- ✅ New view optimized for queries
- ✅ Indexes on assignment lookups
- ✅ Efficient permission checks
- ✅ Minimal database overhead

---

## 🐛 Troubleshooting

### Event ID Not Generating
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'set_event_id_trigger';

-- Check sequence
SELECT nextval('event_id_seq');
```

### Staff Can't See Events
```sql
-- Verify assignment
SELECT assigned_to FROM events WHERE id = '...';

-- Check user role
SELECT role FROM users WHERE id = '...';
```

### Permission Errors
- Check user role in database
- Verify assignment is active
- Check event status (not finished)

For more troubleshooting, see **SETUP_INSTRUCTIONS.md**

---

## 📞 Support Resources

| Need | File |
|------|------|
| Setup help | SETUP_INSTRUCTIONS.md |
| API details | QUICK_REFERENCE.md |
| Technical deep-dive | IMPLEMENTATION_GUIDE.md |
| Visual explanations | VISUAL_ARCHITECTURE.md |
| Deployment checklist | DELIVERABLES_SUMMARY.md |
| Troubleshooting | SETUP_INSTRUCTIONS.md → Troubleshooting |

---

## ✅ Pre-Deployment Checklist

- [ ] Database migration applied
- [ ] All new files added
- [ ] Services updated
- [ ] TypeScript compiles
- [ ] Event creation returns event_id
- [ ] Admin can assign events
- [ ] Staff sees only assigned events
- [ ] Staff member permission limits working
- [ ] Audit logs created
- [ ] Tests passing

---

## 🎯 Next Steps

1. **Read**: Start with SETUP_INSTRUCTIONS.md
2. **Prepare**: Review your code structure
3. **Implement**: Follow step-by-step setup
4. **Test**: Verify with provided examples
5. **Deploy**: Use deployment checklist

---

## 📝 Summary

This implementation provides:
- ✅ Professional event ID system (EVT-001000 format)
- ✅ Hierarchical permission structure
- ✅ Complete audit trail
- ✅ Multi-layer security enforcement
- ✅ Production-ready code
- ✅ Comprehensive documentation

**Everything you need to implement a secure, scalable event management system.**

---

## 📄 License & Usage

This implementation is provided as-is for integration into your event management system.

---

## 🙋 Questions?

1. Check the relevant documentation file (see Quick Navigation above)
2. Search in QUICK_REFERENCE.md for your issue
3. Review IMPLEMENTATION_GUIDE.md for detailed explanations
4. Check SETUP_INSTRUCTIONS.md → Troubleshooting section

---

**Happy implementing! 🚀**

---

### Document Map

```
START → SETUP_INSTRUCTIONS.md
        ↓
UNDERSTAND → IMPLEMENTATION_GUIDE.md
        ↓
REFERENCE → QUICK_REFERENCE.md
        ↓
VISUALIZE → VISUAL_ARCHITECTURE.md
        ↓
DEPLOY → Use files provided & Checklist
```

**Last Updated**: April 11, 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅