# Test Instructions: Customers

## Overview

Customers is read-mostly. Most state changes originate from other sections (Accounts converts leads, Case Management creates cases, etc.). Tests focus on filtering, tab navigation, and accurate display of linked records.

---

## User Flow Tests

### Flow 1: Search and Filter

**Setup:** ≥10 customers across multiple WMs and service types.

**Steps:**
1. Type a name fragment in the search.
2. Apply the `Wealth Manager` filter.

**Expected:**
- [ ] Results match search AND filter intersection.
- [ ] KPI cards reflect the visible set (or remain global — match your spec; document the choice).
- [ ] "Clear filters" restores the full list.

### Flow 2: Navigate Detail Tabs

**Steps:** Open a customer; click each tab in turn.

**Expected:**
- [ ] All 6 tabs render: Profile, Services, Cases, Documents, Payments, Follow-ups.
- [ ] Each tab shows the customer-scoped records (no leaks from other customers).
- [ ] Empty tabs render their empty state (see below).

### Flow 3: Send Quotation for Repeat Service

**Steps:** From a customer's Services tab, click `Send Quotation`.

**Expected:** Routes into the Accounts/Sales quotation builder with the customer pre-selected.

### Flow 4: Download a Generated Document

**Steps:** Documents tab → click Download on an `approved` document.

**Expected:** `onDownloadDocument(docId)` is called with the correct ID; user gets the file.

---

## Empty States

- [ ] No customers: KPI cards still render with zeros; list shows "No customers yet". No CTA (customers come from Accounts conversion).
- [ ] Profile tab is always populated, but Services, Cases, Documents, Payments, Follow-ups should each show their own empty state when the array is `[]`.

---

## Edge Cases

- [ ] Customer with no Wealth Manager (data anomaly): WM card shows "Unassigned" without breaking.
- [ ] PAN field missing: detail screen renders without throwing.
- [ ] Customer with 0 active cases but historical completed cases: counters render correctly.

---

## Sample Test Data

```ts
const mockCustomer: Customer = {
  id: 'W24-CUST-00045', leadId: 'LD-0042', accountEntryId: 'ACC-001',
  name: 'Anjali Mehta', phone: '+91-9123', email: 'anjali@example.com',
  company: 'Mehta Industries', designation: 'Director',
  city: 'Mumbai', state: 'Maharashtra', address: '21 Marine Drive',
  dateOfBirth: '1980-04-12', pan: 'ABCDE1234F',
  wealthManagerId: 'PAT-00003', wealthManagerName: 'Rohit V',
  servicesAvailed: ['Will Drafting (Basic)'],
  activeCases: 1, totalCases: 2, totalPayments: 75000, pendingAmount: 0,
  status: 'active', convertedAt: '2026-04-22T14:10:00+05:30', notes: '',
}
```
