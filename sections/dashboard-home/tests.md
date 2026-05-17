# Test Instructions: Dashboard Home

## Overview

Mostly read-only display, but with date-range filtering and many interactive entry points. Tests focus on accurate aggregations, severity grouping in pending items, and correct routing from quick actions.

---

## User Flow Tests

### Flow 1: Greeting and Date Display

**Setup:** Mock `user.name = 'Anjali'`.

**Expected:**
- [ ] Greeting changes based on local time ("Good morning/afternoon/evening, Anjali").
- [ ] Current date displays in human format ("Thursday, 14 May 2026").

### Flow 2: Quick Action Routes

**Steps:** Click each of the 9 quick actions.

**Expected:** `onQuickAction(actionId)` is called with the matching `id`. The implementation should route to the correct section/screen based on the action's `module` field.

### Flow 3: Activity Feed Click

**Steps:** Click an activity feed row.

**Expected:** `onActivityClick(entityType, entityId)` is called; routing should land on the relevant detail page (e.g., `entityType: 'lead'` → `/sales-crm/leads/:id`).

### Flow 4: Pending Item Triage

**Setup:** `pendingItems` contains 2 critical, 3 high, 5 medium, 1 low.

**Expected:**
- [ ] Items render grouped by severity, critical first.
- [ ] Each item uses its severity color: critical red, high amber, medium blue, low neutral.
- [ ] Clicking an item calls `onPendingItemClick(itemId)`.

### Flow 5: Date Range Change

**Steps:** Pick preset `Today`.

**Expected:** `onDateRangeChange({ start, end, preset: 'today' })` fires with ISO timestamps; KPI cards and charts refresh.

---

## Empty States

- [ ] No activity yet: feed shows "No recent activity — actions across the platform will appear here."
- [ ] No pending items: panel shows "All clear — no items need attention" (positive empty state, not blank).
- [ ] All zero KPIs: cards still render with `0` and the label; no NaN values.

---

## Edge Cases

- [ ] Activity feed with 100+ entries: list virtualizes or paginates without freezing.
- [ ] Pending item with past `dueDate` (already overdue): shows clear "Overdue by N days" indicator.
- [ ] Quick actions array shorter than 9: grid still renders without broken layout.

---

## Sample Test Data

```ts
const mockStats: KpiStats = {
  totalSales: 12500000, revenueThisMonth: 1200000, revenuePreviousMonth: 1050000,
  activeCases: 18, completedCases: 142, avgResolutionDays: 21,
  newLeads: 34, newLeadsPreviousMonth: 28,
  totalCustomers: 210, activePartners: 12, totalPartners: 18,
  willsRemaining: 75,
  activeTeamMembers: 14, totalTeamMembers: 17,
  tasksAssigned: 23, slaBreaches: 2, overdueFollowUps: 4,
  conversionRate: 38.5,
}
```
