**ROLE:**
You are a senior full-stack developer skilled in **Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, React Hook Form, and Supabase**.

---

**PROJECT CONTEXT:**

* I have two main modules:

  1. **Team Tab → Manpower Section**

     * Contractors are created and stored in **Supabase**
     * This is the **source of truth** for contractor data

  2. **Events Module**

     * Each event has a **detail page**
     * Contractors must be assigned to events from the manpower list

---

**OBJECTIVE:**
Implement a **Contractors Assignment feature on the Event Details Page**.

---

## 🔹 FEATURE FLOW

### 1. Entry Button (Event Details Page)

* Add a button:

  * Label: **"Add Contractors"**
* On click → open a **Dialog (shadcn/ui)**

---

### 2. Dialog UI

#### Header:

* Title: **"Contractors"**

---

### 3. Universal Date Range (Global Constraint)

At the top of the dialog:

* `Works From` (Start Date)
* `Works To` (End Date)

👉 These define the **allowed date range for ALL contractors**

---

### 4. Contractors Table (Dynamic Form)

Inside the dialog, implement a **dynamic table form**:

#### Add Button:

* `"Add Contractor"` → adds new row

---

### 5. Each Contractor Row Fields:

1. **Contractor Name**

   * Dropdown (Select)
   * Data source:

     * Fetch from **Supabase → Manpower table**
   * Must dynamically render available contractors

---

2. **Shift**

   * Dropdown:

     * Day
     * Night

---

3. **Quantity**

   * Dropdown or number input
   * Represents number of contractor members

---

4. **Work Dates**

   * Start Date
   * End Date

👉 Constraint:

* These dates MUST be within:

  * `Works From` ≤ Contractor Dates ≤ `Works To`

---

### 6. Data Flow

#### Fetching:

* Contractors list should be fetched from:

  * Supabase (Manpower table)
* Use:

  * React Query OR server-side fetching

---

#### Saving:

* On submit:

  * Save contractor assignments linked to:

    * `event_id`
    * `contractor_id`
    * `shift`
    * `quantity`
    * `start_date`
    * `end_date`

---

### 7. Database Design (Supabase)

Ensure or suggest:

#### Tables:

**manpower**

* id
* name
* (existing fields)

**event_contractors**

* id
* event_id (FK)
* contractor_id (FK → manpower)
* shift (enum: day/night)
* quantity
* start_date
* end_date
* created_at

---

### 8. Validation Rules

* Contractor name is required
* Quantity > 0
* Shift required
* Dates must be:

  * Within universal range
  * Start ≤ End
* Prevent submission if invalid

---

### 9. UX Requirements

* Use **shadcn/ui components**
* Responsive UI
* Include:

  * Add row button
  * Delete row option
  * Loading state (while fetching contractors)
  * Error handling

---

### 10. Output Requirements

Provide:

1. Dialog Component (UI)
2. Dynamic Table Form Logic
3. Data Fetching (Supabase)
4. Insert Mutation (Supabase)
5. TypeScript Types
6. Validation logic
7. Clean and scalable code structure

---

**CONSTRAINTS:**

* Use Tailwind v4 compatible styling
* Avoid deprecated patterns
* Keep code modular and reusable

---

**GOAL:**
Allow users to **assign contractors (from manpower)** to an event with controlled date ranges, shifts, and quantities — fully integrated with Supabase backend.
