# Test Instructions: Reports & Analytics

## Overview

Most logic is read-only data display. Tests focus on date-range correctness, KPI delta math, chart prop integrity, and export callbacks.

---

## User Flow Tests

### Flow 1: Change Date Range

**Steps:** Pick preset `This Quarter`.

**Expected:**
- [ ] `onDateRangeChange({ start, end, preset: 'this-quarter' })` is called with correct ISO dates.
- [ ] KPI values refresh; prior-period values reflect the previous quarter.
- [ ] Charts re-render with the new range's data.

### Flow 2: Toggle Period Comparison

**Steps:** Turn the compare toggle off then on.

**Expected:**
- [ ] When OFF, KPI cards hide the prior-period value and `%` delta.
- [ ] When ON, KPI cards show prior-period value and the up/down/flat arrow matches the sign of `changePercent`.

### Flow 3: Tab Switching

**Steps:** Switch through Sales → Cases → Accounts → WM Performance → Documents.

**Expected:** Each tab renders its own KPI row, 2-column charts, and detailed table — no data leakage between tabs.

### Flow 4: Export

**Steps:** Click `Export Excel` on the Sales tab.

**Expected:** `onExportExcel('sales')` is called once. `Download All (PDF)` calls `onExportAll('pdf')`.

### Flow 5: Custom Date Range

**Steps:** Open the custom date picker; pick a start later than end.

**Expected:** UI prevents submission (or auto-swaps); no callback fires with invalid dates.

---

## Empty States

- [ ] Tab with no rows in its table: shows "No records for the selected period".
- [ ] KPI with `previousValue = 0` AND `value = 0`: `%` delta renders as `—`, not `NaN` or `Infinity`.
- [ ] Charts with no data: render an empty plot frame with "No data for this range".

---

## Edge Cases

- [ ] Very large numbers (`>1Cr`): currency formatter shortens correctly (₹1.2 Cr).
- [ ] Negative `changePercent`: down arrow + red color; positive: up arrow + green; zero: flat icon + neutral color.
- [ ] Across DST or year boundary: previous-period computation lines up correctly.

---

## Sample Test Data

```ts
const mockKpi: ReportKpi = {
  id: 'sales-total', label: 'Total Sales',
  value: 12500000, previousValue: 10800000,
  changePercent: 15.7, changeDirection: 'up',
  format: 'currency',
}
```
