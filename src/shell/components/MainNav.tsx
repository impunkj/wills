import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCheck,
  FolderKanban,
  Handshake,
  UsersRound,
  BarChart3,
  Scale,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon?: string
  isActive?: boolean
}

interface MainNavProps {
  items: NavItem[]
  onNavigate?: (href: string) => void
}

const iconMap: Record<string, React.ElementType> = {
  'dashboard-home': LayoutDashboard,
  'sales-crm': Briefcase,
  accounts: Users,
  customers: UserCheck,
  'case-management': FolderKanban,
  partners: Handshake,
  'team-management': UsersRound,
  'reports-analytics': BarChart3,
  'lawyers-directory': Scale,
}

function getIconForHref(href: string): React.ElementType {
  const key = href.replace(/^\//, '')
  return iconMap[key] || LayoutDashboard
}

export default function MainNav({ items, onNavigate }: MainNavProps) {
  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-neutral-800/50 bg-[#1a1a1a]">
      {/* Brand header */}
      <div className="flex h-[60px] shrink-0 items-center border-b border-neutral-800/50 px-5">
        <span className="text-[18px] font-bold tracking-tight text-white">
          Wills<span className="text-orange-500">24</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
          Menu
        </div>
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = getIconForHref(item.href)
            const isActive = item.isActive

            return (
              <li key={item.href}>
                <button
                  onClick={() => onNavigate?.(item.href)}
                  className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-orange-500/[0.12] text-orange-400'
                      : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-orange-500 shadow-[0_0_8px_rgba(255,145,0,0.5)]" />
                  )}
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2 : 1.5}
                    className={`shrink-0 transition-colors ${
                      isActive ? 'text-orange-400' : 'text-neutral-500 group-hover:text-neutral-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
