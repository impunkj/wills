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
