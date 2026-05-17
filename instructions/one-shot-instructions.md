# Wills24 Admin — Complete Implementation Instructions

---

## About These Instructions

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Data model definitions (TypeScript types and sample data)
- UI/UX specifications (user flows, requirements, screenshots)
- Design system tokens (colors, typography, spacing)
- Test-writing instructions for each section (for TDD approach)

**What you need to build:**
- Backend API endpoints and database schema
- Authentication and authorization
- Data fetching and state management
- Business logic and validation
- Integration of the provided UI components with real data

**Important guidelines:**
- **DO NOT** redesign or restyle the provided components — use them as-is
- **DO** wire up the callback props to your routing and API calls
- **DO** replace sample data with real data from your backend
- **DO** implement proper error handling and loading states
- **DO** implement empty states when no records exist (first-time users, after deletions)
- **DO** use test-driven development — write tests first using `tests.md` instructions
- The components are props-based and ready to integrate — focus on the backend and data layer

---

## Test-Driven Development

Each section includes a `tests.md` file with detailed test-writing instructions. These are **framework-agnostic** — adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, RSpec, Minitest, PHPUnit, etc.).

**For each section:**
1. Read `product-plan/sections/[section-id]/tests.md`
2. Write failing tests for key user flows (success and failure paths)
3. Implement the feature to make tests pass
4. Refactor while keeping tests green

The test instructions include:
- Specific UI elements, button labels, and interactions to verify
- Expected success and failure behaviors
- Empty state handling (when no records exist yet)
- Data assertions and state validations

---

# Wills24 Admin — Product Overview

## Summary

Wills24 Admin is an internal operations dashboard by Lawyered that enables end-to-end management of estate planning services — including Wills, Trusts, and Succession Certificates — from lead acquisition through service delivery. It centralizes CRM, case management, accounts, legal document generation, and team operations into a single platform with role-based access for Admin, Sales, Operations, Legal, Accounts, and HR teams.

### Problems & Solutions

- **Fragmented lead-to-customer lifecycle:** A structured pipeline from lead entry through sales follow-ups, quotation generation, payment confirmation, and customer conversion — all tracked in one place with mandatory Wealth Manager tagging.
- **Manual legal document creation:** A guided, template-based document generation system automates Will and Trust creation with dynamic field mapping, version control, auto-save, and legal review workflows.
- **Unstructured case management:** A dedicated case management module with structured follow-ups, lawyer assignment, service-specific actions, chronological timelines, and lifecycle stage tracking.
- **Disconnected billing and accounts:** An integrated accounts module handles payment confirmation, GST-compliant invoicing, lead-to-customer conversion with unique IDs, and refund workflows with approval chains.
- **No centralized service catalog:** A configurable Services CMS manages all service categories, sub-services, pricing, TAT estimates, and document checklists.

## Planned Sections

1. **Dashboard Home** — Admin landing page with KPI widgets, activity feed, SLA alerts, and quick actions.
2. **Sales CRM** — Lead management, follow-ups, meetings, quotation generation, and services catalog.
3. **Accounts** — Payment confirmation, GST-compliant invoicing, lead-to-customer conversion, and refund workflows.
4. **Customers** — Customer records, detail views, services availed, documents, and payment history.
5. **Case Management** — Case creation, follow-up timelines, lawyer assignment, legal templates, automated document generation, and progress tracking.
6. **Partners** — Wealth Manager profiles, commissions, wallet, sub-partners, and performance tracking.
7. **Team Management** — Internal users and roles, lawyers directory, and HRMS for employee management.
8. **Lawyers Directory** — Standalone searchable directory of lawyers with profiles, availability, and case assignments.
9. **Reports & Analytics** — Sales, cases, accounts, and Wealth Manager performance dashboards with export.

## Data Model

Core entities: **Lead, Customer, Case, Quotation, Invoice, Payment, Service, Template, Document, FollowUp, WealthManager, WMPackage, Employee, Lawyer, Refund, WalletTransaction**.

See `data-model/README.md` for entity descriptions and relationships, and `data-model/types.ts` for TypeScript interfaces.

## Design System

**Colors:**
- Primary: `orange` (Tailwind palette)
- Secondary: `yellow`
- Neutral: `neutral`

