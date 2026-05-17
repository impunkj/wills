# Test Instructions: Accounts

Framework-agnostic specs. Adapt to your test runner.

## Overview

Accounts owns the lead-to-customer conversion, invoice generation with GST compliance, payment recording (including partial payments), and the multi-step refund workflow.

---

## User Flow Tests

### Flow 1: Record a Full Payment

**Setup:** An account entry exists with an open invoice. Buyer and seller states differ (so IGST applies).

**Steps:**
1. User opens the entry detail.
2. User clicks `Record Payment`.
3. Form pre-fills invoice date, total payable.
4. User fills: Received Date, Amount Received = invoice total, TDS = 0, Payment Mode = `NEFT`, Transaction Ref.
5. User clicks `Save`.

**Expected:**
- [ ] Payment is recorded; a receipt number is generated.
- [ ] Invoice status transitions `pending` → `paid`.
- [ ] Account entry status reflects payment received.
- [ ] Toast: "Payment recorded".

### Flow 2: Partial Payment

**Setup:** Same as above; amount received is 60% of invoice total.

**Expected:**
- [ ] Payment is recorded; balance shows the remaining 40%.
- [ ] Invoice status becomes `partial`.
- [ ] A second `Record Payment` action lets the user log the remaining amount.

### Flow 3: Convert Lead to Customer

**Setup:** An account entry has `payment-received` status with no `customerId`.

**Steps:** User clicks `Convert to Customer`; confirms.

**Expected:**
- [ ] A new Customer record is created with `W24-CUST-XXXXX` formatted ID.
- [ ] The account entry's `customerId` is populated.
- [ ] Wealth Manager linkage is carried over.
- [ ] Account entry status moves to `subscription-enabled` (or your equivalent).

### Flow 4: GST Auto-Determination

**Setup:** Two account entries — one where `customerState === sellerState`, one where they differ.

**Expected on `Send PI`:**
- [ ] Same-state invoice shows CGST + SGST line items.
- [ ] Different-state invoice shows a single IGST line.

### Flow 5: Refund Approval Chain

**Setup:** A payment exists.

**Steps:**
1. User initiates a refund: amount, type = `Partial`, reason.
2. Refund is created with status `requested`.
3. Approver opens it, clicks `Approve`.
4. Processor marks it `processed`.
5. Operations marks it `completed`.

**Expected:**
- [ ] Status transitions only in the documented order (no skipping).
- [ ] A Credit Note number is generated on approval.
- [ ] Each transition is timestamped and attributed.
- [ ] Rejected refunds cannot be processed.

---

## Empty States

- [ ] No account entries: list shows "No accounts entries yet" with no CTA (entries arrive from Sales CRM).
- [ ] No payments on an invoice: invoice detail shows "No payments recorded" with a `Record Payment` button.
- [ ] No refunds: refunds section reads "No refund requests" — not a blank panel.

---

## Edge Cases

- [ ] Over-payment attempt: amount received > balance → validation error.
- [ ] Same payment refunded twice: second refund is blocked.
- [ ] Invoice aging crosses thresholds (current → overdue → critical) and indicator colors update.

---

## Sample Test Data

```ts
const mockEntry: AccountEntry = {
  id: 'ACC-001', leadId: 'LD-0042', name: 'Anjali Mehta',
  phone: '+91-91234', email: 'anjali@example.com',
  company: 'Mehta Industries', designation: 'Director',
  city: 'Mumbai', state: 'Maharashtra',
  wealthManagerId: 'PAT-00003', wealthManagerName: 'Rohit V',
  quotationRef: 'QT-2026-00012', quotationAmount: 25000,
  serviceInterest: 'Will Drafting (Basic)', assignedEmployee: 'EMP-00012',
  status: 'pi-sent', piSentDate: '2026-05-10', notes: '',
  assignedAt: '2026-05-08T10:00:00+05:30', customerId: null,
}
```
