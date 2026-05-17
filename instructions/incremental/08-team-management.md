# Milestone 8: Team Management

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1–7

## Goal

Implement Team Management — internal users with role-based access, the lawyers directory, and the employee HRMS, organized into a single 3-tab interface.

## Overview

Three tabs in one page: **Users & Roles** (internal staff with role assignments and a permissions matrix), **Lawyers Directory** (legal pros assignable to cases), and **Employees (HRMS)** (full HR records with KYC and bank details). Soft-delete semantics throughout.

**Key Functionality:**
- Users & Roles: 6 roles (Admin, Sales, Operations, Legal, Accounts, HR) with a read-only permission matrix.
- Lawyers Directory: profile, performance metrics, document upload tracking, availability badges.
- Employees (HRMS): multi-section onboarding form with KYC docs, bank details, address.

## Recommended Approach: Test-Driven Development

See `product-plan/sections/team-management/tests.md` for user, lawyer, and employee flow tests plus soft-delete behavior.

## What to Implement

### Components

Copy from `product-plan/sections/team-management/components/`:
- `TeamManagement.tsx` — Tabbed shell.
- `index.ts`

### Data Layer

Tables: `users`, `lawyers`, `lawyer_documents`, `employees`, `kyc_documents`, `role_permissions`. Treat `status='inactive'` as soft-deleted everywhere.

### Callbacks

The `TeamManagementProps` interface lists the full callback set: add/edit/toggle for each of users, lawyers, employees, plus `onUpdateLawyerAvailability` and `onViewLawyer/onViewEmployee`.

### Empty States

Each tab has its own empty state with a `+ Add` CTA.

## Files to Reference

- `product-plan/sections/team-management/README.md`
- `product-plan/sections/team-management/tests.md`
- `product-plan/sections/team-management/components/`
- `product-plan/sections/team-management/types.ts`
- `product-plan/sections/team-management/sample-data.json`

## Expected User Flows

### Flow 1: Add an Internal User
1. Users & Roles → `+ Add User` → fill form → save.
2. User appears with their role badge; permission matrix highlights their role column.

### Flow 2: Soft-Delete a User
1. Toggle inactive → confirm.
2. User stays visible with `inactive` badge but is excluded from active dropdowns elsewhere.

### Flow 3: Onboard an Employee
1. Employees → multi-section form → upload at least one KYC doc → save.
2. Record appears with `employeeId` and KYC pill indicators.

## Done When

- [ ] Tests pass.
- [ ] Soft-delete is the only deletion mode (no hard-delete anywhere).
- [ ] Permission matrix is read-only and reflects role → module mapping.
- [ ] Lawyer availability changes propagate to Case Management's lawyer dropdowns.
- [ ] KYC pill indicators show uploaded/pending correctly.
- [ ] Empty states render per tab.
- [ ] Responsive on mobile.
