# Sales CRM

## Overview

Manages the complete sales pipeline from lead entry to accounts handoff: lead management with status tracking, follow-up and meeting workflows, quotation generation from a configurable services catalog, and assigning leads to Accounts for payment confirmation.

## User Flows

- Create a new lead with contact details, service interest, and mandatory Wealth Manager tagging.
- Log follow-ups (updates, meetings, quotations) with a chronological timeline.
- Generate quotations by selecting services from the catalog, previewing, and sending via email or WhatsApp.
- Filter and search leads by status, source, assigned employee, date range, and Wealth Manager.
- Import leads via CSV/Excel and export filtered lists.
- Assign a lead to Accounts (status becomes "Pending Payment").
- Manage the services catalog (CRUD service categories, sub-services, pricing, TAT, document checklists).

## Design Decisions

- Status tabs with count badges at the top of `LeadsList` make pipeline volume visible at a glance.
- Lead detail uses a chronological follow-up timeline; entries are typed (Update / Meeting / Quotation) with priority and author.
- Quotations carry a unique reference number generated client-side in the design; the backend should mint authoritative refs.

## Data Used

**Section-level types** (see `types.ts`): `Lead`, `FollowUp`, `Quotation`, `QuotationItem`, `Service`, `WealthManager`, `StatusCounts`.

**From global data model:** `Lead`, `Quotation`, `Service`, `FollowUp`, `WealthManager`.

## Visual Reference

See `screenshot.png` if present.

## Components Provided

- `LeadsList` — Status-tabbed table with search, filters, bulk actions, and import/export controls.
- `LeadDetail` — Tabbed profile with follow-ups timeline, meetings, quotation history, assign-to-accounts action.
- `LeadForm` — Multi-field form for capturing/editing lead info.
- `QuotationBuilder` — Service selection, quantity/pricing, preview, send via email/WhatsApp.
- `ServicesCatalog` — CRUD for service categories and sub-services.

## Callback Props (`SalesCRMProps`)

| Callback | Description |
|---|---|
| `onViewLead` | View a lead's detail page |
| `onEditLead` | Open the edit form for a lead |
| `onDeleteLead` | Remove a lead (soft-delete recommended) |
| `onCreateLead` | Open the create-lead form |
| `onImportLeads` | Trigger CSV/Excel import |
| `onExportLeads` | Export the current filtered list |
| `onAddFollowUp` | Add a follow-up entry on a lead |
| `onAssignToAccounts` | Hand off a lead to Accounts for payment confirmation |
| `onCreateQuotation` | Open the quotation builder for a lead |
| `onSendQuotation` | Send a quotation via email or whatsapp |
| `onCreateService` / `onEditService` / `onToggleService` | Manage the services catalog |
