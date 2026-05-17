# Accounts

## Overview

Payment confirmation, GST-compliant invoicing, and the critical lead-to-customer conversion. Receives leads assigned from Sales CRM, verifies payments, generates Proforma and Tax Invoices, converts paid leads to customers with unique IDs, and runs refund workflows with multi-level approval.

## User Flows

- View leads assigned from Sales CRM with payment status and KPI summary.
- Record payments (NEFT, RTGS, IMPS, UPI, Cheque, Cash, Online Gateway) with TDS and partial-payment support.
- Convert a paid lead to a customer with auto-generated `W24-CUST-XXXXX` ID and Wealth Manager linkage.
- Generate Proforma Invoice / Tax Invoice with GST auto-determination (CGST+SGST vs IGST by buyer/seller state).
- Initiate refund with approval chain: Requested → Pending Approval → Approved → Processed → Completed.
- Auto-generate GST-compliant Credit Notes on refund approval.
- Generate repeat-service quotations for existing customers (routed back through Accounts).

## Design Decisions

- KPI cards at top expose pipeline-to-revenue health without leaving the page.
- Single status-tabbed list mirrors the operational stages an Accounts user moves through.
- Refund flow runs as its own slide-over to keep approval state out of the invoice screen.

## Data Used

**Section-level types:** `AccountEntry`, `Invoice`, `InvoiceLineItem`, `Payment`, `Refund`, `KpiStats`, `StatusCounts`. **From global model:** `Lead`, `Customer`, `Invoice`, `Payment`, `Refund`, `Service`.

## Components Provided

- `AccountsList` — KPI cards + status-tabbed table of account entries.
- `RefundForm` — Refund initiation slide-over with type, amount, and reason.

(Plus `PaymentForm` and `InvoiceDetail` referenced in the props; implement using the shapes in `types.ts` if not already shipped as components.)

## Callback Props

| Callback | Description |
|---|---|
| `onView` | Open the account entry detail |
| `onEdit` | Edit account entry data |
| `onFollowUp` | Log a follow-up |
| `onSendPI` | Send a Proforma Invoice |
| `onSendInvoice` | Send a Tax Invoice |
| `onRecordPayment` | Open the payment form |
| `onConvertToCustomer` | Convert a paid lead to a customer record |
