# Milestone 7: Partners (Wealth Managers)

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1–6

## Goal

Implement Partners — Wealth Manager management with onboarding, status toggling, wallet, packages, sub-team, and tagged customers.

## Overview

Wealth Managers are channel partners (external) who buy will packages and serve their clients with those credits. Admins onboard new WMs, track package usage (`willsRemaining`, `willsUsed`), manage wallet transactions (purchases and consumption), view their sub-teams, and see all customers tagged to them.

**Key Functionality:**
- KPI badges: Total Sales, Active WMs, Wills Remaining.
- Filterable WM list (search, tier, status) with ON/OFF activation toggle.
- Multi-section add/edit form: Basic, Address, Company (GST/PAN/bank), Permissions, Package selection.
- 5-tab detail: Follow-ups, Wallet, Team, Customers, Packages.
- Wallet timeline shows both `package_purchase` and `will_used` transactions.
- Auto-generated `PAT-XXXXX` IDs.

## Recommended Approach: Test-Driven Development

See `product-plan/sections/partners/tests.md` for onboarding, status toggle, wallet integrity, and tier-filter tests.

## What to Implement

### Components

Copy from `product-plan/sections/partners/components/`:
- `WMList.tsx`
- `WMDetail.tsx`
- `AddWMForm.tsx`
- `index.ts`

### Data Layer

Tables: `wealth_managers`, `wm_packages`, `wm_wallet_transactions`, `wm_team_members`, `wm_follow_ups`. Customers are joined via the existing `customers` table.

Business rules:
- `willsRemaining` and `willsUsed` are derived from `wm_packages` and `wallet_transactions`; never let them go out of sync.
- Deactivating a WM hides it from "assignable Wealth Manager" dropdowns in Sales CRM but keeps it in historical reports.
- Package status transitions: `active` → `exhausted` (when `willsRemaining === 0`) or `expired` (when `expiresAt < now`).

### Callbacks

- `onToggleStatus(id)` — Flip active/inactive with confirm.
- `onAddFollowUp` / `onAddTeamMember` — Append entries.
- `onViewCustomer(customerId)` — Route into Customers.

### Empty States

- No WMs: list shows `+ Add Partner` CTA.
- WM detail with no packages/team/customers/wallet: each tab shows its own empty state.

## Files to Reference

- `product-plan/sections/partners/README.md`
- `product-plan/sections/partners/tests.md`
- `product-plan/sections/partners/components/`
- `product-plan/sections/partners/types.ts`
- `product-plan/sections/partners/sample-data.json`

## Expected User Flows

### Flow 1: Onboard a Partner
1. `+ Add Partner` → fill all four form sections → pick package tier → submit.
2. WM appears with `PAT-XXXXX` ID, default `active` status, and a Package row.

### Flow 2: Deactivate a Partner
1. Toggle inactive → confirm.
2. WM no longer appears in Sales CRM's WM dropdown.
3. WM still shows in Reports → WM Performance.

### Flow 3: Will Consumption
1. A customer tagged to the WM consumes a will (handled in Case Management).
2. A `will_used` transaction is created in this WM's wallet.
3. `willsRemaining` decrements; if it hits 0, package becomes `exhausted`.

## Done When

- [ ] Tests pass.
- [ ] `PAT-XXXXX` IDs are unique.
- [ ] Wallet integrity is maintained under concurrent updates (test with simultaneous "consume will" operations).
- [ ] Status toggle persists and propagates to all dependent dropdowns.
- [ ] Package status transitions correctly on expiry and exhaustion.
- [ ] All 5 detail tabs surface scoped data.
- [ ] Empty states render per tab.
- [ ] Responsive on mobile.
