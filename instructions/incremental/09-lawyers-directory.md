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
