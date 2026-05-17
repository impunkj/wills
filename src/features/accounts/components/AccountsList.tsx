import { useState, useMemo, useEffect } from 'react'
import { useDebounce } from '@/lib/use-debounce'
import { useInitialLoading } from '@/lib/use-initial-loading'
import { Pagination } from '@/components/ui/pagination'
import { ListSkeleton } from '@/components/ui/list-skeleton'
import { formatCurrency, formatDate, timeAgo } from '@/lib/format'
import {
  Search,
  FileText,
  Receipt,
  IndianRupee,
  Send,
  UserCheck,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Download,
  MessageSquare,
  Pencil,
  X,
  Check,
  Minus,
  ChevronDown,
  Paperclip,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type {
  AccountEntry,
  AccountEntryStatus,
  KpiStats,
  StatusCounts,
} from '../types'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AccountsListProps {
  accountEntries: AccountEntry[]
  kpiStats: KpiStats
  statusCounts: StatusCounts
  onEdit?: (id: string) => void
  onFollowUp?: (id: string) => void
  onSendPI?: (id: string) => void
  onSendInvoice?: (id: string) => void
  onConvertToCustomer?: (id: string) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TabKey = 'all' | AccountEntryStatus

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pi-sent', label: 'PI Sent' },
  { key: 'payment-received', label: 'Payment Received' },
  { key: 'invoice-sent', label: 'Invoice Sent' },
  { key: 'subscription-enabled', label: 'Converted' },
]

const STATUS_CONFIG: Record<AccountEntryStatus, { label: string; dot: string; bg: string; text: string }> = {
  'pi-sent': {
    label: 'PI Sent',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
  },
  'payment-received': {
    label: 'Payment Received',
    dot: 'bg-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
  },
  'invoice-sent': {
    label: 'Invoice Sent',
    dot: 'bg-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-400',
  },
  'subscription-enabled': {
    label: 'Converted',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Modal State Types
// ---------------------------------------------------------------------------

interface EditModalState {
  entry: AccountEntry
  name: string
  amount: string
  dueDate: string
  status: AccountEntryStatus
  notes: string
}

interface FollowUpModalState {
  entryId: string
  entryName: string
  date: string
  type: 'call' | 'email' | 'meeting'
  notes: string
}

interface SendPIModalState {
  entryId: string
  entryName: string
  email: string
  message: string
  attachments: string[]
}

interface SendInvoiceModalState {
  entryId: string
  entryName: string
  email: string
  message: string
  attachments: string[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AccountsList({
  accountEntries,
  kpiStats,
  statusCounts,
  onEdit,
  onFollowUp,
  onSendPI,
  onSendInvoice,
  onConvertToCustomer,
}: AccountsListProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [statusOverrides, setStatusOverrides] = useState<Record<string, AccountEntryStatus>>({})
  const getStatus = (entry: AccountEntry): AccountEntryStatus =>
    statusOverrides[entry.id] ?? entry.status

  function changeStatus(id: string, status: AccountEntryStatus) {
    setStatusOverrides((prev) => ({ ...prev, [id]: status }))
  }

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filterWM, setFilterWM] = useState('')
  const [filterService, setFilterService] = useState('')

  const wmOptions = useMemo(() => {
    const set = new Set<string>()
    accountEntries.forEach((e) => set.add(e.wealthManagerName))
    return Array.from(set).sort()
  }, [accountEntries])

  const serviceOptions = useMemo(() => {
    const set = new Set<string>()
    accountEntries.forEach((e) => set.add(e.serviceInterest))
    return Array.from(set).sort()
  }, [accountEntries])

  const activeFilterCount = (filterWM ? 1 : 0) + (filterService ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0
  const isLoading = useInitialLoading()

  // Modal states
  const [editModal, setEditModal] = useState<EditModalState | null>(null)
  const [followUpModal, setFollowUpModal] = useState<FollowUpModalState | null>(null)
  const [sendPIModal, setSendPIModal] = useState<SendPIModalState | null>(null)
  const [sendInvoiceModal, setSendInvoiceModal] = useState<SendInvoiceModalState | null>(null)
  const [viewQuotation, setViewQuotation] = useState<AccountEntry | null>(null)

  // --- Filter ---------------------------------------------------------------

  const filtered = useMemo(() => {
    let list = accountEntries
    if (activeTab !== 'all') list = list.filter((e) => getStatus(e) === activeTab)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.leadId.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.phone.includes(q) ||
          e.company.toLowerCase().includes(q) ||
          e.wealthManagerName.toLowerCase().includes(q) ||
          e.quotationRef.toLowerCase().includes(q),
      )
    }
    if (filterWM) list = list.filter((e) => e.wealthManagerName === filterWM)
    if (filterService) list = list.filter((e) => e.serviceInterest === filterService)
    return list
  }, [accountEntries, activeTab, debouncedSearch, filterWM, filterService, statusOverrides])

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterWM, filterService, activeTab, pageSize])
  const pagedEntries = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  // Override-aware status counts so tab badges reflect status changes
  const effectiveStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: accountEntries.length }
    accountEntries.forEach((e) => {
      const s = getStatus(e)
      counts[s] = (counts[s] ?? 0) + 1
    })
    return counts
  }, [accountEntries, statusOverrides])

  const allSelected = filtered.length > 0 && filtered.every(e => selectedIds.has(e.id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // --- Modal Handlers -------------------------------------------------------

  function openEditModal(entry: AccountEntry) {
    setEditModal({
      entry,
      name: entry.name,
      amount: entry.quotationAmount.toString(),
      dueDate: entry.piSentDate,
      status: entry.status,
      notes: entry.notes,
    })
    setOpenMenu(null)
  }

  function openFollowUpModal(entry: AccountEntry) {
    setFollowUpModal({
      entryId: entry.id,
      entryName: entry.name,
      date: new Date().toISOString().split('T')[0],
      type: 'call',
      notes: '',
    })
    setOpenMenu(null)
  }

  function openSendPIModal(entry: AccountEntry) {
    setSendPIModal({
      entryId: entry.id,
      entryName: entry.name,
      email: entry.email,
      message: '',
      attachments: [],
    })
    setOpenMenu(null)
  }

  function openSendInvoiceModal(entry: AccountEntry) {
    setSendInvoiceModal({
      entryId: entry.id,
      entryName: entry.name,
      email: entry.email,
      message: '',
      attachments: [],
    })
    setOpenMenu(null)
  }

  if (isLoading) return <ListSkeleton kpis={4} rows={6} />

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Accounts
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 dark:hover:border-neutral-600 dark:hover:bg-neutral-700 transition-all cursor-pointer">
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<FileText size={16} />}
          label="Total PI Sent"
          value={kpiStats.totalPISent}
          iconBg="bg-amber-100 dark:bg-amber-900/40"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          icon={<Clock size={16} />}
          label="Pending Amount"
          value={formatCurrency(kpiStats.totalPendingAmount)}
          iconBg="bg-red-100 dark:bg-red-900/40"
          iconColor="text-red-600 dark:text-red-400"
          trend={{ direction: 'up', label: '₹1.47L' }}
        />
        <KpiCard
          icon={<IndianRupee size={16} />}
          label="Received Payment"
          value={formatCurrency(kpiStats.receivedPayment)}
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
          trend={{ direction: 'up', label: '₹3.29L' }}
        />
        <KpiCard
          icon={<Send size={16} />}
          label="Quotations Sent"
          value={kpiStats.totalQuotationsSent}
          iconBg="bg-orange-100 dark:bg-orange-900/40"
          iconColor="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-neutral-200/50 dark:bg-neutral-800 rounded-lg p-1 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            const count = effectiveStatusCounts[tab.key as string] ?? 0
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-neutral-700 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 text-[10px] font-bold tabular-nums ${
                    isActive ? 'text-orange-400 dark:text-orange-300' : 'text-neutral-400 dark:text-neutral-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search leads, quotations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-8 pr-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-[36px] items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-all cursor-pointer ${
              showFilters || hasActiveFilters
                ? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
            }`}
          >
            <Filter size={13} strokeWidth={2} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expanded filter row */}
      {hasActiveFilters && !showFilters && (
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mr-1">
            Active filters
          </span>
          {filterWM && (
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
              WM: {filterWM}
              <button
                onClick={() => setFilterWM('')}
                className="ml-0.5 inline-flex items-center justify-center rounded-full p-0.5 hover:bg-orange-100 dark:hover:bg-orange-900/40 cursor-pointer"
                aria-label={`Clear filter Wealth Manager: ${filterWM}`}
              >
                <X size={10} />
              </button>
            </span>
          )}
          {filterService && (
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
              Service: {filterService}
              <button
                onClick={() => setFilterService('')}
                className="ml-0.5 inline-flex items-center justify-center rounded-full p-0.5 hover:bg-orange-100 dark:hover:bg-orange-900/40 cursor-pointer"
                aria-label={`Clear filter Service: ${filterService}`}
              >
                <X size={10} />
              </button>
            </span>
          )}
          <button
            onClick={() => { setFilterWM(''); setFilterService('') }}
            className="ml-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {showFilters && (
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              Wealth Manager
            </span>
            <div className="relative">
              <select
                value={filterWM}
                onChange={(e) => setFilterWM(e.target.value)}
                className="h-[30px] appearance-none rounded-md border border-neutral-200 bg-white pl-2.5 pr-7 text-[12px] text-neutral-700 outline-none focus:border-orange-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                <option value="">All Wealth Managers</option>
                {wmOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              Service
            </span>
            <div className="relative">
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="h-[30px] appearance-none rounded-md border border-neutral-200 bg-white pl-2.5 pr-7 text-[12px] text-neutral-700 outline-none focus:border-orange-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                <option value="">All Services</option>
                {serviceOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => { setFilterWM(''); setFilterService('') }}
              className="ml-auto flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 cursor-pointer"
            >
              <X size={12} />
              Clear filters
            </button>
          )}
        </div>
      )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none overflow-hidden">
          {/* Table header */}
          <div className="hidden lg:grid grid-cols-[32px_90px_minmax(160px,1.5fr)_minmax(120px,1fr)_110px_120px_150px_90px_48px] gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 sticky top-0 z-10">
            <span className="flex items-center">
              <button
                onClick={toggleSelectAll}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                  allSelected
                    ? 'border-orange-500 bg-orange-500'
                    : selectedIds.size > 0
                      ? 'border-orange-500 bg-orange-500'
                      : 'border-neutral-300 dark:border-neutral-600'
                }`}
              >
                {allSelected ? <Check size={10} className="text-white" /> : selectedIds.size > 0 ? <Minus size={10} className="text-white" /> : null}
              </button>
            </span>
            <span>Lead ID</span>
            <span>Contact</span>
            <span>Wealth Manager</span>
            <span>Quotation</span>
            <span className="text-right">Amount</span>
            <span className="text-center">Status</span>
            <span className="text-center">Assigned</span>
            <span />
          </div>

          {/* Table rows */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt size={36} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="font-medium text-neutral-500 dark:text-neutral-400">
                {accountEntries.length === 0 ? 'No entries yet' : 'No entries found'}
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                {accountEntries.length === 0
                  ? 'Entries appear here once leads are assigned to accounts'
                  : search
                    ? 'Try a different search term'
                    : hasActiveFilters
                      ? 'Try clearing filters to see more results'
                      : activeTab !== 'all'
                        ? 'No entries in this status'
                        : 'No entries match your criteria'}
              </p>
              {(search || hasActiveFilters) && accountEntries.length > 0 && (
                <button
                  onClick={() => {
                    setSearch('')
                    setFilterWM('')
                    setFilterService('')
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors cursor-pointer"
                >
                  Clear search & filters
                </button>
              )}
            </div>
          ) : (
            pagedEntries.map((entry, idx) => {
              const effectiveStatus = getStatus(entry)
              const statusCfg = STATUS_CONFIG[effectiveStatus]
              const isLast = idx === pagedEntries.length - 1
              const isMenuOpen = openMenu === entry.id

              return (
                <div key={entry.id}>
                  {/* ── Mobile / Tablet card ──────────────────────── */}
                  <div
                    className={`lg:hidden px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${
                      !isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelect(entry.id)}
                          aria-label={selectedIds.has(entry.id) ? 'Deselect entry' : 'Select entry'}
                          className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                            selectedIds.has(entry.id)
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-neutral-300 dark:border-neutral-600'
                          }`}
                        >
                          {selectedIds.has(entry.id) && <Check size={10} className="text-white" />}
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{entry.name}</p>
                            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{entry.leadId.replace('W24-LEAD-', 'L-')}</p>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${statusCfg.bg} ${statusCfg.text}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                          <span>WM: {entry.wealthManagerName}</span>
                          <span>{formatCurrency(entry.quotationAmount)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setViewQuotation(entry) }}
                          className="mt-1.5 text-[11px] font-medium text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                        >
                          View quotation {entry.quotationRef.replace('W24-QT-2026-', 'QT-')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── Desktop row (≥ lg) ────────────────────────── */}
                  <div
                    className={`hidden lg:grid grid-cols-[32px_90px_minmax(160px,1.5fr)_minmax(120px,1fr)_110px_120px_150px_90px_48px] gap-2 px-5 py-3 items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${
                      !isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''
                    }`}
                  >
                  {/* Checkbox */}
                  <span className="flex items-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => toggleSelect(entry.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                        selectedIds.has(entry.id)
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      {selectedIds.has(entry.id) && <Check size={10} className="text-white" />}
                    </button>
                  </span>

                  {/* Lead ID */}
                  <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                    {entry.leadId.replace('W24-LEAD-', 'L-')}
                  </span>

                  {/* Contact */}
                  <div className="min-w-0 overflow-hidden pr-2">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{entry.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">{entry.company || entry.email}</span>
                    </div>
                  </div>

                  {/* Wealth Manager */}
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate">{entry.wealthManagerName}</p>
                  </div>

                  {/* Quotation Ref */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewQuotation(entry)
                    }}
                    className="group flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {entry.quotationRef.replace('W24-QT-2026-', 'QT-')}
                    </span>
                    <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 group-hover:underline">
                      View
                    </span>
                  </button>

                  {/* Amount */}
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 text-right font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                    {formatCurrency(entry.quotationAmount)}
                  </p>

                  {/* Status (inline change) */}
                  <div className="flex justify-center min-w-0" onClick={e => e.stopPropagation()}>
                    <div className="relative max-w-full">
                      <select
                        value={effectiveStatus}
                        onChange={(e) => changeStatus(entry.id, e.target.value as AccountEntryStatus)}
                        className={`appearance-none cursor-pointer pl-2.5 pr-6 py-0.5 rounded-full text-[10px] font-semibold border border-transparent focus:outline-none focus:ring-1 focus:ring-orange-300 max-w-full truncate ${statusCfg.bg} ${statusCfg.text}`}
                      >
                        {(Object.keys(STATUS_CONFIG) as AccountEntryStatus[]).map((s) => (
                          <option key={s} value={s} className="bg-white text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100">
                            {STATUS_CONFIG[s].label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={10} className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 ${statusCfg.text}`} />
                    </div>
                  </div>

                  {/* Assigned date */}
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center">
                    {formatDate(entry.assignedAt)}
                  </p>

                  {/* Actions */}
                  <div className="relative flex justify-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenu(isMenuOpen ? null : entry.id)}
                      className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      aria-label={`Actions for ${entry.name}`}
                      aria-haspopup="menu"
                      aria-expanded={isMenuOpen}
                    >
                      <MoreVertical size={14} />
                    </button>

                    {isMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                        <div className="absolute right-0 top-8 z-20 w-52 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg py-1.5 text-sm">
                          <MenuItem icon={<Pencil size={13} />} label="Edit" onClick={() => openEditModal(entry)} />
                          <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />
                          {(effectiveStatus === 'pi-sent' || effectiveStatus === 'payment-received') && (
                            <MenuItem icon={<FileText size={13} />} label="Send PI" onClick={() => openSendPIModal(entry)} accent />
                          )}
                          {effectiveStatus === 'payment-received' && (
                            <MenuItem icon={<Receipt size={13} />} label="Send Invoice" onClick={() => openSendInvoiceModal(entry)} accent />
                          )}
                          {(effectiveStatus === 'payment-received' || effectiveStatus === 'invoice-sent') && (
                            <>
                              <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />
                              <MenuItem icon={<UserCheck size={13} />} label="Convert to Customer" onClick={() => { onConvertToCustomer?.(entry.id); setOpenMenu(null) }} highlight />
                            </>
                          )}
                          {effectiveStatus === 'subscription-enabled' && entry.customerId && (
                            <>
                              <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />
                              <div className="px-3 py-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                                <CheckCircle2 size={12} />
                                {entry.customerId}
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  </div>
                </div>
              )
            })
          )}

          {/* Table footer — pagination */}
          {filtered.length > 0 && (
            <div className="border-t border-neutral-200 dark:border-neutral-800">
              <Pagination
                page={page}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                itemLabel="entries"
              />
            </div>
          )}
      </div>

      {/* ── Bulk Actions Tray ──────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-neutral-900 dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-700 dark:border-neutral-600">
          <span className="text-sm font-medium text-white">
            {selectedIds.size} selected
          </span>
          <div className="w-px h-5 bg-neutral-700 dark:bg-neutral-600" />
          <button
            onClick={() => { selectedIds.forEach(id => onSendPI?.(id)); setSelectedIds(new Set()) }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-700 rounded-lg hover:bg-neutral-600 transition-colors cursor-pointer"
          >
            <Send size={12} />
            Send PI
          </button>
          <button
            onClick={() => { selectedIds.forEach(id => onSendInvoice?.(id)); setSelectedIds(new Set()) }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-700 rounded-lg hover:bg-neutral-600 transition-colors cursor-pointer"
          >
            <FileText size={12} />
            Send Invoice
          </button>
          <div className="w-px h-5 bg-neutral-700 dark:bg-neutral-600" />
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Edit Account Modal ─────────────────────────────────────────── */}
      <Dialog open={editModal !== null} onOpenChange={(open) => { if (!open) setEditModal(null) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Edit Account</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Update account entry details for {editModal?.entry.name}
            </DialogDescription>
          </DialogHeader>
          {editModal && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Lead / Customer Name
                </label>
                <input
                  type="text"
                  value={editModal.name}
                  onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={editModal.amount}
                  onChange={(e) => setEditModal({ ...editModal, amount: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editModal.dueDate}
                  onChange={(e) => setEditModal({ ...editModal, dueDate: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Status
                </label>
                <select
                  value={editModal.status}
                  onChange={(e) => setEditModal({ ...editModal, status: e.target.value as AccountEntryStatus })}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                >
                  <option value="pi-sent">PI Sent</option>
                  <option value="payment-received">Payment Received</option>
                  <option value="invoice-sent">Invoice Sent</option>
                  <option value="subscription-enabled">Converted</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={editModal.notes}
                  onChange={(e) => setEditModal({ ...editModal, notes: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setEditModal(null)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (editModal) {
                  onEdit?.(editModal.entry.id)
                  setEditModal(null)
                }
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Follow-up Modal ────────────────────────────────────────────── */}
      <Dialog open={followUpModal !== null} onOpenChange={(open) => { if (!open) setFollowUpModal(null) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Schedule Follow-up</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Add a follow-up for {followUpModal?.entryName}
            </DialogDescription>
          </DialogHeader>
          {followUpModal && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={followUpModal.date}
                  onChange={(e) => setFollowUpModal({ ...followUpModal, date: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Type
                </label>
                <select
                  value={followUpModal.type}
                  onChange={(e) => setFollowUpModal({ ...followUpModal, type: e.target.value as 'call' | 'email' | 'meeting' })}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                >
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={followUpModal.notes}
                  onChange={(e) => setFollowUpModal({ ...followUpModal, notes: e.target.value })}
                  placeholder="Add any notes about this follow-up..."
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setFollowUpModal(null)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (followUpModal) {
                  onFollowUp?.(followUpModal.entryId)
                  setFollowUpModal(null)
                }
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Schedule Follow-up
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Send PI Modal ──────────────────────────────────────────────── */}
      <Dialog open={sendPIModal !== null} onOpenChange={(open) => { if (!open) setSendPIModal(null) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Send Proforma Invoice</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Send Proforma Invoice to {sendPIModal?.entryName}?
            </DialogDescription>
          </DialogHeader>
          {sendPIModal && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={sendPIModal.email}
                  onChange={(e) => setSendPIModal({ ...sendPIModal, email: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Message (optional)
                </label>
                <textarea
                  rows={3}
                  value={sendPIModal.message}
                  onChange={(e) => setSendPIModal({ ...sendPIModal, message: e.target.value })}
                  placeholder="Add a personal message to include with the invoice..."
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Attachments</label>
                {sendPIModal.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {sendPIModal.attachments.map((file, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <FileText size={11} />
                        {file}
                        <button
                          onClick={() => setSendPIModal({ ...sendPIModal, attachments: sendPIModal.attachments.filter((_, idx) => idx !== i) })}
                          className="text-neutral-400 hover:text-red-500 transition-colors cursor-pointer ml-0.5"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const names = ['Invoice.pdf', 'Quotation.pdf', 'Engagement_Letter.pdf', 'Service_Agreement.pdf', 'Tax_Certificate.pdf']
                    const randomFile = names[Math.floor(Math.random() * names.length)]
                    setSendPIModal({ ...sendPIModal, attachments: [...sendPIModal.attachments, randomFile] })
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <Paperclip size={12} />
                  Add Attachment
                </button>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setSendPIModal(null)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (sendPIModal) {
                  onSendPI?.(sendPIModal.entryId)
                  setSendPIModal(null)
                }
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Send PI
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Send Invoice Modal ─────────────────────────────────────────── */}
      <Dialog open={sendInvoiceModal !== null} onOpenChange={(open) => { if (!open) setSendInvoiceModal(null) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Send Invoice</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Send Invoice to {sendInvoiceModal?.entryName}?
            </DialogDescription>
          </DialogHeader>
          {sendInvoiceModal && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={sendInvoiceModal.email}
                  onChange={(e) => setSendInvoiceModal({ ...sendInvoiceModal, email: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Message (optional)
                </label>
                <textarea
                  rows={3}
                  value={sendInvoiceModal.message}
                  onChange={(e) => setSendInvoiceModal({ ...sendInvoiceModal, message: e.target.value })}
                  placeholder="Add a personal message to include with the invoice..."
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Attachments</label>
                {sendInvoiceModal.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {sendInvoiceModal.attachments.map((file, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <FileText size={11} />
                        {file}
                        <button
                          onClick={() => setSendInvoiceModal({ ...sendInvoiceModal, attachments: sendInvoiceModal.attachments.filter((_, idx) => idx !== i) })}
                          className="text-neutral-400 hover:text-red-500 transition-colors cursor-pointer ml-0.5"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const names = ['Invoice.pdf', 'Quotation.pdf', 'Engagement_Letter.pdf', 'Service_Agreement.pdf', 'Tax_Certificate.pdf']
                    const randomFile = names[Math.floor(Math.random() * names.length)]
                    setSendInvoiceModal({ ...sendInvoiceModal, attachments: [...sendInvoiceModal.attachments, randomFile] })
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <Paperclip size={12} />
                  Add Attachment
                </button>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setSendInvoiceModal(null)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (sendInvoiceModal) {
                  onSendInvoice?.(sendInvoiceModal.entryId)
                  setSendInvoiceModal(null)
                }
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Send Invoice
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Quotation Modal ──────────────────────────────────────── */}
      <Dialog open={viewQuotation !== null} onOpenChange={(open) => { if (!open) setViewQuotation(null) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Quotation Details</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              {viewQuotation?.name}
            </DialogDescription>
          </DialogHeader>
          {viewQuotation && (() => {
            const subtotal = viewQuotation.quotationAmount
            const taxRate = 18
            const taxAmount = Math.round((subtotal * taxRate) / 100)
            const total = subtotal + taxAmount
            const cfg = STATUS_CONFIG[getStatus(viewQuotation)]
            return (
              <div className="rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-800/40 px-5 py-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-200"
                      style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                    >
                      {viewQuotation.quotationRef}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    {formatDate(viewQuotation.piSentDate)}
                  </span>
                </div>

                <div className="mb-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-neutral-600 dark:text-neutral-300">{viewQuotation.serviceInterest}</span>
                    <span
                      className="text-neutral-500 dark:text-neutral-400"
                      style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                    >
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-neutral-100 pt-2.5 dark:border-neutral-700/40">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-neutral-500">Subtotal</span>
                    <span className="text-neutral-700 dark:text-neutral-200" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-neutral-500">GST ({taxRate}%)</span>
                    <span className="text-neutral-700 dark:text-neutral-200" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-neutral-100 pt-2 dark:border-neutral-700/50">
                    <span className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">Total</span>
                    <span className="text-[16px] font-bold text-neutral-900 dark:text-neutral-50" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[10px] text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 pt-2.5 dark:border-neutral-700/40">
                  <UserCheck size={11} />
                  <span>Wealth Manager: {viewQuotation.wealthManagerName}</span>
                </div>
              </div>
            )
          })()}
          <DialogFooter>
            <button
              onClick={() => setViewQuotation(null)}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===========================================================================
// Sub-components
// ===========================================================================

// ── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  iconBg,
  iconColor,
  trend,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  iconBg: string
  iconColor: string
  trend?: { direction: 'up' | 'down'; label: string }
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3.5">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
              trend.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            }`}
          >
            {trend.direction === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {trend.label}
          </span>
        )}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-0.5">
        {label}
      </p>
      <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
        {value}
      </p>
    </div>
  )
}

// ── Menu Item ───────────────────────────────────────────────────────────────

function MenuItem({
  icon,
  label,
  onClick,
  accent,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  accent?: boolean
  highlight?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors cursor-pointer ${
        highlight
          ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 font-medium'
          : accent
            ? 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
      }`}
    >
      <span className={highlight ? 'text-orange-500' : 'text-neutral-400 dark:text-neutral-500'}>{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  )
}
