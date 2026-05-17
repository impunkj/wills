# Dashboard Home

## Overview

The admin landing page — a comprehensive operational overview of the Wills24 platform. KPI cards across sales, cases, customers, partners, and team; visual charts; real-time activity feed; pending items / SLA alerts; quick action shortcuts. Date-range filterable.

## User Flows

- Glance at headline metrics filtered by a date range (Today, This Week, This Month, This Quarter, Custom).
- Scan the latest 10–15 activity feed entries.
- Triage SLA breaches, overdue follow-ups, pending approvals, upcoming deadlines.
- Trigger any of 9 quick-action shortcuts (Add Lead, Create Case, Create Quotation, Assign Lawyer, Add Partner, Process Payout, Generate Invoice, Upload Document, Schedule Follow-up).
- Read sales-trend, case-status, monthly-revenue, and conversion-funnel charts.

## Design Decisions

- Greeting header ("Good morning, [User]") with current date personalises the page.
- Pending/alerts panel is grouped by severity (critical → high → medium → low) so action priority is obvious.
- Activity feed entries are color-coded by entity type for quick scanning.
- Charts are CSS-only placeholder visualizations — replace with your charting library if needed.

## Data Used

**Section-level types:** `KpiStats`, `ActivityFeedItem`, `PendingItem`, `SalesTrendPoint`, `CaseStatusEntry`, `MonthlyRevenueEntry`, `ConversionFunnelStage`, `QuickAction`, `DashboardUser`. **From global model:** all entity types contribute to the aggregated stats.

## Components Provided

- `DashboardHome` — Single-page overview component.
- `LoginPage` — Standalone login screen (place at `/login` route).

## Callback Props

| Callback | Description |
|---|---|
| `onDateRangeChange` | Date range changes |
| `onQuickAction(actionId)` | A quick-action button is clicked — route based on `module` field |
| `onActivityClick(entityType, entityId)` | Activity feed row click |
| `onPendingItemClick(itemId)` | Pending item click |
