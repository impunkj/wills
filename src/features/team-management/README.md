# Team Management

## Overview

Unified section for managing internal users, lawyers, and employees with three tabs: **Users & Roles**, **Lawyers Directory**, **Employees (HRMS)**. Soft-delete semantics throughout (deactivate, never hard-delete).

## Tabs

### Users & Roles
- Searchable table of all internal users (Admin, Sales, Operations, Legal, Accounts, HR).
- Per-row: name, email, role, department, status, last login.
- Slide-over form to add/edit users.
- Role permissions matrix (read-only reference).

### Lawyers Directory
- Searchable lawyer directory with specialization, Bar Council ID, location, experience, availability, active cases, rating.
- Detail panel: profile, case assignments, performance metrics, uploaded documents (Bar Council Cert, ID Proof, Qualification Certs).
- Availability badges color-coded (Available green, On Leave amber, Overloaded red).

### Employees (HRMS)
- Employee directory with employee ID, name, department, designation, joining date, status.
- Multi-section add form: Basic Info, Company Details, Address, KYC Documents (Aadhaar/PAN/DL/Cancelled Cheque), Bank Details.

## Design Decisions

- Single screen with 3 tabs keeps internal admin work in one place.
- Status badges follow a consistent color convention across tabs.
- KYC upload indicators are pill badges (uploaded / pending) instead of separate columns.

## Data Used

**Section-level types:** `User`, `Lawyer`, `LawyerDocument`, `Employee`, `KycDocument`, `RolePermission`, `PermissionLevel`. **From global model:** `Employee`, `Lawyer`.

## Components Provided

- `TeamManagement` — Tabbed shell that hosts all three lists, forms, and the role matrix.

## Callback Props

| Callback | Description |
|---|---|
| `onAddUser` / `onEditUser` / `onToggleUserStatus` | Internal-user management |
| `onAddLawyer` / `onEditLawyer` / `onUpdateLawyerAvailability` / `onViewLawyer` | Lawyer management |
| `onAddEmployee` / `onEditEmployee` / `onToggleEmployeeStatus` / `onViewEmployee` | Employee management |
