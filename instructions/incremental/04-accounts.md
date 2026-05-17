# Milestone 4: Accounts

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1–3 (Foundation, Dashboard Home, Sales CRM)

## Goal

Implement Accounts — payment confirmation, GST-compliant invoicing, lead-to-customer conversion, and the refund workflow with approval chain.

## Overview

Accounts is where Sales-CRM handoffs are turned into customers. The team verifies payments (NEFT, RTGS, IMPS, UPI, Cheque, Cash, Online Gateway), supports partial payments, generates Proforma and Tax Invoices with GST auto-determination, converts paid leads to customers with unique IDs, and runs refund requests through a multi-level approval chain (Requested → Pending Approval → Approved → Processed → Completed).

**Key Functionality:**
- KPI cards: Total PI Sent, Pending Amount, Received Payment, Quotations Sent.
- Status-tabbed list across `PI Sent`, `Payment Received`, `Invoice Sent`, `Subscription Enabled`.
- Payment recording with TDS and partial-payment support; auto receipt generation.
- GST auto-determination: CGST+SGST when buyer/seller states match, IGST otherwise.
- Lead-to-Customer conversion generating `W24-CUST-XXXXX` IDs.
- Refund workflow with multi-level approvals and auto-generated Credit Notes.
- Aging analysis on outstanding invoices.

## Recommended Approach: Test-Driven Development

See `product-plan/sections/accounts/tests.md` covering full and partial payments, conversion, GST determination, and the refund approval chain.

## What to Implement

### Components

Copy from `product-plan/sections/accounts/components/`:
- `AccountsList.tsx` — KPI cards + tabbed list.
- `RefundForm.tsx` — Refund initiation slide-over.
- `index.ts`

You'll also need to build (the props are in `types.ts` but no shipped component): a `PaymentForm` and an `InvoiceDetail` view. Implement them using the shapes in `PaymentFormProps` and `InvoiceDetailProps`.

### Data Layer

Tables needed: `account_entries`, `invoices` (with `gst_type`, `cgst`, `sgst`, `igst`, `tds`, `net_payable`), `payments` (with partial-payment ledger linking to one invoice), `refunds` (with status chain and approver attribution), `credit_notes`.

Business logic:
- On payment received with `amountReceived >= invoice.netPayable`, set invoice status `paid` and timestamp `paidAt`. Else `partial`.
- On conversion-to-customer, mint a `W24-CUST-XXXXX` ID, copy lead data, link `customerId` on the account entry, notify the Wealth Manager.
- GST type determined per-invoice: `customer.state === seller.state` ? `cgst-sgst` : `igst`.
- Refund status transitions are strictly ordered. On `approved`, mint a credit note number.

### Callbacks

- `onSendPI(id)` / `onSendInvoice(id)` — Mail/WhatsApp the document.
- `onRecordPayment(id)` → opens the payment form → on save, persist via `Omit<Payment, 'id' | 'receiptNumber' | 'createdAt'>`.
- `onInitiateRefund(paymentId)` — Opens `RefundForm`.
- `onConvertToCustomer(id)` — Mint Customer ID, finalize handoff.

### Empty States

- No entries: list shows empty state with no CTA (entries come from Sales CRM handoff).
- No payments on invoice: "No payments recorded" with `Record Payment` CTA.
- No refunds: "No refund requests".

## Files to Reference

- `product-plan/sections/accounts/README.md`
- `product-plan/sections/accounts/tests.md`
- `product-plan/sections/accounts/components/`
- `product-plan/sections/accounts/types.ts`
- `product-plan/sections/accounts/sample-data.json`

## Expected User Flows

### Flow 1: Record a Payment and Mark Invoice Paid
1. Open entry → `Record Payment`.
2. Fill amount = invoice total, mode = NEFT.
3. Save → receipt number generated, invoice → `paid`.

### Flow 2: Partial Payment
1. Same as above but amount < invoice total.
2. Invoice → `partial`; remaining balance visible.
3. Second `Record Payment` clears the balance.

### Flow 3: Convert Lead to Customer
1. Entry status is `payment-received` and `customerId` is null.
2. Click `Convert to Customer`.
3. New Customer record appears in Customers section with `W24-CUST-XXXXX` ID; account entry `customerId` populated.

### Flow 4: Refund a Payment
1. From invoice detail, click refund on a payment.
2. Fill type, amount, reason → status `requested`.
3. Approver approves → credit note generated.
4. Processor processes → operations completes.

## Done When

- [ ] All flow tests pass.
- [ ] Payment recording supports partial payments and updates invoice status correctly.
- [ ] GST type is auto-determined per invoice.
- [ ] Conversion mints `W24-CUST-XXXXX` IDs uniquely and links Wealth Manager.
- [ ] Refund chain enforces ordering; statuses are timestamped and attributed.
- [ ] Credit notes are GST-compliant and auto-generated on approval.
- [ ] Aging indicator colors update based on invoice `dueDate`.
- [ ] Empty states render where applicable.
- [ ] Responsive on mobile.
