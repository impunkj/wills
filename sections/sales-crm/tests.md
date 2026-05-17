# Test Instructions: Sales CRM

Framework-agnostic test specs. Adapt to your test runner (Jest, Vitest, Playwright, Cypress, RSpec, etc.).

## Overview

The Sales CRM owns leads from entry through quotation and Accounts handoff. Tests should cover lead lifecycle, follow-up timeline behavior, quotation generation, and the assign-to-accounts flow.

---

## User Flow Tests

### Flow 1: Create a New Lead

#### Success Path

**Setup:** At least one Wealth Manager exists in the dropdown. User is on `/sales-crm`.

**Steps:**
1. User clicks the `+ Add Lead` button in the list header.
2. The `LeadForm` opens.
3. User fills: Name, Phone, Email, City, State, Company, Service Interest.
4. User selects a Wealth Manager from the dropdown (required).
5. User clicks `Save`.

**Expected:**
- [ ] New lead appears at the top of the list with status `New`.
- [ ] Success toast: "Lead created" (or your equivalent).
- [ ] Form closes.

#### Failure Path — Missing Wealth Manager

**Steps:**
1. User submits the form without choosing a Wealth Manager.

**Expected:**
- [ ] Inline error on the Wealth Manager field: "Wealth Manager is required".
- [ ] Form is not submitted; lead is not created.

#### Failure Path — Invalid Email

**Steps:** User enters `not-an-email` in the email field and submits.

**Expected:** Email field shows a validation error; submit is blocked.

---

### Flow 2: Log a Follow-Up

**Setup:** A lead exists. User is on the lead's detail page.

**Steps:**
1. User clicks the `Add Follow-up` button on the Follow-ups tab.
2. User selects type `Meeting`, fills Title, Notes, Priority `High`.
3. User clicks `Save`.

**Expected:**
- [ ] Follow-up entry appears at the top of the timeline.
- [ ] Entry shows: title, notes preview, `Meeting` type badge, `High` priority indicator, author name, timestamp ("just now").
- [ ] Lead's `Last Activity` in the list updates.

---

### Flow 3: Generate and Send a Quotation

**Setup:** A lead exists with status `New` or `Follow-up`. Services catalog has active services.

**Steps:**
1. User clicks `Create Quotation` from the lead's detail page.
2. `QuotationBuilder` opens with the lead pre-selected.
3. User picks 2 services and sets quantities.
4. Subtotal, tax, and total update live.
5. User clicks `Send via Email` (or `Send via WhatsApp`).

**Expected:**
- [ ] Quotation is created with a unique reference number.
- [ ] Lead's status updates to `Quotation Sent`.
- [ ] Quotation appears in the lead's quotation history.
- [ ] Toast: "Quotation sent via email" (or WhatsApp).

---

### Flow 4: Assign Lead to Accounts

**Setup:** A lead exists with status `Quotation Sent` or `Projected`.

**Steps:**
1. User opens the lead detail.
2. User clicks `Assign to Accounts`.
3. Confirmation dialog appears.
4. User confirms.

**Expected:**
- [ ] Lead's status changes to `Invoice Sent` (or `Pending Payment` depending on backend convention).
- [ ] Lead disappears from the `New` / `Follow-up` tabs and appears in `Invoice Sent` / handover tab.
- [ ] An entry is created in the Accounts section's account-entries list.

---

### Flow 5: Filter and Search Leads

**Setup:** At least 10 leads of mixed statuses, sources, and Wealth Managers.

**Steps:**
1. User types a partial name in the search field.
2. The list filters live after the debounce window (~300ms).
3. User opens the Status tab `Quotation Sent`.
4. Only matching leads remain.

**Expected:**
- [ ] List renders only the leads that match both the search and the active status tab.
- [ ] Status-tab badge counts reflect the unfiltered totals (search shouldn't change tab counts unless that's your design).
- [ ] Clearing the search restores the list.

---

### Flow 6: Manage Services Catalog

**Steps:**
1. User opens `ServicesCatalog`.
2. User clicks `+ Add Service`.
3. User fills Category, Name, Base Price, Tax Rate, Estimated TAT, and at least one document checklist item.
4. User saves.

**Expected:**
- [ ] New service appears in the catalog.
- [ ] Service is selectable in `QuotationBuilder` afterward.
- [ ] Toggling `isActive` removes it from QuotationBuilder selection without deleting historical references.

---

## Empty State Tests

### Primary — No Leads Yet

**Setup:** `leads = []`, `statusCounts.all = 0`.

**Expected:**
- [ ] List view shows a helpful empty state with heading like "No leads yet".
- [ ] CTA button: `+ Add Lead`.
- [ ] No broken table or blank screen.

### Filtered Empty State

**Setup:** Leads exist but the current search/filter matches none.

**Expected:** "No leads match your filters" message with a `Clear filters` action.

### Follow-up Timeline Empty State

**Setup:** A new lead has no follow-ups yet.

**Expected:** Timeline shows "No follow-ups yet — log the first interaction" with a CTA to add one.

### Services Catalog Empty State

**Setup:** No services have been created.

**Expected:** Catalog shows "No services configured" with a `+ Add Service` CTA. `QuotationBuilder` blocks send and prompts the admin to add at least one service.

---

## Component Interaction Tests

### `LeadsList`
- [ ] Each row shows: Lead ID, Source, Name/Phone/Email stacked, Company, WM name, Service Interest, Status badge, Last Activity (relative), Actions menu.
- [ ] Clicking the row's action `View` calls `onViewLead(id)`.
- [ ] Clicking `Assign to Accounts` calls `onAssignToAccounts(id)`.
- [ ] Pagination updates the visible page; selected tab persists.

### `LeadDetail`
- [ ] Follow-ups tab is selected by default.
- [ ] Tab switching does not lose unsaved follow-up draft content (test if your design preserves drafts).

### `QuotationBuilder`
- [ ] Removing all items disables `Send`.
- [ ] Tax recalculates when quantities change.

---

## Edge Cases

- [ ] Lead with 100+ follow-ups: timeline scrolls smoothly.
- [ ] Same lead opened in two tabs: status updates from one tab don't corrupt the other on revisit.
- [ ] Quotation reference uniqueness under concurrent creates.

---

## Sample Test Data

```ts
const mockLead: Lead = {
  id: 'LD-00001',
  source: 'Website',
  name: 'Priya Sharma',
  phone: '+91-9876543210',
  email: 'priya@example.com',
  address: '12 MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  pinCode: '560001',
  company: 'Sharma Holdings',
  designation: 'Director',
  serviceInterest: 'Will Drafting (Basic)',
  wealthManagerId: 'PAT-00001',
  wealthManagerName: 'Rohit Verma',
  assignedEmployee: 'EMP-00012',
  leadType: 'HNI',
  status: 'new',
  notes: '',
  lastActivity: '2026-05-10T09:24:00+05:30',
  createdAt: '2026-05-10T09:24:00+05:30',
}

const mockEmptyLeads: Lead[] = []
const mockEmptyStatusCounts: StatusCounts = {
  all: 0, new: 0, assigned: 0, 'follow-up': 0,
  'quotation-sent': 0, projected: 0, 'invoice-sent': 0, won: 0, lost: 0,
}
```
