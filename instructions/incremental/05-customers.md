# Milestone 5: Customers

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1–4

## Goal

Implement the Customers section — central repository of converted customers with a list view and a tabbed detail view (Profile, Services, Cases, Documents, Payments, Follow-ups).

## Overview

Customers is read-mostly; most state changes originate elsewhere (Accounts converts leads; Case Management creates cases; documents are generated against cases; payments live in Accounts). This milestone is mostly wiring read queries.

**Key Functionality:**
- KPI cards: Total Customers, Active Cases, Services Availed, Revenue Generated.
- Searchable, filterable list (search, WM, service type, status, date range).
- 6-tab detail view that aggregates the customer's services, cases, documents, payments, and follow-ups.
- Send Quotation action that routes back through Accounts.

## Recommended Approach: Test-Driven Development

See `product-plan/sections/customers/tests.md` for tests focused on filtering, tab navigation, and tab-scoped data isolation.

## What to Implement

### Components

Copy from `product-plan/sections/customers/components/`:
- `CustomerList.tsx`
- `CustomerDetail.tsx`
- `index.ts`

### Data Layer

`CustomerDetailProps` aggregates: `customer`, `services`, `cases`, `documents`, `payments`, `followUps`, `wealthManager`. Implement these as joined queries scoped by `customerId`.

### Callbacks

- `onSendQuotation(id)` — Route into Accounts/Sales quotation builder for the customer.
- `onViewCase(caseId)` — Route to `/case-management/:id`.
- `onDownloadDocument(docId)` — Stream the file.

### Empty States

Per-tab empty states are critical because customers often have zero records in some tabs (e.g., no follow-ups yet).

## Files to Reference

- `product-plan/sections/customers/README.md`
- `product-plan/sections/customers/tests.md`
- `product-plan/sections/customers/components/`
- `product-plan/sections/customers/types.ts`
- `product-plan/sections/customers/sample-data.json`

## Expected User Flows

### Flow 1: Find a Customer
1. Search by name; filter by WM.
2. Open the matching customer.

### Flow 2: Review a Customer's Documents
1. Open customer → Documents tab.
2. Click Download on an `approved` document.
3. File downloads; entry shows last-downloaded timestamp (if your design supports it).

## Done When

- [ ] Filtering combines correctly (intersection, not union).
- [ ] All 6 detail tabs render scoped data without cross-customer leakage.
- [ ] Empty states render per tab when arrays are empty.
- [ ] `Send Quotation` routes correctly.
- [ ] Wealth Manager card surfaces partner contact details.
- [ ] Responsive on mobile.
