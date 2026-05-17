# Test Instructions: Case Management

## Overview

Cover the case lifecycle from creation through lawyer assignment, follow-up logging (with service-specific actions), and case-level progression.

---

## User Flow Tests

### Flow 1: Create a New Case

**Setup:** A customer exists with at least one availed service. At least one Lawyer is `available`.

**Steps:**
1. User clicks `+ New Case`.
2. Selects customer; the Service Type dropdown auto-populates from that customer's services.
3. Picks a service, assigns a lawyer, sets Priority `High`, fills description.
4. Submits.

**Expected:**
- [ ] Case is created with auto-generated ID `W24-CASE-XXXXX`.
- [ ] Status defaults to `in-progress`, level `not-started`.
- [ ] Case appears at the top of the list under the `All` and `In Progress` tabs.

### Flow 2: Add a Service-Specific Follow-up

**Setup:** A Will-service case exists.

**Steps:** Open the case → Follow-ups tab → `Add Follow-up` → choose action `Drafting` → fill notes → save.

**Expected:**
- [ ] Follow-up entry shows action badge "Drafting".
- [ ] Timeline ordering is most-recent-first.
- [ ] Status-change indicator renders when the follow-up moves the case state.
- [ ] Trust cases offer Trust actions; Succession cases offer Succession actions — wrong-service actions are not selectable.

### Flow 3: Reassign Lawyer

**Steps:** Find Lawyer tab → pick a different lawyer with `available` status → confirm.

**Expected:**
- [ ] Case `assignedLawyer` and `lawyerId` update.
- [ ] A system follow-up entry is appended ("Reassigned from X to Y").
- [ ] Previous lawyer's `activeCases` decrements; new lawyer's increments.

### Flow 4: Progress Through Case Levels

**Steps:** Walk a case through Drafting → Review → Court Filing → Delivered via the level controls.

**Expected:**
- [ ] Progress bar fills with each step.
- [ ] Each transition produces a follow-up entry.
- [ ] Once `Delivered`, the case appears under the `Completed` tab; level controls are read-only.

---

## Empty States

- [ ] No cases: "No cases yet" with a `+ New Case` CTA (only if a customer exists; otherwise prompt to create a customer first).
- [ ] Case with no follow-ups: timeline shows "No follow-ups yet — log the first action".
- [ ] No documents on a case: Documents tab reads "No documents generated".
- [ ] Find Lawyer with no available lawyers: empty state suggests "All lawyers are busy" with no false CTA.

---

## Edge Cases

- [ ] Customer with no availed services: the service-type dropdown is disabled and explains why.
- [ ] On-Hold case: progress bar grays out; follow-ups are still loggable.
- [ ] Concurrent reassignment: last-write-wins should not corrupt counters (test idempotency).

---

## Sample Test Data

```ts
const mockCase: Case = {
  id: 'W24-CASE-00012', customerId: 'W24-CUST-00045',
  customerName: 'Anjali Mehta', serviceType: 'will',
  serviceName: 'Will Drafting (Basic)',
  assignedLawyer: 'Adv. R. Iyer', lawyerId: 'LAW-007',
  assignedEmployee: 'Amit Roy', employeeId: 'EMP-00012',
  status: 'in-progress', caseLevel: 'drafting',
  priority: 'high', followUpCount: 3, documentCount: 1,
  lastUpdated: '2026-05-12T10:00:00+05:30',
  createdAt: '2026-05-01T10:00:00+05:30',
  description: 'Basic Will for HNI client.',
  documentChecklist: ['ID Proof', 'Address Proof'],
}
```
