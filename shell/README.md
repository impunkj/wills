# Application Shell

The Wills24 Admin shell uses a fixed sidebar + top bar layout. The sidebar holds primary navigation across all sections; the top bar shows breadcrumbs, an optional tools slot (search / quick-create), and a user menu.

## Components Provided

- `AppShell.tsx` — Main layout wrapper. Renders sidebar, top bar with breadcrumbs and user menu, scrollable content area. Exposes a `headerSlot` for app-specific tools (e.g. a global search trigger or quick-create button).
- `MainNav.tsx` — Sidebar navigation. Maps each `href` to a lucide icon by route key (`dashboard-home`, `sales-crm`, `accounts`, `customers`, `case-management`, `partners`, `team-management`, `reports-analytics`, `lawyers-directory`). The brand displays the text `Wills24` with an orange accent on `24`.
- `UserMenu.tsx` — Top-right avatar dropdown. Shows initials fallback, user name and role, and a Sign out button.

## Wiring

```tsx
import { AppShell, type NavItem } from './shell/components'

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard-home', isActive: pathname === '/dashboard-home' },
  { label: 'Sales CRM', href: '/sales-crm', isActive: pathname === '/sales-crm' },
  { label: 'Accounts', href: '/accounts', isActive: pathname === '/accounts' },
  { label: 'Customers', href: '/customers', isActive: pathname === '/customers' },
  { label: 'Case Management', href: '/case-management', isActive: pathname === '/case-management' },
  { label: 'Partners', href: '/partners', isActive: pathname === '/partners' },
  { label: 'Team Management', href: '/team-management', isActive: pathname === '/team-management' },
  { label: 'Lawyers Directory', href: '/lawyers-directory', isActive: pathname === '/lawyers-directory' },
  { label: 'Reports & Analytics', href: '/reports-analytics', isActive: pathname === '/reports-analytics' },
]

<AppShell
  navigationItems={NAV}
  user={{ name: 'Anjali Mehta', role: 'Operations Admin' }}
  onNavigate={(href) => router.push(href)}
  onLogout={() => signOut()}
  breadcrumbs={[{ label: 'Sales CRM' }]}
>
  {children}
</AppShell>
```

## Design Notes

- **Sidebar:** 220px wide, dark background (`#1a1a1a`), orange-tinted active state with a 3px orange left bar.
- **Top bar:** 60px tall, white surface in light mode / `neutral-900` in dark mode, 1px bottom border.
- **Content:** Scrollable area with 24px padding, `neutral-100` background (light) / `neutral-950` (dark).
- **Typography:** Root container sets `font-family: "DM Sans"` so all nested content inherits.
- **Icons:** lucide-react (already a dependency of the components).

## Responsive Behavior

The shipped layout is desktop-first. For mobile:
- Hide the sidebar behind a hamburger toggle in the top bar.
- Render the sidebar as an overlay drawer when toggled.
- Keep the top bar always visible.

The provided components do not implement mobile collapse — wire your own state and a media query (or wrap `MainNav` in a Sheet/Drawer component from your UI library).
