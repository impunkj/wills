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
