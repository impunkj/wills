# Section Implementation Prompt

## Define Section Variables

- **SECTION_NAME** = [Human-readable name, e.g., "Sales CRM" or "Accounts"]
- **SECTION_ID** = [Folder name in sections/, e.g., "sales-crm" or "accounts"]
- **NN** = [Milestone number — sections start at 02 since 01 is Foundation; e.g., "02" for Dashboard Home, "03" for Sales CRM]

Milestone numbering map:
- `02-dashboard-home`
- `03-sales-crm`
- `04-accounts`
- `05-customers`
- `06-case-management`
- `07-partners`
- `08-team-management`
- `09-lawyers-directory`
- `10-reports-analytics`

---

I need you to implement the **SECTION_NAME** section of **Wills24 Admin**.

## Instructions

Please carefully read and analyze the following files:

1. **@product-plan/product-overview.md** — Product summary for overall context
2. **@product-plan/instructions/incremental/NN-SECTION_ID.md** — Specific instructions for this section

Also review the section assets:
- **@product-plan/sections/SECTION_ID/README.md** — Feature overview and design intent
- **@product-plan/sections/SECTION_ID/tests.md** — Test-writing instructions (use TDD approach)
- **@product-plan/sections/SECTION_ID/components/** — React components to integrate
- **@product-plan/sections/SECTION_ID/types.ts** — TypeScript interfaces
- **@product-plan/sections/SECTION_ID/sample-data.json** — Test data

## Before You Begin

Please ask me clarifying questions about:

1. **Authentication & Authorization** (if not yet established)
   - How should users authenticate?
   - What permissions are needed for this section? Which of the 6 internal roles (Admin, Sales, Operations, Legal, Accounts, HR) can read vs. write here?

2. **Data Relationships**
   - How does this section's data relate to other entities already implemented?
   - Are there any cross-section dependencies (e.g., this section consumes Wealth Managers, Customers, Cases that another section owns)?

3. **Integration Points**
   - Which API endpoints already exist that this section should use?
   - Any handoff flows to/from other sections (e.g., Sales CRM → Accounts, Accounts → Customers)?

4. **Backend Business Logic**
   - Any server-side logic, validations, or processes specific to this section beyond what's shown in the UI?
   - Background processes, notifications, or other processes to trigger (e.g., emails on quotation send, SLA timers, GST e-invoice push)?
   - For Customer / Case ID generation — is there an existing sequence service to use?

5. **Any Other Clarifications**
   - Questions about specific user flows in this section
   - Edge cases that need clarification

## Implementation Approach

Use test-driven development:
1. Read the `tests.md` file and write failing tests first.
2. Implement the feature to make tests pass.
3. Refactor while keeping tests green.

Lastly, be sure to ask me if I have any other notes to add for this implementation.

Once I answer your questions, proceed with implementation.
