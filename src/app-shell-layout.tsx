import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, type NavItem } from '@/shell/components'
import { NAV_ITEMS, ROUTE_LABELS } from '@/constants'
import type { SessionUser } from '@/auth'
import { ThemeToggle } from '@/components/ThemeToggle'

interface AppShellLayoutProps {
  user: SessionUser
  theme: 'light' | 'dark'
  onLogout: () => void
  onToggleTheme: () => void
}

export function AppShellLayout({
  user,
  theme,
  onLogout,
  onToggleTheme,
}: AppShellLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const navigationItems: NavItem[] = NAV_ITEMS.map((item) => ({
    ...item,
    isActive: location.pathname === item.href || (item.href === '/dashboard-home' && location.pathname === '/'),
  }))

  const breadcrumbs = getBreadcrumbs(location.pathname)

  return (
    <AppShell
      navigationItems={navigationItems}
      user={user}
      breadcrumbs={breadcrumbs}
      onNavigate={(href) => navigate(href)}
      onLogout={onLogout}
      headerSlot={<ThemeToggle theme={theme} onToggle={onToggleTheme} />}
    >
      <Outlet />
    </AppShell>
  )
}

function getBreadcrumbs(pathname: string) {
  if (pathname === '/' || pathname === '/dashboard-home') {
    return [{ label: 'Dashboard' }]
  }

  const label = ROUTE_LABELS[pathname] ?? humanizePath(pathname)
  return [{ label: 'Dashboard', href: '/dashboard-home' }, { label }]
}

function humanizePath(pathname: string) {
  return pathname
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)
    .map((segment) =>
      segment
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
    )
    .join(' / ')
}
