# Partners (Wealth Managers)

## Overview

Manages Wealth Managers — channel partners who purchase will packages and serve clients with those credits. Admins onboard new WMs, track package usage and will credits, manage wallet transactions, view sub-teams, and monitor sales metrics.

## User Flows

- View WMs with filters: Search, Partner Tier, Status.
- Activate/deactivate WMs via ON/OFF toggle.
- Onboard a new WM (profile, address, company, permissions, package selection).
- View detail across 5 tabs: Follow-ups, Wallet, Team, Customers, Packages.
- Track performance: Total Sales, Active WMs, Wills Remaining.

## Design Decisions

- WM ID format: `PAT-XXXXX`.
- Tier badges (Platinum/Gold/Silver/Bronze) use distinct colored chips for instant recognition.
- Add/Edit form is multi-section (Basic, Address, Company, Permissions, Package) to chunk a long onboarding.
- Wallet shows both package purchase debits and will usage entries on one timeline.

## Data Used

**Section-level types:** `WealthManager`, `WMAddress`, `WMCompany`, `WMFollowUp`, `WMPackage`, `WMWalletTransaction`, `WMTeamMember`, `WMCustomer`, `WMKpiStats`, `WMStatusCounts`, `WMTierCounts`. **From global model:** `WealthManager`, `WMPackage`, `WalletTransaction`, `Customer`.

## Components Provided

- `WMList` — KPI badges + filterable WM table.
- `WMDetail` — 5-tab detail view.
- `AddWMForm` — Multi-section onboarding/edit form.

## Callback Props

| Callback | Description |
|---|---|
| `onView` / `onEdit` / `onCreate` | List actions |
| `onToggleStatus` | Activate/deactivate a WM |
| `onViewCustomers` / `onViewPackages` | Jump into detail tabs |
| `onAddFollowUp` / `onAddTeamMember` | Detail-view content additions |
| `onViewCustomer` | Jump to a customer from the WM's customers tab |
| `onBack` | Detail-view back navigation |
