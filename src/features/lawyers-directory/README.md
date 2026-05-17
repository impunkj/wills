# Lawyers Directory

## Overview

Standalone searchable directory of lawyers. Mounts the lawyer-management surface of Team Management in its own route, with a richer detail page that surfaces assigned cases and documents.

## Why It's Separate

Operations and Legal users need fast lookup of lawyers without entering Team Management's other tabs. The page reuses the Team Management lawyer table for consistency and adds a dedicated detail screen.

## User Flows

- Search and filter lawyers by specialization, location, and availability.
- Open a lawyer's detail page with profile, documents, and active case assignments.
- Edit availability or other profile fields.

## Design Decisions

- Reuses `TeamManagement` (Lawyers Directory tab) so list semantics stay identical to Team Management.
- `LawyerDetailPage` is a dedicated view (not a side-panel) for richer case context.

## Data Used

Reuses `Lawyer` and `TeamManagementProps` from Team Management. See `types.ts` (a re-export) and `../team-management/types.ts` for definitions.

## Components Provided

- `LawyersDirectory` — Wraps `TeamManagement` and adds detail-page routing.
- `LawyerDetailPage` — Full-page lawyer profile with case assignments.

## Notes

- Cross-section import: `LawyersDirectory` imports `TeamManagement` from `../../team-management/components/TeamManagement`. Preserve that relative path when integrating.
