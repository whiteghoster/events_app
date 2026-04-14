# FloraIndia: Master Project Documentation

This comprehensive document outlines the features, functionality, technical architecture, and design philosophy of the FloraIndia Event Management System.

---

## 🌟 Project Overview
FlowIndia is a premium, state-of-the-art Event Management System designed to handle complex event lifecycles, resource allocation, and team coordination with a modern, high-performance interface. 

It bridges the gap between creative event planning and rigorous administrative oversight, ensuring that every detail—from floral arrangements to staff assignments—is tracked and accountable.

---

## 🏗️ Core Product Features

### 1. Advanced Event Management
The central hub for event coordination, offering complete control over the event lifecycle.
- **Dynamic Event Dashboard**: Organizes events into **Live**, **Hold**, and **Finished** tabs with real-time total counts.
- **Micro-Filtering**: Filter events by cultural occasion types (Haldi, Mehendi, Wedding, etc.).
- **Premium Event Cards**: At-a-glance information including Client Name, Event ID, Venue (with automatic city extraction), and Staff Assignment.
- **Lifecycle Transitions**: Effortlessly move events between statuses to reflect real-world progress.

### 2. Staff Assignment & Coordination
- **Work Assignment**: Assign specific staff members to events directly within the workflow.
- **Role-Based Access**: Specialized views and permissions for **Admins**, **Staff**, and **Staff Members**.
- **Team Visibility**: Clear ownership of responsibility visible across the entire application.

### 3. Catalog & Product Allocation
- **Smart Product Assignment**: Add items from the global catalog with precise quantities and units.
- **Category Summary**: Automatic grouping of assigned products by category (Flowers, Lighting, etc.) for logistics planning.
- **Financial Tracking**: Real-time "Total Amount" calculation for every event.
- **Flexible Units**: Support for Kg, G, Pcs, Bunch, Dozen, and more.

### 4. Admin & Accountability
- **Audit Logs**: A complete trail of every creation, update, and deletion across the system.
- **Catalog Control**: Managed list of products, prices, and categories.
- **User Management**: Invite team members, assign roles, and manage system access.

---

## 🎨 Design System: "The Midnight Gala"
*Integrated from StitchMCP Project: projects/14516092160466570930*

### 🌓 Creative North Star
The system treats the interface as a curated, high-end digital environment where depth is created through light and atmospheric layering. We utilize high-contrast typography, intentional asymmetry, and a "glass-first" philosophy.

### 🎨 Color Palette
- **System Theme**: High-Performance Dark Mode.
- **Base Canvas**: Slate-inspired depth (#060e20).
- **Luminous Accent**: Vibrant Blue (#3B82F6) used in gradients.
- **Surface Hierarchy**: Depth achieved through "Nesting" rather than line-borders.

### 🖋️ Typography
- **Display & Headlines**: geometric precision using **Manrope**.
- **Body & Labels**: High-legibility **Inter**.
- **Pairing Strategy**: Large headlines paired with tiny, all-caps labels for a premium, editorial feel.

### 🎭 Visual Principles
- **No-Line Rule**: Boundaries are defined by background shifts and negative space, not solid borders.
- **Glassmorphism**: 60% opacity containers with 20px-40px backdrop blurs.
- **Ambient Lighting**: Center-diffused shadows with tinted opacities rather than harsh black drop-shadows.

---

## 📘 User Workflow Guide

### Creating and Managing an Event
1. **Initiation**: Start a "New Event." Enter core identity details (Name, Date, Category).
2. **Assignment**: Select a staff member from the "Assign Work To" dropdown.
3. **Logistics**: Add venue details. The system generates a display ID (e.g., `EVT-12345`) automatically.
4. **Resourcing**: Add products from the catalog. Use the "Category Summary" to verify quantities.
5. **Completion**: Use the "Finish" action to archive the event and lock it for auditing.

---

## 🛠️ Technical Architecture

### Stack Specification
- **Frontend**: Next.js 14+ (App Router), React, Lucide Icons.
- **Backend**: NestJS (Node.js framework), TypeScript, DTO-based validation.
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS).
- **Styling**: Vanilla CSS tokens integrated with custom layout logic.

### Data Model Logic
- **Events**: Central entity with relationships to `users` (assigned staff) and `event_products`.
- **Audit System**: Captures `OLD` and `NEW` JSON snapshots for every database mutation.
- **API Mapping**: Bi-directional mappers in `lib/api.ts` translate database snake_case to frontend camelCase while ensuring type safety.

---

## 🔌 API Reference Highlights

| Module | Purpose | Key Actions |
| :--- | :--- | :--- |
| **Auth** | Security | Login, Register (Admin), Refresh Token, Logout. |
| **Events** | Core Logic | List (Paginated), Create, Update, Close (Status), Delete. |
| **Catalog** | Inventory | Manage Categories, Manage Products, Seed Defaults. |
| **Users** | Team mgmt | List Staff, Update Roles, Delete / Deactivate. |
| **Audit** | Oversight | Read Logs, Filter by User/Action/Date. |

---

## 📁 Repository Structure
- `/frontend`: Next.js application, UI components, and API clients.
- `/backend`: NestJS services, controllers, and Supabase integrations.
- `/migrations`: Versioned SQL files for schema management.
- `/bruno-collection`: Pre-configured API testing collection.
