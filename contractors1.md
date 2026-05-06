**ROLE:**
You are a senior full-stack engineer working with **Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, and Supabase**.

---

**PROJECT CONTEXT:**

* I have an Events module with:

  * Event New Page (Create Event)
  * Event Edit Page (Update Event)
  * Event Detail Page
* Contractors are currently mixed inside Event forms (bad UX)

---

**OBJECTIVE (FINAL STRUCTURE):**

Refactor the system to enforce **strict separation of concerns**:

### ✅ Final Separation

* **Event Edit**

  * Handles ONLY event-related fields
  * No contractor logic at all

* **Contractors**

  * Managed separately
  * Triggered via button
  * Uses dialog or dedicated UI

---

## 🔹 REQUIRED CHANGES

### 1. CLEAN EVENT PAGES

#### Event New Page:

* Remove ALL contractor-related:

  * Fields
  * State
  * Validation
  * API calls

#### Event Edit Page:

* Same cleanup as above
* Keep ONLY event data editing

---

### 2. ADD SEPARATE ACTION BUTTONS

On **Event Detail Page**:

Add two clearly separated buttons:

1. **"Edit Event"**

   * Navigates to event edit page

2. **"Manage Contractors"**

   * Opens contractors dialog

---

## 🔹 CONTRACTORS FLOW (SEPARATE MODULE)

### Trigger:

* Button → "Manage Contractors"

### UI:

* Dialog (shadcn/ui)

---

### Dialog Structure:

#### Header:

* "Contractors"

#### Global Fields:

* Works From (start date)
* Works To (end date)

---

### Contractors Table:

Each row includes:

* Contractor Name (Dropdown)

  * Source: Supabase → Manpower table

* Shift (Dropdown)

  * Day / Night

* Quantity (Input/Dropdown)

* Work Dates:

  * Start Date
  * End Date
  * Must be within global date range

---

## 🔹 DATA FLOW

### Fetch:

* Contractors from **Manpower (Supabase)**

### Save:

* Store in `event_contractors` table:

  * event_id
  * contractor_id
  * shift
  * quantity
  * start_date
  * end_date

---

## 🔹 VALIDATION

* No contractor dates outside global range
* Required:

  * contractor
  * shift
  * quantity > 0
* Prevent invalid submissions

---

## 🔹 OUTPUT REQUIREMENTS

Provide:

1. Refactored:

   * Event New Page
   * Event Edit Page (clean)

2. Event Detail Page:

   * Two buttons:

     * Edit Event
     * Manage Contractors

3. Contractors Dialog Component:

   * Full UI + logic

4. Supabase:

   * Fetch + Insert queries

5. TypeScript types

6. Clean modular structure

---

## 🔹 CONSTRAINTS

* Maintain existing event functionality
* No breaking changes
* Follow Tailwind v4 + shadcn best practices
* Keep UI clean and scalable

---

**FINAL GOAL:**
A clean system where:

* **Event Edit = only event data**
* **Contractors = fully separate, managed independently via dialog**


ASCii diagram of contractors dialog box for added
+-----------------------------------------------------------+
|                    CONTRACTORS                            |
+-----------------------------------------------------------+

  Manager: Contractor
  Actions: [Add] [Edit] [Remove]

+-----------------------------------------------------------+
|                 Universal Date Range                      |
|                                                           |
|   Works From: [ Start Date ]     Works End: [ End Date ]  |
+-----------------------------------------------------------+

+-----------------------------------------------------------+
| Date       | Contractor Name | Shift      | Quantity       |
+-----------------------------------------------------------+
| [Date]     | [Dropdown]      | [Day/Night]| [Qty]          |
| [Date]     | [Dropdown]      | [Day/Night]| [Qty]          |
| [Date]     | [Dropdown]      | [Day/Night]| [Qty]          |
+-----------------------------------------------------------+

                                   [ + Add Contractor Row ]

This improves UX, maintainability, and scalability.
