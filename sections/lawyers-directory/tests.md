# Test Instructions: Lawyers Directory

## Overview

This is a derived view of Team Management's Lawyers tab plus a dedicated detail page. Most tests overlap with Team Management — focus here is on routing, detail-page data integrity, and filter behavior.

---

## User Flow Tests

### Flow 1: Search by Specialization

**Setup:** Mix of lawyers across `Wills & Trusts`, `Property Law`, `Corporate`.

**Steps:** Filter specialization = `Wills & Trusts`.

**Expected:** Only Wills & Trusts lawyers list; counts on availability badges reflect the filtered set.

### Flow 2: Open Lawyer Detail

**Steps:** Click a lawyer row.

**Expected:**
- [ ] Routes to `/lawyers-directory/:id`.
- [ ] Detail page shows profile, performance metrics, document upload status, and the lawyer's active cases.
- [ ] Back navigation returns to the directory with prior filters preserved.

### Flow 3: Filter by Availability

**Steps:** Filter `Available`.

**Expected:** Only `available` lawyers list; `On Leave` and `Overloaded` are hidden.

---

## Empty States

- [ ] No lawyers: directory shows "No lawyers in the directory" with `+ Add Lawyer` CTA (delegates to Team Management).
- [ ] Detail page for a lawyer with no assigned cases: case list shows "No active cases".
- [ ] Detail page for a lawyer missing documents: shows pending pills, not blank slots.

---

## Edge Cases

- [ ] Lawyer with very long name: truncates with ellipsis; tooltip on hover.
- [ ] Lawyer with 50+ active cases: case list paginates.
- [ ] Deactivated lawyer from Team Management: should not appear in directory unless an "Inactive" filter is enabled.

---

## Sample Test Data

Use the `Lawyer` mock from `team-management/tests.md`.
