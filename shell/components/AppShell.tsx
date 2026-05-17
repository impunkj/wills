import { ChevronRight } from 'lucide-react'
import MainNav, { type NavItem } from './MainNav'
import UserMenu from './UserMenu'

interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavItem[]
  user?: { name: string; role?: string; avatarUrl?: string }
  onNavigate?: (href: string) => void
  onLogout?: () => void
  breadcrumbs?: Array<{ label: string; href?: string }>
  /** Optional slot for header tools (search trigger, quick-create menu, etc.) */
  headerSlot?: React.ReactNode
}

export default function AppShell({
  children,
  navigationItems,
  user,
  onNavigate,
  onLogout,
  breadcrumbs = [],
  headerSlot,
}: AppShellProps) {
  return (
    <div
      className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-900"
      style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
    >
      <MainNav items={navigationItems} onNavigate={onNavigate} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-neutral-200/80 bg-white px-6 dark:border-neutral-800 dark:bg-neutral-900">
          <nav className="flex items-center gap-1.5 text-[13px]">
            {breadcrumbs.length > 0 ? (
              breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <ChevronRight
                      size={12}
                      strokeWidth={2}
                      className="text-neutral-300 dark:text-neutral-600"
                    />
                  )}
                  {crumb.href && i < breadcrumbs.length - 1 ? (
                    <button
                      onClick={() => onNavigate?.(crumb.href!)}
                      className="text-neutral-400 transition-colors hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))
            ) : (
              <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                Dashboard
              </span>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {headerSlot}
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-neutral-100 p-6 dark:bg-neutral-950">
          {children}
        </main>
      </div>
    </div>
  )
}
