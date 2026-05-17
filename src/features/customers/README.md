# Customers

## Overview

Central repository of converted customers. List view with KPI summary; tabbed detail view across Profile, Services, Cases, Documents, Payments, and Follow-ups.

## User Flows

- View all converted customers with filters: Search, Wealth Manager, Service Type, Status, Date Range.
- View customer details across 6 tabs: Profile, Services, Cases, Documents, Payments, Follow-ups.
- Edit customer information.
- Send quotation for additional services (routed through Accounts).
- View linked cases, documents, payments, and interaction timeline.

## Design Decisions

- Customer ID format displayed as `W24-CUST-XXXXX` in monospace.
- Tabs are deep-linkable; the active tab survives a page refresh if your routing supports it.
- Wealth Manager card on the detail page surfaces the partner contact without a navigation hop.

## Data Used

**Section-level types:** `Customer`, `CustomerService`, `CustomerCase`, `CustomerDocument`, `CustomerPayment`, `CustomerFollowUp`, `WealthManager`, `KpiStats`, `StatusCounts`. **From global model:** `Customer`, `Case`, `CaseDocument`, `Payment`, `FollowUp`, `WealthManager`.

## Components Provided

- `CustomerList` — KPI cards + searchable/filterable table.
- `CustomerDetail` — Tabbed detail view (Profile, Services, Cases, Documents, Payments, Follow-ups).

## Callback Props

| Callback | Description |
|---|---|
| `onView` / `onEdit` | List actions |
| `onSendQuotation` | Send a quotation for additional services |
| `onViewCases` / `onViewDocuments` | Jump into the relevant detail tab |
| `onCreate` | Submit the new-customer form (rarely used; customers usually originate via Accounts conversion) |
| `onViewCase` | Jump to a case from the customer detail's Cases tab |
| `onDownloadDocument` | Download a generated document |
| `onBack` | Detail-view back navigation |
