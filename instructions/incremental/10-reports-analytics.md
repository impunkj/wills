# Milestone 10: Reports & Analytics

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1–9

## Goal

Implement Reports & Analytics — a tabbed reporting dashboard with five categories (Sales, Cases, Accounts, WM Performance, Documents), each with KPI cards, charts, detailed tables, and export.

## Overview

Cross-section reporting layer. Each tab follows the same layout: KPI row → 2-column chart grid → detailed table. A global date-range selector with period comparison drives every tab. Exports to Excel/PDF (per-tab and download-all).

**Key Functionality:**
- Date-range presets (This Month / Quarter / Year / Custom) and "Compare with previous period".
- Five tabs: Sales, Cases, Accounts, WM Performance, Documents.
- KPI cards show value, previous value, and percent change with directional arrows.
- CSS-only placeholder charts (Tailwind bars/segments/lines).
- Per-tab Excel and PDF exports plus a Download All option.

## Recommended Approach: Test-Driven Development

See `product-plan/sections/reports-analytics/tests.md` for date-range, KPI-delta, tab-switch, and export tests.

## What to Implement

### Components

Copy from `product-plan/sections/reports-analytics/components/`:
- `ReportsAnalytics.tsx`
- `index.ts`

### Data Layer

You'll need aggregation queries for each tab. The shipped components consume already-shaped view-model data (see `types.ts`). Compute on the server and ship as the tab-specific data interface (`SalesTabData`, `CasesTabData`, etc.).

For `compareWith` toggle, run the same aggregations against the prior-period date range and join.

### Callbacks

- `onDateRangeChange({ start, end, preset? })` — Refetch all tabs.
- `onCompareToggle(enabled)` — Refetch with/without prior-period.
- `onExportExcel(tab)` / `onExportPdf(tab)` / `onExportAll(format)` — Generate the file.

### Charts

The components ship CSS-only chart placeholders. Replace them with your charting library (Recharts, Chart.js, ECharts) only if you need richer interactivity — the placeholders are production-acceptable for read-only dashboards.

### Empty States

- Each tab with zero rows: "No records for the selected period".
- KPI with `value = 0 && previousValue = 0`: render `%` as `—`, not `NaN` or `Infinity`.

## Files to Reference

- `product-plan/sections/reports-analytics/README.md`
- `product-plan/sections/reports-analytics/tests.md`
- `product-plan/sections/reports-analytics/components/`
- `product-plan/sections/reports-analytics/types.ts`
- `product-plan/sections/reports-analytics/sample-data.json`

## Expected User Flows

### Flow 1: Switch Tabs and Export
1. User opens `/reports-analytics`.
2. Switches to `Cases` tab; KPIs and charts render for the default range.
3. Clicks `Export Excel` — file downloads.

### Flow 2: Compare with Previous Period
1. Toggle `Compare with previous period`.
2. KPI cards show previous value and percent delta.

### Flow 3: Custom Date Range
1. Pick a custom start and end.
2. All tabs refetch.

## Done When

- [ ] Tests pass.
- [ ] Date range correctly recomputes prior-period start/end (e.g., quarter-over-quarter, MoM).
- [ ] Compare toggle shows/hides delta UI without re-mounting cards.
- [ ] Exports produce well-formed Excel/PDF files matching the visible tab data.
- [ ] Empty states render where applicable.
- [ ] Responsive on mobile (KPI 2-col, charts stack, tables scroll horizontally).
