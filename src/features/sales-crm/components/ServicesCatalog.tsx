import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Pencil,
  ToggleLeft,
  ToggleRight,
  IndianRupee,
  Clock,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Package,
  Archive,
  CheckCircle2,
  XCircle,
  FileText,
  LayoutGrid,
  List,
} from 'lucide-react'
import type { Service, ServiceCategory } from '../types'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ServicesCatalogProps {
  /** List of services to display */
  services: Service[]
  /** Called when user wants to create a new service */
  onCreate?: () => void
  /** Called when user wants to edit a service */
  onEdit?: (id: string) => void
  /** Called when user toggles a service's active/inactive status */
  onToggle?: (id: string) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type FilterTab = 'all' | ServiceCategory

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All Services' },
  { key: 'Wills', label: 'Wills' },
  { key: 'Trusts', label: 'Trusts' },
  { key: 'Succession Certificate', label: 'Succession' },
]

const CATEGORY_COLORS: Record<ServiceCategory, { bg: string; text: string; dot: string }> = {
  Wills: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  Trusts: { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
  'Succession Certificate': { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-500' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServicesCatalog({ services, onCreate, onEdit, onToggle }: ServicesCatalogProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // --- Stats ----------------------------------------------------------------

  const stats = useMemo(() => {
    const active = services.filter((s) => s.isActive).length
    const categories = new Set(services.map((s) => s.category)).size
    const avgPrice = services.length > 0 ? services.reduce((sum, s) => sum + s.basePrice, 0) / services.length : 0
    return { total: services.length, active, inactive: services.length - active, categories, avgPrice }
  }, [services])

  // --- Filter & search ------------------------------------------------------

  const filtered = useMemo(() => {
    let list = services
    if (activeTab !== 'all') list = list.filter((s) => s.category === activeTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      )
    }
    return list
  }, [services, activeTab, search])

  // --- Group by category ----------------------------------------------------

  const grouped = useMemo(() => {
    const map = new Map<ServiceCategory, Service[]>()
    for (const svc of filtered) {
      const arr = map.get(svc.category) || []
      arr.push(svc)
      map.set(svc.category, arr)
    }
    // Sort by category order
    const order: ServiceCategory[] = ['Wills', 'Trusts', 'Succession Certificate']
    return order.filter((c) => map.has(c)).map((c) => ({ category: c, services: map.get(c)! }))
  }, [filtered])

  // --- Toggle expanded card --------------------------------------------------

  const toggleExpanded = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // --- Tab counts -----------------------------------------------------------

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: services.length }
    for (const s of services) counts[s.category] = (counts[s.category] || 0) + 1
    return counts
  }, [services])

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Services Catalog
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Manage service offerings, pricing, and document requirements
              </p>
            </div>
            <button
              onClick={() => onCreate?.()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              Add Service
            </button>
          </div>

          {/* ── Stat cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <StatCard icon={<Package size={16} />} label="Total" value={stats.total} accent="text-neutral-700 dark:text-neutral-300" />
            <StatCard icon={<CheckCircle2 size={16} />} label="Active" value={stats.active} accent="text-emerald-600 dark:text-emerald-400" />
            <StatCard icon={<XCircle size={16} />} label="Inactive" value={stats.inactive} accent="text-red-500 dark:text-red-400" />
            <StatCard icon={<IndianRupee size={16} />} label="Avg. Price" value={formatCurrency(stats.avgPrice)} accent="text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-neutral-200/50 dark:bg-neutral-800 rounded-lg p-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 text-[10px] font-semibold tabular-nums ${
                      isActive ? 'text-orange-500' : 'text-neutral-400 dark:text-neutral-500'
                    }`}
                  >
                    {tabCounts[tab.key] ?? 0}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search + view toggle */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 pl-8 pr-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
              />
            </div>
            <div className="flex items-center bg-neutral-200/50 dark:bg-neutral-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                }`}
                title="Grid view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                }`}
                title="List view"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div>
        {grouped.length === 0 ? (
          <div className="text-center py-20">
            <Archive size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">No services found</p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
              {search ? 'Try a different search term' : 'Add your first service to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map((group) => {
              const catColor = CATEGORY_COLORS[group.category]
              return (
                <div key={group.category}>
                  {/* Category header */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <h2 className={`text-sm font-bold uppercase tracking-wider ${catColor.text}`}>
                      {group.category}
                    </h2>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                      {group.services.length} service{group.services.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {viewMode === 'grid' ? (
                    /* ── Grid View ─────────────────────────────────────────── */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {group.services.map((svc) => (
                        <ServiceCard
                          key={svc.id}
                          service={svc}
                          isExpanded={expandedCards.has(svc.id)}
                          onToggleExpand={() => toggleExpanded(svc.id)}
                          onEdit={() => onEdit?.(svc.id)}
                          onToggle={() => onToggle?.(svc.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    /* ── List View ─────────────────────────────────────────── */
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none overflow-hidden">
                      {/* Table header */}
                      <div className="grid grid-cols-[1fr_100px_90px_80px_70px_90px] gap-3 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        <span>Service</span>
                        <span className="text-right">Price</span>
                        <span className="text-center">TAT</span>
                        <span className="text-center">Docs</span>
                        <span className="text-center">Status</span>
                        <span className="text-right">Actions</span>
                      </div>
                      {group.services.map((svc, idx) => (
                        <ServiceRow
                          key={svc.id}
                          service={svc}
                          isLast={idx === group.services.length - 1}
                          onEdit={() => onEdit?.(svc.id)}
                          onToggle={() => onToggle?.(svc.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// Sub-components
// ===========================================================================

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent: string }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3">
      <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500 mb-1.5">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xl font-bold tracking-tight font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] ${accent}`}>
        {value}
      </p>
    </div>
  )
}

// ── Service Card (Grid) ─────────────────────────────────────────────────────

function ServiceCard({
  service,
  isExpanded,
  onToggleExpand,
  onEdit,
  onToggle,
}: {
  service: Service
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit?: () => void
  onToggle?: () => void
}) {
  const catColor = CATEGORY_COLORS[service.category]

  return (
    <div
      className={`bg-white dark:bg-neutral-900 border rounded-xl transition-all ${
        service.isActive
          ? 'border-neutral-200 dark:border-neutral-800'
          : 'border-dashed border-neutral-300 dark:border-neutral-700 opacity-70'
      }`}
    >
      {/* Card header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${catColor.bg} ${catColor.text}`}>
                {service.category === 'Succession Certificate' ? 'Succession' : service.category}
              </span>
              {!service.isActive && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400">
                  Inactive
                </span>
              )}
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mt-2 leading-tight">{service.name}</h3>
          </div>
          <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] shrink-0">
            {formatCurrency(service.basePrice)}
          </span>
        </div>

        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed line-clamp-2">{service.description}</p>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400 dark:text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {service.estimatedTAT}
          </span>
          <span className="inline-flex items-center gap-1">
            <FileCheck size={12} />
            {service.documentChecklist.length} doc{service.documentChecklist.length !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1">
            <IndianRupee size={12} />
            GST {service.taxRate}%
          </span>
        </div>
      </div>

      {/* Expandable: Document checklist */}
      {service.documentChecklist.length > 0 && (
        <>
          <button
            onClick={onToggleExpand}
            className="w-full flex items-center justify-center gap-1 px-5 py-2 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 border-t border-neutral-100 dark:border-neutral-800 transition-colors cursor-pointer"
          >
            <FileText size={12} />
            Document Checklist
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {isExpanded && (
            <div className="px-5 pb-4 border-t border-neutral-100 dark:border-neutral-800">
              <ul className="space-y-1.5 pt-3">
                {service.documentChecklist.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Card actions */}
      <div className="flex items-center border-t border-neutral-100 dark:border-neutral-800 divide-x divide-neutral-100 dark:divide-neutral-800">
        <button
          onClick={onEdit}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-colors cursor-pointer"
        >
          <Pencil size={12} />
          Edit
        </button>
        <button
          onClick={onToggle}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
            service.isActive
              ? 'text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
          }`}
        >
          {service.isActive ? (
            <>
              <ToggleRight size={14} />
              Deactivate
            </>
          ) : (
            <>
              <ToggleLeft size={14} />
              Activate
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Service Row (List) ──────────────────────────────────────────────────────

function ServiceRow({
  service,
  isLast,
  onEdit,
  onToggle,
}: {
  service: Service
  isLast: boolean
  onEdit?: () => void
  onToggle?: () => void
}) {
  return (
    <div
      className={`grid grid-cols-[1fr_100px_90px_80px_70px_90px] gap-3 px-5 py-3.5 items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${
        !isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''
      } ${!service.isActive ? 'opacity-60' : ''}`}
    >
      {/* Service name + description */}
      <div className="min-w-0">
        <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">{service.name}</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">{service.description}</p>
      </div>

      {/* Price */}
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 text-right font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
        {formatCurrency(service.basePrice)}
      </p>

      {/* TAT */}
      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">{service.estimatedTAT}</p>

      {/* Docs */}
      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
        {service.documentChecklist.length}
      </p>

      {/* Status */}
      <div className="flex justify-center">
        {service.isActive ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 dark:text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Off
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={onEdit}
          className="p-1.5 text-neutral-400 hover:text-orange-500 rounded-md hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors cursor-pointer"
          title="Edit service"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            service.isActive
              ? 'text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
              : 'text-neutral-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
          }`}
          title={service.isActive ? 'Deactivate' : 'Activate'}
        >
          {service.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
        </button>
      </div>
    </div>
  )
}
