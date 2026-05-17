# Milestone 3: Sales CRM

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation), Milestone 2 (Dashboard Home)

## Goal

Implement the Sales CRM section — lead management, follow-up timelines, quotation generation, and services catalog.

## Overview

Sales CRM owns the pipeline from lead entry to Accounts handoff. Sales users capture leads (tagged to a Wealth Manager), log follow-ups, generate quotations from the services catalog, send them via email or WhatsApp, and finally assign paid-intent leads to Accounts for payment confirmation.

**Key Functionality:**
- List and filter leads by status (8 stages), source, employee, WM, date.
- Create / edit / delete leads (soft-delete).
- Log follow-ups (update / meeting / quotation) with chronological timeline.
- Build quotations from catalog services, preview, send via email or WhatsApp.
- Manage services catalog (CRUD, active/inactive, pricing, TAT, document checklists).
- Bulk import (CSV/Excel) and export filtered lists.
- Assign-to-Accounts handoff.

## Recommended Approach: Test-Driven Development

See `product-plan/sections/sales-crm/tests.md` for detailed flow tests covering creation, follow-ups, quotations, filtering, services catalog, and empty states.

## What to Implement

### Components

Copy from `product-plan/sections/sales-crm/components/`:
- `LeadsList.tsx`
- `LeadDetail.tsx`
- `LeadForm.tsx`
- `QuotationBuilder.tsx`
- `ServicesCatalog.tsx`
- `index.ts`

### Data Layer

`SalesCRMProps` expects: `leads`, `followUps`, `quotations`, `services`, `wealthManagers`, `statusCounts`.

You'll need:
- A `leads` table with status, source, WM linkage, assignment.
- A `follow_ups` table polymorphic to `lead_id` or `case_id`.
- A `quotations` table with line items, totals, and a unique `reference_number`.
- A `services` catalog table (active/inactive, pricing, TAT, doc checklist).
- A `wealth_managers` table (or reference to Partners).

### Callbacks

| Callback | What to wire |
|---|---|
| `onCreateLead` / `onEditLead` / `onDeleteLead` | Open form / persist / soft-delete |
| `onAddFollowUp` | Persist a follow-up entry |
| `onCreateQuotation` | Open `QuotationBuilder` for a lead |
| `onSendQuotation(id, via)` | Send via email or WhatsApp; persist `sentAt`, `sentVia`; mint quotation `referenceNumber` |
| `onAssignToAccounts(id)` | Update lead status, create an entry in Accounts |
| `onImportLeads` / `onExportLeads` | CSV/Excel bulk operations |
| `onCreateService` / `onEditService` / `onToggleService` | Catalog CRUD |

### Empty States

- `leads = []` → "No leads yet" with `+ Add Lead` CTA.
- Follow-up timeline empty → "No follow-ups yet".
- Quotation history empty → "No quotations sent".
- Services catalog empty → "No services configured" CTA.

## Files to Reference

- `product-plan/sections/sales-crm/README.md`
- `product-plan/sections/sales-crm/tests.md`
- `product-plan/sections/sales-crm/components/`
- `product-plan/sections/sales-crm/types.ts`
- `product-plan/sections/sales-crm/sample-data.json`

## Expected User Flows

### Flow 1: Capture a New Lead
1. Click `+ Add Lead`.
2. Fill form; select a Wealth Manager (required).
3. Save → lead appears in `New` tab.

### Flow 2: Send a Quotation
1. Open lead detail → `Create Quotation`.
2. Add services, preview totals.
3. `Send via Email` → reference number generated, lead status → `Quotation Sent`.

### Flow 3: Hand Off to Accounts
1. From lead detail → `Assign to Accounts`.
2. Confirm dialog → status updates, Accounts entry appears in Accounts section.

## Done When

- [ ] Tests for primary flows pass.
- [ ] All 8 status tabs render with correct counts.
- [ ] Search debounces (~300ms) and combines with active tab filter.
- [ ] Lead creation requires a Wealth Manager.
- [ ] Follow-up timeline orders most-recent-first.
- [ ] Quotation totals auto-calculate; reference number is unique.
- [ ] Send via email and WhatsApp both work via your messaging providers.
- [ ] Bulk import / export round-trips data correctly.
- [ ] Assign-to-Accounts creates a corresponding entry in the Accounts section.
- [ ] Empty states render where applicable.
- [ ] Responsive on mobile.
