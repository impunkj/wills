# Test Instructions: Partners

## Overview

Cover WM onboarding, status toggling, tier filtering, wallet integrity (credits never negative), and detail-tab data isolation.

---

## User Flow Tests

### Flow 1: Onboard a New WM

**Steps:** `+ Add Partner` → fill all four sections → pick `Silver` tier package → submit.

**Expected:**
- [ ] WM created with ID `PAT-XXXXX` and `silver` tier badge.
- [ ] Package appears under Packages tab with `willsRemaining = willsIncluded`.
- [ ] WMs `status` defaults to `active`.

### Flow 2: Activate/Deactivate

**Steps:** Toggle a WM off → confirm dialog → toggle back on.

**Expected:**
- [ ] Toggle persists across page reloads.
- [ ] An inactive WM cannot be assigned to new leads (verify with the Sales CRM Wealth Manager dropdown filter).
- [ ] Inactive WMs still surface in Reports → WM Performance (historical data).

### Flow 3: Wallet — Will Usage

**Setup:** WM has a Silver package with 5 wills remaining.

**Steps:** Simulate a customer consuming 1 will.

**Expected:**
- [ ] A `will_used` transaction appears with the customer's name.
- [ ] `willsUsed` increments to 1, `willsRemaining` decrements to 4.
- [ ] When `willsRemaining` hits 0, package status becomes `exhausted`.

### Flow 4: Tier Filter

**Steps:** Apply tier filter `Gold`.

**Expected:** Only Gold-tier WMs are listed; status tab counts reflect the filtered subset.

---

## Empty States

- [ ] No WMs: "No partners yet" with `+ Add Partner` CTA.
- [ ] WM with no follow-ups, packages, team members, or customers: each tab shows its own empty state.
- [ ] Wallet with no transactions: "No wallet activity yet" (not blank).

---

## Edge Cases

- [ ] Expired package: status shows `expired`; new wills consumed against this package are rejected.
- [ ] Two active packages: usage debits the older package first (verify your business rule).
- [ ] PAN/GST fields blank: form blocks submission with field-level errors.

---

## Sample Test Data

```ts
const mockWM: WealthManager = {
  id: 'PAT-00003', name: 'Rohit Verma',
  email: 'rohit@example.com', phone: '+91-99887',
  gender: 'male', dob: '1985-07-04', photoUrl: null,
  address: { country: 'India', state: 'Maharashtra', city: 'Mumbai',
    area: 'Bandra', address: '14 Linking Rd', pinCode: '400050' },
  company: { name: 'Verma Wealth', email: 'info@vermawealth.in',
    gstNumber: '27AAAAA0000A1Z5', panNumber: 'AAAAA0000A',
    bankName: 'HDFC', accountNumber: '00012345', ifscCode: 'HDFC0001',
    branch: 'Bandra' },
  tier: 'silver', status: 'active',
  willsRemaining: 18, willsUsed: 7,
  currentPackageTier: 'silver',
  currentPackageExpiresAt: '2027-04-01',
  totalSales: 350000, totalCustomers: 6, totalLeads: 14, activeCases: 3,
  permissions: ['leads','customers','cases'],
  dashboardVisibility: ['kpis','sales','customers'],
  joinedAt: '2026-01-15T09:00:00+05:30',
  lastActive: '2026-05-13T18:00:00+05:30',
}
```
