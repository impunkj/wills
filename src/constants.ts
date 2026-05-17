export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard-home' },
  { label: 'Sales CRM', href: '/sales-crm' },
  { label: 'Accounts', href: '/accounts' },
  { label: 'Customers', href: '/customers' },
  { label: 'Case Management', href: '/case-management' },
  { label: 'Partners', href: '/partners' },
  { label: 'Team Management', href: '/team-management' },
  { label: 'Lawyers Directory', href: '/lawyers-directory' },
  { label: 'Reports & Analytics', href: '/reports-analytics' },
] as const

export const ROUTE_LABELS = Object.fromEntries(
  NAV_ITEMS.map((item) => [item.href, item.label]),
) as Record<string, string>
