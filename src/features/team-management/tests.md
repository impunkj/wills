# Test Instructions: Team Management

## Overview

Three tabs, each with its own list, add/edit form, and filter set. Tests cover tab switching, soft-delete behavior, and the role permissions matrix.

---

## User Flow Tests

### Flow 1: Add Internal User

**Steps:** Users & Roles tab → `+ Add User` → fill name, email, phone, role `Sales`, department → save.

**Expected:**
- [ ] User appears in the list with `Sales` role badge and `active` status.
- [ ] Permissions matrix highlights the row's role column.

### Flow 2: Deactivate (Soft Delete)

**Steps:** Toggle a user inactive.

**Expected:**
- [ ] User remains visible in the list but with `inactive` badge.
- [ ] User does not appear in assignment dropdowns elsewhere (Sales CRM assigned employee, etc.).
- [ ] Re-toggling restores the active state.
- [ ] No hard-delete option exists anywhere in the UI.

### Flow 3: Add Lawyer

**Steps:** Lawyers Directory tab → `+ Add Lawyer` → fill required fields → save.

**Expected:**
- [ ] Lawyer appears with default `Available` status.
- [ ] Lawyer becomes assignable from Case Management's lawyer dropdowns.

### Flow 4: Update Availability

**Steps:** Change a lawyer's availability to `Overloaded`.

**Expected:**
- [ ] Badge color changes to red.
- [ ] Lawyer is filtered out of the "Available lawyers" suggestions in Case Management's Find Lawyer tab.

### Flow 5: Onboard Employee (HRMS)

**Steps:** Employees tab → multi-section form → upload at least one KYC doc → save.

**Expected:**
- [ ] Employee record appears with `employeeId`.
- [ ] KYC pills show `uploaded` for the uploaded doc and `pending` for the rest.
- [ ] Bank details are stored (verify your backend masks the account number in display).

---

## Empty States

- [ ] Each tab has its own empty state with a clear `+ Add` CTA.
- [ ] Lawyer detail panel with no documents: shows "No documents uploaded" per category.
- [ ] Permissions matrix with no role data: render a clear "Roles not yet configured" message instead of an empty grid.

---

## Edge Cases

- [ ] Email collision when adding a user with an existing email: form blocks with a clear error.
- [ ] Lawyer with 0 ratings: rating cell renders "—" instead of `0 stars`.
- [ ] Employee with reporting manager who is later deactivated: the manager field still resolves to the (inactive) name.

---

## Sample Test Data

```ts
const mockUser: User = {
  id: 'U-001', name: 'Aditi Rao', email: 'aditi@example.com',
  phone: '+91-99999', role: 'sales', department: 'Sales',
  status: 'active', lastLogin: '2026-05-13T10:00:00+05:30',
  createdAt: '2026-01-10T09:00:00+05:30',
}

const mockLawyer: Lawyer = {
  id: 'LAW-007', name: 'Adv. R. Iyer', email: 'r.iyer@example.com',
  phone: '+91-99887', specialization: 'Wills & Trusts',
  barCouncilId: 'BC/2010/4521', location: 'Mumbai',
  experienceYears: 14, availability: 'available',
  activeCases: 2, totalCasesHandled: 87, successRate: 92,
  avgResolutionDays: 18, rating: 4.6,
  documents: [
    { type: 'Bar Council Certificate', status: 'uploaded', fileName: 'bc.pdf' },
    { type: 'ID Proof', status: 'uploaded', fileName: 'id.pdf' },
    { type: 'Qualification Certificate', status: 'pending', fileName: null },
  ],
}
```
