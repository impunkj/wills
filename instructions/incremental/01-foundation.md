# Milestone 1: Foundation

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** None

---

## About These Instructions

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Data model definitions (TypeScript types and sample data)
- UI/UX specifications (user flows, requirements, screenshots)
- Design system tokens (colors, typography, spacing)
- Test-writing instructions for each section (for TDD approach)

**What you need to build:**
- Backend API endpoints and database schema
- Authentication and authorization
- Data fetching and state management
- Business logic and validation
- Integration of the provided UI components with real data

**Important guidelines:**
- **DO NOT** redesign or restyle the provided components — use them as-is
- **DO** wire up the callback props to your routing and API calls
- **DO** replace sample data with real data from your backend
- **DO** implement proper error handling and loading states
- **DO** implement empty states when no records exist (first-time users, after deletions)
- **DO** use test-driven development — write tests first using `tests.md` instructions
- The components are props-based and ready to integrate — focus on the backend and data layer

---

## Goal

Set up the foundational elements: design tokens, the `_shared/` UI primitives, data model types, routing structure, and the application shell.

## What to Implement

### 1. Design Tokens

Apply the Wills24 Admin design system:

- See `product-plan/design-system/tokens.css` for CSS custom properties.
- See `product-plan/design-system/tailwind-colors.md` for the Tailwind color usage convention (primary `orange`, secondary `yellow`, neutral `neutral`).
- See `product-plan/design-system/fonts.md` for the Google Fonts setup (DM Sans, IBM Plex Mono).

The project uses **Tailwind CSS v4** (no `tailwind.config.js`). Add the Google Fonts `<link>` to your root HTML and the design-tokens CSS to your global stylesheet.

### 2. Shared UI Primitives

Section components import from `@/lib/...` and `@/components/ui/...`. Install them now so every later milestone has them:

- Copy `product-plan/_shared/lib/*` → `src/lib/`
- Copy `product-plan/_shared/components/ui/*` → `src/components/ui/`

Install the dependencies these primitives need:

```
npm install lucide-react clsx tailwind-merge @radix-ui/react-dialog sonner
```

(See `product-plan/_shared/README.md` for details and the alternative `@/shared` aliasing approach.)

### 3. Data Model Types

Create the canonical domain types:

- See `product-plan/data-model/types.ts` for interface definitions.
- See `product-plan/data-model/README.md` for entity descriptions and relationships.

Place these at `src/types/domain.ts` (or wherever your project's shared types live). Section-specific view-model types live in each section's `types.ts` — copy those alongside their components when you build the corresponding milestone.

### 4. Routing Structure

Create placeholder routes for each section so navigation works before the sections themselves are built:

- `/` or `/dashboard-home` → Dashboard Home (default landing)
- `/sales-crm` → Sales CRM
- `/accounts` → Accounts
- `/customers` → Customers
- `/case-management` → Case Management
- `/partners` → Partners
- `/team-management` → Team Management
- `/lawyers-directory` → Lawyers Directory
- `/reports-analytics` → Reports & Analytics
- `/login` → Login page (use `sections/dashboard-home/components/LoginPage.tsx`)

### 5. Application Shell

Copy the shell components into your project:

- `product-plan/shell/components/AppShell.tsx`
- `product-plan/shell/components/MainNav.tsx`
- `product-plan/shell/components/UserMenu.tsx`
- `product-plan/shell/components/index.ts`

Wire `AppShell` at the layout level:

```tsx
import { AppShell, type NavItem } from './shell/components'
import { useRouter, usePathname } from 'next/navigation'

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard-home' },
  { label: 'Sales CRM', href: '/sales-crm' },
  { label: 'Accounts', href: '/accounts' },
  { label: 'Customers', href: '/customers' },
  { label: 'Case Management', href: '/case-management' },
  { label: 'Partners', href: '/partners' },
  { label: 'Team Management', href: '/team-management' },
  { label: 'Lawyers Directory', href: '/lawyers-directory' },
  { label: 'Reports & Analytics', href: '/reports-analytics' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const navItems = NAV.map((n) => ({ ...n, isActive: pathname === n.href }))

  return (
    <AppShell
      navigationItems={navItems}
      user={{ name: currentUser.name, role: currentUser.role }}
      breadcrumbs={[/* derive from pathname or page metadata */]}
      onNavigate={(href) => router.push(href)}
      onLogout={() => signOut()}
    >
      {children}
    </AppShell>
  )
}
```

See `product-plan/shell/README.md` for full wiring details.

### 6. Login Page

Place `LoginPage` from `product-plan/sections/dashboard-home/components/LoginPage.tsx` at the `/login` route. Wire `onLogin` to your authentication flow.

## Files to Reference

- `product-plan/design-system/` — Design tokens, Tailwind color guide, fonts setup
- `product-plan/data-model/` — Type definitions and entity relationships
- `product-plan/_shared/` — Shared utilities and UI primitives
- `product-plan/shell/README.md` — Shell design intent
- `product-plan/shell/components/` — Shell React components

## Done When

- [ ] Tailwind v4 is set up and the design tokens / fonts are loaded.
- [ ] `_shared/lib/*` and `_shared/components/ui/*` are mounted under `@/lib` and `@/components/ui`.
- [ ] Domain types from `data-model/types.ts` exist in the codebase.
- [ ] Placeholder routes exist for all 9 sections plus `/login`.
- [ ] Shell renders with sidebar nav, top bar, breadcrumbs, and user menu.
- [ ] Navigation links route correctly; active nav item highlights in orange.
- [ ] User menu shows the current user's name/role and a Sign out action.
- [ ] `/login` route renders the provided `LoginPage`.
- [ ] App works in light and dark mode.
