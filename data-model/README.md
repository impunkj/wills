# Data Model

## Entities

### Lead
A prospective customer captured through sales efforts, tagged to a Wealth Manager, and tracked through the pipeline until conversion. Each lead has a source, contact details, service interest, and status that progresses from New through to Won or Lost.

### Customer
A converted lead who has been verified by Accounts after payment confirmation. Assigned a unique Customer ID (`W24-CUST-XXXXX`) and linked to the original Wealth Manager. Serves as the central record for all services, cases, documents, and payments.

### Case
A service engagement created against a customer for a specific availed service (Will, Trust, or Succession Certificate). Assigned a unique Case ID (`W24-CASE-XXXXX`), tracked through lifecycle stages from In Progress to Completed, and linked to an assigned lawyer.

### Quotation
A priced service proposal generated from the services catalog and sent to a lead via email or WhatsApp. Contains selected services with quantities, auto-calculated pricing with taxes, and a unique reference number. Multiple quotations can be sent per lead.

### Invoice
A GST-compliant billing document (Proforma Invoice or Tax Invoice) issued during payment confirmation. Supports CGST+SGST or IGST based on buyer/seller state, with tracking for Pending and Paid statuses and aging analysis.

### Payment
A recorded payment transaction against an invoice. Supports partial payments with automatic balance tracking and multiple payment modes (NEFT, RTGS, IMPS, UPI, Cheque, Cash, Online Gateway). Triggers receipt generation on confirmation.

### Service
A configurable item in the services catalog (e.g., Will Drafting, Trust Registration, Succession Certificate Filing). Belongs to a service category, has base pricing with tax rates, estimated TAT, document checklists, and active/inactive status.

### Template
A pre-defined legal document structure validated by the legal team. Categorized by type (Basic Will, Advanced Will, Living Trust, Family Trust, Succession Certificate Application) with editable placeholders, versioning, and deprecation management.

### Document
A generated legal document linked to a case, created from a template through a guided form flow. Has version control, approval status (Draft, Under Review, Approved, Delivered, Registered), and supports DOCX and PDF export with draft watermarks on unapproved versions.

### FollowUp
A timeline entry capturing interactions on leads or cases. Types include Update, Meeting, and Quotation for leads, and service-specific actions for cases. Each entry has a title, notes, automatic date/time stamp, author, priority, and optional attachments.

### WealthManager
A channel partner (external) who owns leads and customers, purchases packages of wills, and may manage a team of sub-partners. Has a profile with company details, GST/PAN documents, bank details, configurable permissions, and dashboard visibility settings.

### WMPackage
A package of wills purchased by a Wealth Manager. Each package belongs to a tier (Bronze, Silver, Gold, Platinum) with a set number of wills, validity period, and price. Tracks wills included, used, remaining, and status (active, expired, exhausted).

### Employee
An internal team member who accesses the Admin Dashboard. Assigned a role (Admin, Sales, Operations, Legal, Accounts, HR) that determines module-level permissions. Has a full profile with KYC documents, bank details, and department/designation.

### Lawyer
A legal professional assigned to cases. Has a profile with specialization, Bar Council ID, location, experience, and qualification documents. Tracked for availability status, active case load, average resolution time, and client ratings.

### Refund
A refund request initiated against a payment record. Contains the original invoice reference, refund amount, reason, and type (Full or Partial). Follows a multi-level approval workflow and triggers auto-generation of GST-compliant Credit Notes.

### WalletTransaction
A package purchase or will credit consumption entry in a Wealth Manager's wallet. Each transaction records the title, linked customer, type (`package_purchase` or `will_used`), amount, will credits, and remarks.

## Relationships

- Lead belongs to WealthManager; WealthManager has many Leads.
- Lead has many FollowUps and Quotations.
- Customer is converted from Lead; Customer belongs to WealthManager.
- Customer has many Cases, Invoices, and Payments.
- Case belongs to Customer and Lawyer; Case has many FollowUps and Documents.
- Quotation references one or more Services.
- Invoice belongs to Customer; Invoice has many Payments.
- Payment belongs to Invoice; Payment may have a Refund.
- Document belongs to Case; Document is generated from Template.
- WealthManager has many WalletTransactions and WMPackages.
- Employee manages Leads, Cases, and FollowUps based on role.

## Section-Specific Types

Each section's component props and view-model types live alongside the components in `sections/[section-id]/types.ts`. The top-level `types.ts` in this folder collects the core domain entities used across the app.
