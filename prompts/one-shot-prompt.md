# One-Shot Implementation Prompt

I need you to implement a complete web application — **Wills24 Admin**, an internal operations dashboard for estate planning services — based on detailed design specifications and UI components I'm providing.

## Instructions

Please carefully read and analyze the following files:

1. **@product-plan/product-overview.md** — Product summary with sections and data model overview
2. **@product-plan/instructions/one-shot-instructions.md** — Complete implementation instructions for all milestones

After reading these, also review:
- **@product-plan/design-system/** — Color and typography tokens (primary `orange`, secondary `yellow`, neutral `neutral`; DM Sans + IBM Plex Mono)
- **@product-plan/data-model/** — Entity types and relationships
- **@product-plan/_shared/** — Shared UI primitives and utilities used across sections (mount under your `@/` alias)
- **@product-plan/shell/** — Application shell components (AppShell, MainNav, UserMenu)
- **@product-plan/sections/** — All section components, types, sample data, and test instructions

## Before You Begin

Please ask me clarifying questions about:

1. **Authentication & Authorization**
   - How should users sign up and log in? (email/password, OAuth, magic links, SSO?)
   - The product has 6 internal roles (Admin, Sales, Operations, Legal, Accounts, HR) plus external Wealth Manager partners — should partners have their own portal, or only appear as records in the admin app?
   - Are there per-module permission constraints I should enforce server-side?

2. **User & Account Modeling**
   - Are internal users single-tenant or scoped to an organization?
   - Should Wealth Managers have authenticated accounts (separate from admin users)?
   - How should the "current user" be resolved for the activity feed and audit attribution?

3. **Tech Stack Preferences**
   - Backend framework/language? (Node/Express, Next.js API routes, NestJS, Django, Rails, Laravel…)
   - Database? (Postgres, MySQL, MongoDB)
   - Hosting/deployment? (Vercel, AWS, GCP, on-prem?)
   - Should I keep the React frontend as a Next.js app, Vite SPA, or other?

4. **Backend Business Logic**
   - GST compliance: should CGST+SGST/IGST determination be done server-side per state pair? Are there state codes to seed?
   - Customer ID format (`W24-CUST-XXXXX`) and Case ID format (`W24-CASE-XXXXX`) — server-minted with a per-prefix sequence?
   - Document generation (Will / Trust / Succession Certificate) — what's the template engine? PDF generation library?
   - Email + WhatsApp sending — which providers? (SendGrid, Twilio, MSG91…)
   - Refund approval chain — do approvers need to be specific roles, or any user with permission?
   - SLA breach detection — how often is it computed? Cron, queue, or on read?

5. **Any Other Clarifications**
   - Any compliance/audit requirements (immutable history, GST e-invoicing, etc.)?
   - Multi-currency or India-only?
   - Localization (Hindi alongside English)?

Lastly, be sure to ask me if I have any other notes to add for this implementation.

Once I answer your questions, create a comprehensive implementation plan before coding.
