# Case Management

## Overview

Cases are created against converted customers for availed services. This module handles case lifecycle — creation, lawyer assignment, follow-up timelines, document generation, and progress tracking through case levels (Not Started → Drafting → Review → Court Filing → Delivered).

## User Flows

- View cases with filters: Search, Case Level, Status, Assigned Lawyer, Service Type, Customer, Date Range.
- Create a new case (customer, service type, lawyer, priority, description).
- View case detail across 5 tabs: Follow-ups, Case Details, Notes, Find Lawyer, Documents.
- Add follow-up entries with service-specific actions, status changes, and priority.
- Assign or reassign lawyers.
- Track progress through case levels with a progress bar.
- View/manage documents generated for a case.

## Service-Specific Follow-up Actions

- **Will services:** Drafting, Client Review, Revision, Registration, Advisory.
- **Trust services:** Trust Drafting, Client Review, Trust Registration, Advisory.
- **Succession Certificate:** Application Filing, Court Hearing, Certificate Obtained.

## Design Decisions

- Case ID format: `W24-CASE-XXXXX` (monospace display).
- Add New Case form auto-populates the service-type dropdown from the customer's availed services.
- The `Find Lawyer` tab filters lawyers by specialization and availability to streamline assignment.

## Data Used

**Section-level types:** `Case`, `CaseFollowUp`, `CaseNote`, `CaseDocument`, `Lawyer`, `CustomerRef`, `CaseKpiStats`, `CaseStatusCounts`. **From global model:** `Case`, `FollowUp`, `CaseDocument`, `Lawyer`, `Customer`.

## Components Provided

- `CaseList` — Status-tabbed list with KPI summary.
- `CaseDetail` — 5-tab detail view.
- `AddCaseForm` — Create-case form.

## Callback Props

| Callback | Description |
|---|---|
| `onView` / `onEdit` / `onCreate` | List actions |
| `onAddFollowUp` / `onAddNote` | Detail-view content additions |
| `onAssignLawyer` | Assign or reassign a lawyer |
| `onDownloadDocument` | Download a generated document |
| `onBack` | Detail-view back navigation |
