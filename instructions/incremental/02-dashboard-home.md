# Milestone 2: Dashboard Home

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

## Goal

Implement the admin Dashboard Home — the landing page with KPIs, charts, activity feed, pending items, and quick actions.

## Overview

Operations admins land here and want an at-a-glance picture of the platform's health. The page combines KPI cards across Sales, Cases, Customers, Partners, and Team, alongside trend charts, an activity feed, an SLA / pending-items panel grouped by severity, and 9 quick-action shortcuts to frequent flows.

**Key Functionality:**
- Date-range-filterable KPIs across sales, cases, customers, partners, and team.
- Activity feed of recent platform actions (latest 10–15).
- Pending items / SLA breaches grouped by severity.
- Quick action shortcuts that route into create flows.
- CSS-only chart placeholders (sales trend, case status, monthly revenue, conversion funnel).

## Recommended Approach: Test-Driven Development

See `product-plan/sections/dashboard-home/tests.md` for framework-agnostic test specs covering greeting behavior, quick-action routing, severity grouping, date-range correctness, and empty states.

## What to Implement

### Components

Copy from `product-plan/sections/dashboard-home/components/`:
- `DashboardHome.tsx` — Main overview component.
- `LoginPage.tsx` — (Already mounted in Milestone 1; no work here.)
- `index.ts` — Barrel export.

### Data Layer

`DashboardHomeProps` requires:
- `kpiStats: KpiStats` — aggregated metrics.
- `activityFeed: ActivityFeedItem[]` — latest activity entries.
- `pendingItems: PendingItem[]` — SLA alerts and overdue items.
- `salesTrend`, `caseStatusDistribution`, `monthlyRevenue`, `conversionFunnel` — chart data.
- `quickActions: QuickAction[]` — shortcut buttons.
- `user: DashboardUser` — current user for greeting.

You'll need:
- An aggregation query that fills `KpiStats` for the selected date range.
- A recent-activity stream (poll, websocket, or SSE).
- A query that surfaces overdue/SLA-breached entities grouped by severity.

### Callbacks

- `onDateRangeChange({ start, end, preset })` — Refetch KPIs/charts.
- `onQuickAction(actionId)` — Route based on `QuickAction.module`.
- `onActivityClick(entityType, entityId)` — Route to the entity's detail page.
- `onPendingItemClick(itemId)` — Open the relevant remediation flow.

### Empty States

The component handles its own empty states — make sure your backend can return:
- Empty `activityFeed`, `pendingItems`, and chart arrays without erroring.
- `KpiStats` with zeros (not `null`) when there's no data.

## Files to Reference

- `product-plan/sections/dashboard-home/README.md`
- `product-plan/sections/dashboard-home/tests.md`
- `product-plan/sections/dashboard-home/components/`
- `product-plan/sections/dashboard-home/types.ts`
- `product-plan/sections/dashboard-home/sample-data.json`

## Expected User Flows

### Flow 1: Land on Dashboard
1. User signs in and lands on `/dashboard-home`.
2. Page shows greeting, KPI cards, charts, activity feed, pending items, quick actions.

### Flow 2: Trigger Quick Action
1. User clicks `New Lead` quick action.
2. App routes to `/sales-crm` with the create-lead form open.

### Flow 3: Triage Pending Item
1. User clicks a critical SLA breach.
2. App routes to the case or lead that triggered the alert.

## Done When

- [ ] Tests for the flows above pass.
- [ ] `DashboardHome` renders with real data for a logged-in user.
- [ ] Date-range changes refetch and refresh all KPIs and charts.
- [ ] Activity feed updates in near-real-time (or refreshes on focus).
- [ ] All 9 quick actions route to the correct create screens.
- [ ] Pending items are grouped by severity, color-coded, and clickable.
- [ ] Empty states render when arrays are empty.
- [ ] Responsive on mobile (KPI cards in 2 columns, charts stack).