**Typography:**
- Heading: DM Sans
- Body: DM Sans
- Mono: IBM Plex Mono

See `design-system/` for tokens, color usage, and font setup.

## Implementation Sequence

Build this product in milestones:

1. **Foundation** — Set up design tokens, data model types, routing, and application shell.
2. **Dashboard Home** — Admin landing page with KPIs, charts, activity feed, and quick actions.
3. **Sales CRM** — Lead pipeline, follow-ups, quotations, services catalog.
4. **Accounts** — Payment confirmation, invoicing, lead-to-customer conversion, refunds.
5. **Customers** — Customer list and tabbed detail view.
6. **Case Management** — Cases, follow-ups, lawyer assignment, documents.
7. **Partners** — Wealth Manager onboarding, wallet, packages, team, customers.
8. **Team Management** — Users & roles, lawyers directory, employees (HRMS).
9. **Lawyers Directory** — Searchable lawyer directory (reuses Team Management's lawyers tab).
10. **Reports & Analytics** — Tabbed reports across Sales, Cases, Accounts, WM Performance, Documents.

Each milestone has a dedicated instruction document in `instructions/`.

---


---

# Milestone 1: Foundation

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** None

---


## Goal

Set up the foundational elements: design tokens, the `_shared/` UI primitives, data model types, routing structure, and the application shell.

## What to Implement

### 1. Design Tokens

Apply the Wills24 Admin design system:

- See `product-plan/design-system/tokens.css` for CSS custom properties.
- See `product-plan/design-system/tailwind-colors.md` for the Tailwind color usage convention (primary `orange`, secondary `yellow`, neutral `neutral`).
- See `product-plan/design-system/fonts.md` for the Google Fonts setup (DM Sans, IBM Plex Mono).

The project uses **Tailwind CSS v4** (no `tailwind.config.js`). Add the Google Fonts `<link>` to your root HTML and the design-tokens CSS to your global stylesheet.

### 2. Shared UI Primitives

Section components import from `@/lib/...` and `@/components/ui/...`. Install them now so every later milestone has them:

- Copy `product-plan/_shared/lib/*` → `src/lib/`
- Copy `product-plan/_shared/components/ui/*` → `src/components/ui/`

Install the dependencies these primitives need:

```
npm install lucide-react clsx tailwind-merge @radix-ui/react-dialog sonner
```

(See `product-plan/_shared/README.md` for details and the alternative `@/shared` aliasing approach.)

### 3. Data Model Types

Create the canonical domain types:

- See `product-plan/data-model/types.ts` for interface definitions.
- See `product-plan/data-model/README.md` for entity descriptions and relationships.

Place these at `src/types/domain.ts` (or wherever your project's shared types live). Section-specific view-model types live in each section's `types.ts` — copy those alongside their components when you build the corresponding milestone.

### 4. Routing Structure

Create placeholder routes for each section so navigation works before the sections themselves are built:

- `/` or `/dashboard-home` → Dashboard Home (default landing)
- `/sales-crm` → Sales CRM
- `/accounts` → Accounts
- `/customers` → Customers
- `/case-management` → Case Management
- `/partners` → Partners
- `/team-management` → Team Management
- `/lawyers-directory` → Lawyers Directory
- `/reports-analytics` → Reports & Analytics
- `/login` → Login page (use `sections/dashboard-home/components/LoginPage.tsx`)

### 5. Application Shell

Copy the shell components into your project:

- `product-plan/shell/components/AppShell.tsx`
- `product-plan/shell/components/MainNav.tsx`
- `product-plan/shell/components/UserMenu.tsx`
- `product-plan/shell/components/index.ts`

Wire `AppShell` at the layout level:

```tsx
import { AppShell, type NavItem } from './shell/components'
import { useRouter, usePathname } from 'next/navigation'

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard-home' },
  { label: 'Sales CRM', href: '/sales-crm' },
  { label: 'Accounts', href: '/accounts' },
  { label: 'Customers', href: '/customers' },
  { label: 'Case Management', href: '/case-management' },
  { label: 'Partners', href: '/partners' },
  { label: 'Team Management', href: '/team-management' },
  { label: 'Lawyers Directory', href: '/lawyers-directory' },
  { label: 'Reports & Analytics', href: '/reports-analytics' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const navItems = NAV.map((n) => ({ ...n, isActive: pathname === n.href }))

  return (
    <AppShell
      navigationItems={navItems}
      user={{ name: currentUser.name, role: currentUser.role }}
      breadcrumbs={[/* derive from pathname or page metadata */]}
      onNavigate={(href) => router.push(href)}
      onLogout={() => signOut()}
    >
      {children}
    </AppShell>
  )
}
```

See `product-plan/shell/README.md` for full wiring details.

### 6. Login Page

Place `LoginPage` from `product-plan/sections/dashboard-home/components/LoginPage.tsx` at the `/login` route. Wire `onLogin` to your authentication flow.

## Files to Reference

- `product-plan/design-system/` — Design tokens, Tailwind color guide, fonts setup
- `product-plan/data-model/` — Type definitions and entity relationships
- `product-plan/_shared/` — Shared utilities and UI primitives
- `product-plan/shell/README.md` — Shell design intent
- `product-plan/shell/components/` — Shell React components

## Done When

- [ ] Tailwind v4 is set up and the design tokens / fonts are loaded.
- [ ] `_shared/lib/*` and `_shared/components/ui/*` are mounted under `@/lib` and `@/components/ui`.
- [ ] Domain types from `data-model/types.ts` exist in the codebase.
- [ ] Placeholder routes exist for all 9 sections plus `/login`.
- [ ] Shell renders with sidebar nav, top bar, breadcrumbs, and user menu.
- [ ] Navigation links route correctly; active nav item highlights in orange.
- [ ] User menu shows the current user's name/role and a Sign out action.
- [ ] `/login` route renders the provided `LoginPage`.
- [ ] App works in light and dark mode.

---

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

---

# Milestone 3: Sales CRM

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation), Milestone 2 (Dashboard Home)

## Goal

Implement the Sales CRM section — lead management, follow-up timelines, quotation generation, and services catalog.

## Overview

Sales CRM owns the pipeline from lead entry to Accounts handoff. Sales users capture leads (tagged to a Wealth Manager), log follow-ups, generate quotations from the services catalog, send them via email or WhatsApp, and finally assign paid-intent leads to Accounts for payment confirmation.

**Key Functionality:**
- List and filter leads by status (8 stages), source, employee, WM, date.
- Create / edit / delete leads (soft-delete).
- Log follow-ups (update / meeting / quotation) with chronological timeline.
- Build quotations from catalog services, preview, send via email or WhatsApp.
- Manage services catalog (CRUD, active/inactive, pricing, TAT, document checklists).
- Bulk import (CSV/Excel) and export filtered lists.
- Assign-to-Accounts handoff.

## Recommended Approach: Test-Driven Development

See `product-plan/sections/sales-crm/tests.md` for detailed flow tests covering creation, follow-ups, quotations, filtering, services catalog, and empty states.

## What to Implement

### Components

Copy from `product-plan/sections/sales-crm/components/`:
- `LeadsList.tsx`
- `LeadDetail.tsx`
- `LeadForm.tsx`
- `QuotationBuilder.tsx`
- `ServicesCatalog.tsx`
- `index.ts`

### Data Layer

`SalesCRMProps` expects: `leads`, `followUps`, `quotations`, `services`, `wealthManagers`, `statusCounts`.

You'll need:
- A `leads` table with status, source, WM linkage, assignment.
- A `follow_ups` table polymorphic to `lead_id` or `case_id`.
- A `quotations` table with line items, totals, and a unique `reference_number`.
- A `services` catalog table (active/inactive, pricing, TAT, doc checklist).
- A `wealth_managers` table (or reference to Partners).

### Callbacks

| Callback | What to wire |
|---|---|
| `onCreateLead` / `onEditLead` / `onDeleteLead` | Open form / persist / soft-delete |
| `onAddFollowUp` | Persist a follow-up entry |
| `onCreateQuotation` | Open `QuotationBuilder` for a lead |
| `onSendQuotation(id, via)` | Send via email or WhatsApp; persist `sentAt`, `sentVia`; mint quotation `referenceNumber` |
| `onAssignToAccounts(id)` | Update lead status, create an entry in Accounts |
| `onImportLeads` / `onExportLeads` | CSV/Excel bulk operations |
| `onCreateService` / `onEditService` / `onToggleService` | Catalog CRUD |

### Empty States

- `leads = []` → "No leads yet" with `+ Add Lead` CTA.
- Follow-up timeline empty → "No follow-ups yet".
- Quotation history empty → "No quotations sent".
- Services catalog empty → "No services configured" CTA.

## Files to Reference

- `product-plan/sections/sales-crm/README.md`
- `product-plan/sections/sales-crm/tests.md`
- `product-plan/sections/sales-crm/components/`
- `product-plan/sections/sales-crm/types.ts`
- `product-plan/sections/sales-crm/sample-data.json`

## Expected User Flows

### Flow 1: Capture a New Lead
1. Click `+ Add Lead`.
2. Fill form; select a Wealth Manager (required).
3. Save → lead appears in `New` tab.

### Flow 2: Send a Quotation
1. Open lead detail → `Create Quotation`.
2. Add services, preview totals.
3. `Send via Email` → reference number generated, lead status → `Quotation Sent`.

### Flow 3: Hand Off to Accounts
1. From lead detail → `Assign to Accounts`.
2. Confirm dialog → status updates, Accounts entry appears in Accounts section.

## Done When

- [ ] Tests for primary flows pass.
- [ ] All 8 status tabs render with correct counts.
- [ ] Search debounces (~300ms) and combines with active tab filter.
- [ ] Lead creation requires a Wealth Manager.
- [ ] Follow-up timeline orders most-recent-first.
- [ ] Quotation totals auto-calculate; reference number is unique.
- [ ] Send via email and WhatsApp both work via your messaging providers.
- [ ] Bulk import / export round-trips data correctly.
- [ ] Assign-to-Accounts creates a corresponding entry in the Accounts section.
- [ ] Empty states render where applicable.
- [ ] Responsive on mobile.

---

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

---

# Milestone 5: Customers

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1–4

## Goal

Implement the Customers section — central repository of converted customers with a list view and a tabbed detail view (Profile, Services, Cases, Documents, Payments, Follow-ups).

## Overview

Customers is read-mostly; most state changes originate elsewhere (Accounts converts leads; Case Management creates cases; documents are generated against cases; payments live in Accounts). This milestone is mostly wiring read queries.

**Key Functionality:**
- KPI cards: Total Customers, Active Cases, Services Availed, Revenue Generated.
- Searchable, filterable list (search, WM, service type, status, date range).
- 6-tab detail view that aggregates the customer's services, cases, documents, payments, and follow-ups.
- Send Quotation action that routes back through Accounts.

## Recommended Approach: Test-Driven Development

See `product-plan/sections/customers/tests.md` for tests focused on filtering, tab navigation, and tab-scoped data isolation.

## What to Implement

### Components

Copy from `product-plan/sections/customers/components/`:
- `CustomerList.tsx`
- `CustomerDetail.tsx`
- `index.ts`

### Data Layer

`CustomerDetailProps` aggregates: `customer`, `services`, `cases`, `documents`, `payments`, `followUps`, `wealthManager`. Implement these as joined queries scoped by `customerId`.

### Callbacks

- `onSendQuotation(id)` — Route into Accounts/Sales quotation builder for the customer.
- `onViewCase(caseId)` — Route to `/case-management/:id`.
- `onDownloadDocument(docId)` — Stream the file.

### Empty States

Per-tab empty states are critical because customers often have zero records in some tabs (e.g., no follow-ups yet).

## Files to Reference

- `product-plan/sections/customers/README.md`
- `product-plan/sections/customers/tests.md`
- `product-plan/sections/customers/components/`
- `product-plan/sections/customers/types.ts`
- `product-plan/sections/customers/sample-data.json`

## Expected User Flows

### Flow 1: Find a Customer
1. Search by name; filter by WM.
2. Open the matching customer.

### Flow 2: Review a Customer's Documents
1. Open customer → Documents tab.
2. Click Download on an `approved` document.
3. File downloads; entry shows last-downloaded timestamp (if your design supports it).

## Done When

- [ ] Filtering combines correctly (intersection, not union).
- [ ] All 6 detail tabs render scoped data without cross-customer leakage.
- [ ] Empty states render per tab when arrays are empty.
- [ ] `Send Quotation` routes correctly.
- [ ] Wealth Manager card surfaces partner contact details.
- [ ] Responsive on mobile.

---

# Milestone 6: Case Management

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1–5

## Goal

Implement Case Management — case creation, lawyer assignment, follow-up timelines with service-specific actions, case-level progression, and document management.

## Overview

A Case is opened against a Customer for a specific availed Service (Will, Trust, or Succession Certificate). Cases have an assigned Lawyer, progress through five case levels, and accumulate follow-ups with service-specific actions and documents.

**Key Functionality:**
- Status-tabbed list (All, In Progress, Drafting, Under Review, Approved, Completed, On Hold).
- 5-tab detail view: Follow-ups, Case Details, Notes, Find Lawyer, Documents.
- Service-specific follow-up actions (Will: Drafting/Client Review/Revision/Registration/Advisory, Trust: …, Succession: …).
- Case level progress: Not Started → Drafting → Review → Court Filing → Delivered.
- Auto-generated `W24-CASE-XXXXX` IDs.

## Recommended Approach: Test-Driven Development

See `product-plan/sections/case-management/tests.md` covering case creation, service-specific follow-ups, reassignment, and level progression.

## What to Implement

### Components

Copy from `product-plan/sections/case-management/components/`:
- `CaseList.tsx`
- `CaseDetail.tsx`
- `AddCaseForm.tsx`
- `index.ts`

### Data Layer

Tables: `cases`, `case_follow_ups`, `case_notes`, `case_documents`. Cases reference `customer_id`, `lawyer_id`, `employee_id`. The service-type dropdown in `AddCaseForm` must auto-populate from the customer's `availedServices`.

### Callbacks

- `onAddFollowUp` / `onAddNote` — Persist new entries.
- `onAssignLawyer(lawyerId)` — Update case, append a system follow-up, decrement/increment lawyer `activeCases`.
- `onDownloadDocument(docId)` — Stream the file.

### Empty States

- No cases overall: empty state CTA `+ New Case` (only if customers exist).
- No follow-ups on a case: "No follow-ups yet — log the first action".
- No documents on a case: "No documents generated".

## Files to Reference

- `product-plan/sections/case-management/README.md`
- `product-plan/sections/case-management/tests.md`
- `product-plan/sections/case-management/components/`
- `product-plan/sections/case-management/types.ts`
- `product-plan/sections/case-management/sample-data.json`

## Expected User Flows

### Flow 1: Create a Case
1. `+ New Case` → choose customer → service type auto-populates from their availed services → assign lawyer → set priority → save.
2. Case appears in `In Progress` tab with auto-generated `W24-CASE-XXXXX`.

### Flow 2: Log a Service-Specific Follow-up
1. Case detail → Follow-ups tab → `Add Follow-up`.
2. Choose action (e.g., `Drafting` for a Will service).
3. Save → timeline updates; case `lastUpdated` advances.

### Flow 3: Progress Through Levels
1. Move case through Drafting → Review → Court Filing → Delivered.
2. Each transition appends a system follow-up.
3. On `Delivered`, case appears in `Completed` tab.

## Done When

- [ ] Tests pass.
- [ ] `W24-CASE-XXXXX` IDs are unique.
- [ ] Service-type dropdown filters to the selected customer's availed services.
- [ ] Service-specific follow-up actions are gated by service type.
- [ ] Reassignment updates both lawyers' `activeCases` counters atomically.
- [ ] Case level progress bar reflects current state.
- [ ] Empty states render where applicable.
- [ ] Responsive on mobile.

---

# Milestone 7: Partners (Wealth Managers)

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1–6

## Goal

Implement Partners — Wealth Manager management with onboarding, status toggling, wallet, packages, sub-team, and tagged customers.

## Overview

Wealth Managers are channel partners (external) who buy will packages and serve their clients with those credits. Admins onboard new WMs, track package usage (`willsRemaining`, `willsUsed`), manage wallet transactions (purchases and consumption), view their sub-teams, and see all customers tagged to them.

**Key Functionality:**
- KPI badges: Total Sales, Active WMs, Wills Remaining.
- Filterable WM list (search, tier, status) with ON/OFF activation toggle.
- Multi-section add/edit form: Basic, Address, Company (GST/PAN/bank), Permissions, Package selection.
- 5-tab detail: Follow-ups, Wallet, Team, Customers, Packages.
- Wallet timeline shows both `package_purchase` and `will_used` transactions.
- Auto-generated `PAT-XXXXX` IDs.

## Recommended Approach: Test-Driven Development

See `product-plan/sections/partners/tests.md` for onboarding, status toggle, wallet integrity, and tier-filter tests.

## What to Implement

### Components

Copy from `product-plan/sections/partners/components/`:
- `WMList.tsx`
- `WMDetail.tsx`
- `AddWMForm.tsx`
- `index.ts`

### Data Layer

Tables: `wealth_managers`, `wm_packages`, `wm_wallet_transactions`, `wm_team_members`, `wm_follow_ups`. Customers are joined via the existing `customers` table.

Business rules:
- `willsRemaining` and `willsUsed` are derived from `wm_packages` and `wallet_transactions`; never let them go out of sync.
- Deactivating a WM hides it from "assignable Wealth Manager" dropdowns in Sales CRM but keeps it in historical reports.
- Package status transitions: `active` → `exhausted` (when `willsRemaining === 0`) or `expired` (when `expiresAt < now`).

### Callbacks

- `onToggleStatus(id)` — Flip active/inactive with confirm.
- `onAddFollowUp` / `onAddTeamMember` — Append entries.
- `onViewCustomer(customerId)` — Route into Customers.

### Empty States

- No WMs: list shows `+ Add Partner` CTA.
- WM detail with no packages/team/customers/wallet: each tab shows its own empty state.

## Files to Reference

- `product-plan/sections/partners/README.md`
- `product-plan/sections/partners/tests.md`
- `product-plan/sections/partners/components/`
- `product-plan/sections/partners/types.ts`
- `product-plan/sections/partners/sample-data.json`

## Expected User Flows

### Flow 1: Onboard a Partner
1. `+ Add Partner` → fill all four form sections → pick package tier → submit.
2. WM appears with `PAT-XXXXX` ID, default `active` status, and a Package row.

### Flow 2: Deactivate a Partner
1. Toggle inactive → confirm.
2. WM no longer appears in Sales CRM's WM dropdown.
3. WM still shows in Reports → WM Performance.

### Flow 3: Will Consumption
1. A customer tagged to the WM consumes a will (handled in Case Management).
2. A `will_used` transaction is created in this WM's wallet.
3. `willsRemaining` decrements; if it hits 0, package becomes `exhausted`.

## Done When

- [ ] Tests pass.
- [ ] `PAT-XXXXX` IDs are unique.
- [ ] Wallet integrity is maintained under concurrent updates (test with simultaneous "consume will" operations).
- [ ] Status toggle persists and propagates to all dependent dropdowns.
- [ ] Package status transitions correctly on expiry and exhaustion.
- [ ] All 5 detail tabs surface scoped data.
- [ ] Empty states render per tab.
- [ ] Responsive on mobile.

---

# Milestone 8: Team Management

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1–7

## Goal

Implement Team Management — internal users with role-based access, the lawyers directory, and the employee HRMS, organized into a single 3-tab interface.

## Overview

Three tabs in one page: **Users & Roles** (internal staff with role assignments and a permissions matrix), **Lawyers Directory** (legal pros assignable to cases), and **Employees (HRMS)** (full HR records with KYC and bank details). Soft-delete semantics throughout.

**Key Functionality:**
- Users & Roles: 6 roles (Admin, Sales, Operations, Legal, Accounts, HR) with a read-only permission matrix.
- Lawyers Directory: profile, performance metrics, document upload tracking, availability badges.
- Employees (HRMS): multi-section onboarding form with KYC docs, bank details, address.

## Recommended Approach: Test-Driven Development

See `product-plan/sections/team-management/tests.md` for user, lawyer, and employee flow tests plus soft-delete behavior.

## What to Implement

### Components

Copy from `product-plan/sections/team-management/components/`:
- `TeamManagement.tsx` — Tabbed shell.
- `index.ts`

### Data Layer

Tables: `users`, `lawyers`, `lawyer_documents`, `employees`, `kyc_documents`, `role_permissions`. Treat `status='inactive'` as soft-deleted everywhere.

### Callbacks

The `TeamManagementProps` interface lists the full callback set: add/edit/toggle for each of users, lawyers, employees, plus `onUpdateLawyerAvailability` and `onViewLawyer/onViewEmployee`.

### Empty States

Each tab has its own empty state with a `+ Add` CTA.

## Files to Reference

- `product-plan/sections/team-management/README.md`
- `product-plan/sections/team-management/tests.md`
- `product-plan/sections/team-management/components/`
- `product-plan/sections/team-management/types.ts`
- `product-plan/sections/team-management/sample-data.json`

## Expected User Flows

### Flow 1: Add an Internal User
1. Users & Roles → `+ Add User` → fill form → save.
2. User appears with their role badge; permission matrix highlights their role column.

### Flow 2: Soft-Delete a User
1. Toggle inactive → confirm.
2. User stays visible with `inactive` badge but is excluded from active dropdowns elsewhere.

### Flow 3: Onboard an Employee
1. Employees → multi-section form → upload at least one KYC doc → save.
2. Record appears with `employeeId` and KYC pill indicators.

## Done When

- [ ] Tests pass.
- [ ] Soft-delete is the only deletion mode (no hard-delete anywhere).
- [ ] Permission matrix is read-only and reflects role → module mapping.
- [ ] Lawyer availability changes propagate to Case Management's lawyer dropdowns.
- [ ] KYC pill indicators show uploaded/pending correctly.
- [ ] Empty states render per tab.
- [ ] Responsive on mobile.

---

# Milestone 9: Lawyers Directory

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1–8 (must have Team Management complete — this section reuses it)

## Goal

Implement Lawyers Directory — a standalone, searchable directory of lawyers with a dedicated detail page that shows the lawyer's assigned cases.

## Overview

Operations and Legal users need fast lookup of lawyers without entering Team Management's other tabs. This section reuses the Team Management Lawyers tab inside its own route and adds a richer detail screen.

**Key Functionality:**
- Standalone searchable directory mounted at `/lawyers-directory`.
- Filters: specialization, location, availability.
- `LawyerDetailPage` with profile, performance metrics, documents, and the lawyer's active cases.

## Recommended Approach: Test-Driven Development

See `product-plan/sections/lawyers-directory/tests.md` for filter, routing, and detail-page tests.

## What to Implement

### Components

Copy from `product-plan/sections/lawyers-directory/components/`:
- `LawyersDirectory.tsx`
- `LawyerDetailPage.tsx`
- `index.ts`

### Cross-Section Import

`LawyersDirectory.tsx` imports `TeamManagement` from `../../team-management/components/TeamManagement`. **Preserve that relative path** — it lets the directory reuse the same lawyer list semantics.

`types.ts` in this section is a re-export from `../team-management/types`. Keep it as a re-export so the relative `../types` imports in the components resolve.

### Data Layer

Reuses the `lawyers` table from Team Management. The detail page additionally needs a query for the lawyer's active cases (`cases.assignedLawyerId = :id AND status IN ('in-progress', 'drafting', 'under-review', 'approved')`).

### Empty States

- No lawyers: empty state CTA delegates to Team Management's add form.
- Lawyer with no active cases: detail shows "No active cases".
- Lawyer missing docs: pending pills on each missing document type.

## Files to Reference

- `product-plan/sections/lawyers-directory/README.md`
- `product-plan/sections/lawyers-directory/tests.md`
- `product-plan/sections/lawyers-directory/components/`
- `product-plan/sections/lawyers-directory/types.ts`
- `product-plan/sections/team-management/types.ts` — Source of truth for `Lawyer`
- `product-plan/sections/team-management/sample-data.json` — Reused as sample data

## Expected User Flows

### Flow 1: Search for a Lawyer
1. User filters by `specialization = Wills & Trusts`, `location = Mumbai`, `availability = Available`.
2. Filtered list shows matching lawyers.

### Flow 2: Open Lawyer Detail
1. Click a lawyer row.
2. Routes to `/lawyers-directory/:id`.
3. Detail page shows profile, performance metrics, documents, and active cases.
4. Back nav returns to the directory with prior filters preserved.

## Done When

- [ ] Tests pass.
- [ ] Filters combine correctly (intersection).
- [ ] Detail page lists only the lawyer's active cases (not historical).
- [ ] Deactivated lawyers don't appear unless an `Inactive` filter is enabled.
- [ ] Empty states render where applicable.
- [ ] Responsive on mobile.

---

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
