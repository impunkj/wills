# Reports & Analytics

## Overview

Tabbed reporting dashboard with five categories — Sales, Cases, Accounts, WM Performance, Documents. Each tab combines KPI summary cards, visual charts (bar / line / donut / funnel), and detailed data tables. Global date range selector with period comparison; export to Excel/PDF.

## User Flows

- Switch between report categories via tabs.
- Filter by date range presets (This Month, This Quarter, This Year, Custom) and toggle "Compare with previous period".
- Drill into Sales, Case, Accounts, WM Performance, and Documents views.
- Export current tab as Excel or PDF; or "Download All".

## Design Decisions

- Each tab follows the same layout: KPI row → 2-column chart grid → detailed table.
- Charts are CSS-only placeholder visualizations (Tailwind bars/segments/lines) so the design has no runtime chart-library dependency. Swap for your library of choice (Recharts, Chart.js, ECharts).
- KPI deltas show prior-period value and `%` change with an up/down/flat arrow.

## Data Used

**Section-level types:** `ReportKpi`, `DateRange`, `DateRangeConfig`, `FunnelStage`, `LeadSourceEntry`, `StatusSegment`, `TrendPoint`, `RevenueMonth`, `AgingBucket`, `WMSalesEntry`, `DocumentStatusMonth`, `TemplateBreakdownEntry`, and the per-tab row interfaces (`SalesTeamRow`, `LawyerPerformanceRow`, `ReceivableRow`, `WMPerformanceRow`, `DocumentStatusRow`).

## Components Provided

- `ReportsAnalytics` — Single-page tabbed reports view.

## Callback Props

| Callback | Description |
|---|---|
| `onDateRangeChange` | Triggered on preset or custom range change |
| `onCompareToggle` | Toggle period comparison |
| `onExportExcel(tab)` / `onExportPdf(tab)` | Export the current tab |
| `onExportAll(format)` | Export all tabs |
