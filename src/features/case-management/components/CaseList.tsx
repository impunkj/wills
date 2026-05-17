import { useState, useMemo, useEffect } from 'react'
import { useDebounce } from '@/lib/use-debounce'
import { useInitialLoading } from '@/lib/use-initial-loading'
import { Pagination } from '@/components/ui/pagination'
import { ListSkeleton } from '@/components/ui/list-skeleton'
import { formatDate, timeAgo } from '@/lib/format'
import {
  Search,
  Briefcase,
  CheckCircle2,
  Clock,
  Pause,
  TrendingUp,
  MoreVertical,
  Eye,
  Pencil,
  Plus,
  Filter,
  Download,
  ChevronDown,
  ArrowUpDown,
  Scale,
  FileText,
  UserCircle,
  X,
  Check,
  Minus,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import type {
  CaseListProps,
  Case,
  CaseStatus,
  CasePriority,
  CaseKpiStats,
} from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TabKey = 'all' | CaseStatus

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All Cases' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'on-hold', label: 'On Hold' },
]

const BULK_MOVE_STATUSES: CaseStatus[] = ['in-progress', 'completed', 'on-hold']

const STATUS_CONFIG: Record<CaseStatus, { label: string; dot: string; bg: string; text: string }> = {
  'in-progress': { label: 'In Progress', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' },
  drafting: { label: 'Drafting', dot: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400' },
  'under-review': { label: 'Under Review', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  approved: { label: 'Approved', dot: 'bg-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400' },
  completed: { label: 'Completed', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  'on-hold': { label: 'On Hold', dot: 'bg-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400' },
}

type SortKey = 'lastUpdated' | 'customerName' | 'priority'
type SortDir = 'asc' | 'desc'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

const INITIAL_COLORS = [
  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
]

function getInitialColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length]
}

function priorityWeight(p: CasePriority) {
  return p === 'high' ? 3 : p === 'normal' ? 2 : 1
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CaseList({
  cases,
  kpiStats,
  statusCounts,
  onView,
  onEdit,
  onCreate,
}: CaseListProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('lastUpdated')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // Bulk-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [statusOverrides, setStatusOverrides] = useState<Record<string, CaseStatus>>({})
  const [lawyerOverrides, setLawyerOverrides] = useState<Record<string, string>>({})
  const [employeeOverrides, setEmployeeOverrides] = useState<Record<string, string>>({})
  const [bulkMoveConfirm, setBulkMoveConfirm] = useState<{ open: boolean; status: CaseStatus | null }>({ open: false, status: null })
  const [bulkLawyerConfirm, setBulkLawyerConfirm] = useState<{ open: boolean; lawyer: string | null }>({ open: false, lawyer: null })
  const [bulkEmployeeConfirm, setBulkEmployeeConfirm] = useState<{ open: boolean; employee: string | null }>({ open: false, employee: null })
  const getStatus = (cs: Case): CaseStatus => statusOverrides[cs.id] ?? cs.status
  const getLawyer = (cs: Case): string => lawyerOverrides[cs.id] ?? cs.assignedLawyer
  const getEmployee = (cs: Case): string => employeeOverrides[cs.id] ?? cs.assignedEmployee
  const isLoading = useInitialLoading()

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filterLawyer, setFilterLawyer] = useState('')
  const [filterServiceType, setFilterServiceType] = useState('')

  const lawyerOptions = useMemo(() => {
    const set = new Set<string>()
    cases.forEach((c) => set.add(c.assignedLawyer))
    Object.values(lawyerOverrides).forEach((l) => set.add(l))
    return Array.from(set).sort()
  }, [cases, lawyerOverrides])

  const employeeOptions = useMemo(() => {
    const set = new Set<string>()
    cases.forEach((c) => set.add(c.assignedEmployee))
    Object.values(employeeOverrides).forEach((e) => set.add(e))
    return Array.from(set).sort()
  }, [cases, employeeOverrides])

  const serviceTypeOptions = useMemo(() => {
    const set = new Set<string>()
    cases.forEach((c) => set.add(c.serviceType))
    return Array.from(set).sort()
  }, [cases])

  const activeFilterCount =
    (filterLawyer ? 1 : 0) + (filterServiceType ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0

  // Modal state
  const [editModal, setEditModal] = useState<{ open: boolean; item: Case | null }>({ open: false, item: null })

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editType, setEditType] = useState('')
  const [editStatus, setEditStatus] = useState<CaseStatus>('in-progress')
  const [editLawyer, setEditLawyer] = useState('')
  const [editEmployee, setEditEmployee] = useState('')
  const [editDescription, setEditDescription] = useState('')

  function openEditModal(cs: Case) {
    setEditTitle(cs.serviceName)
    setEditType(cs.serviceType)
    setEditStatus(getStatus(cs))
    setEditLawyer(getLawyer(cs))
    setEditEmployee(getEmployee(cs))
    setEditDescription(cs.description)
    setEditModal({ open: true, item: cs })
  }

  function handleEditSave() {
    if (editModal.item) {
      const id = editModal.item.id
      const original = editModal.item
      if (editLawyer && editLawyer !== original.assignedLawyer) {
        setLawyerOverrides((prev) => ({ ...prev, [id]: editLawyer }))
      }
      if (editEmployee && editEmployee !== original.assignedEmployee) {
        setEmployeeOverrides((prev) => ({ ...prev, [id]: editEmployee }))
      }
      if (editStatus !== original.status) {
        setStatusOverrides((prev) => ({ ...prev, [id]: editStatus }))
      }
      onEdit?.(id)
      toast.success('Case updated', `${original.customerName}'s case saved`)
    }
    setEditModal({ open: false, item: null })
  }

  // --- Filter & Sort --------------------------------------------------------

  const filtered = useMemo(() => {
    let list = cases

    if (activeTab !== 'all') list = list.filter((c) => getStatus(c) === activeTab)

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.customerId.toLowerCase().includes(q) ||
          c.serviceType.toLowerCase().includes(q) ||
          c.assignedLawyer.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      )
    }

    if (filterLawyer) list = list.filter((c) => c.assignedLawyer === filterLawyer)
    if (filterServiceType) list = list.filter((c) => c.serviceType === filterServiceType)

    list = [...list].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'lastUpdated':
          cmp = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
          break
        case 'customerName':
          cmp = a.customerName.localeCompare(b.customerName)
          break
        case 'priority':
          cmp = priorityWeight(a.priority) - priorityWeight(b.priority)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [cases, activeTab, debouncedSearch, sortKey, sortDir, filterLawyer, filterServiceType, statusOverrides])

  // Override-aware status counts (so tab badges reflect bulk moves)
  const effectiveStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: cases.length }
    cases.forEach((c) => {
      const s = getStatus(c)
      counts[s] = (counts[s] ?? 0) + 1
    })
    return counts
  }, [cases, statusOverrides])

  // Bulk-select helpers
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))
  const someFilteredSelected =
    !allFilteredSelected && filtered.some((c) => selectedIds.has(c.id))

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterLawyer, filterServiceType, activeTab, pageSize])
  const pagedCases = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((c) => next.delete(c.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((c) => next.add(c.id))
        return next
      })
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function bulkMoveToStatus(status: CaseStatus) {
    const count = selectedIds.size
    setStatusOverrides((prev) => {
      const next = { ...prev }
      selectedIds.forEach((id) => {
        next[id] = status
      })
      return next
    })
    clearSelection()
    toast.success(
      `${count} case${count === 1 ? '' : 's'} moved`,
      `Status updated to ${STATUS_CONFIG[status]?.label ?? status}`,
    )
  }

  function requestBulkMove(status: CaseStatus) {
    if (selectedIds.size >= 5) {
      setBulkMoveConfirm({ open: true, status })
    } else {
      bulkMoveToStatus(status)
    }
  }

  function bulkAssignLawyer(name: string) {
    const count = selectedIds.size
    setLawyerOverrides((prev) => {
      const next = { ...prev }
      selectedIds.forEach((id) => { next[id] = name })
      return next
    })
    clearSelection()
    toast.success(
      `${count} case${count === 1 ? '' : 's'} reassigned`,
      `Lawyer set to ${name}`,
    )
  }

  function requestBulkLawyer(name: string) {
    if (selectedIds.size >= 5) setBulkLawyerConfirm({ open: true, lawyer: name })
    else bulkAssignLawyer(name)
  }

  function bulkAssignEmployee(name: string) {
    const count = selectedIds.size
    setEmployeeOverrides((prev) => {
      const next = { ...prev }
      selectedIds.forEach((id) => { next[id] = name })
      return next
    })
    clearSelection()
    toast.success(
      `${count} case${count === 1 ? '' : 's'} reassigned`,
      `Employee set to ${name}`,
    )
  }

  function requestBulkEmployee(name: string) {
    if (selectedIds.size >= 5) setBulkEmployeeConfirm({ open: true, employee: name })
    else bulkAssignEmployee(name)
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  if (isLoading) return <ListSkeleton kpis={4} rows={6} />

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            All Cases
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 dark:hover:border-neutral-600 dark:hover:bg-neutral-700 transition-all cursor-pointer">
            <Download size={13} />
            Export
          </button>
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-500 transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={13} />
            Add New Case
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard
          icon={<Briefcase size={16} />}
          label="Total Cases"
          value={kpiStats.totalCases}
          iconBg="bg-orange-100 dark:bg-orange-900/40"
          iconColor="text-orange-600 dark:text-orange-400"
        />
        <KpiCard
          icon={<Clock size={16} />}
          label="Active"
          value={kpiStats.activeCases}
          iconBg="bg-blue-100 dark:bg-blue-900/40"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          icon={<CheckCircle2 size={16} />}
          label="Completed"
          value={kpiStats.completedCases}
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          icon={<TrendingUp size={16} />}
          label="Avg. Resolution"
          value={`${kpiStats.avgResolutionDays}d`}
          iconBg="bg-violet-100 dark:bg-violet-900/40"
          iconColor="text-violet-600 dark:text-violet-400"
        />
        <KpiCard
          icon={<Pause size={16} />}
          label="On Hold"
          value={kpiStats.onHold}
          iconBg="bg-neutral-200 dark:bg-neutral-700"
          iconColor="text-neutral-500 dark:text-neutral-400"
        />
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  <span className={`ml-1.5 text-[10px] font-bold tabular-nums ${isActive ? 'text-orange-400 dark:text-orange-300' : 'text-neutral-400 dark:text-neutral-500'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search cases, customers..."
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
          {filterLawyer && (
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
              Lawyer: {filterLawyer}
              <button
                onClick={() => setFilterLawyer('')}
                className="ml-0.5 inline-flex items-center justify-center rounded-full p-0.5 hover:bg-orange-100 dark:hover:bg-orange-900/40 cursor-pointer"
                aria-label={`Clear filter Lawyer: ${filterLawyer}`}
              >
                <X size={10} />
              </button>
            </span>
          )}
          {filterServiceType && (
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
              Service: {filterServiceType}
              <button
                onClick={() => setFilterServiceType('')}
                className="ml-0.5 inline-flex items-center justify-center rounded-full p-0.5 hover:bg-orange-100 dark:hover:bg-orange-900/40 cursor-pointer"
                aria-label={`Clear filter Service: ${filterServiceType}`}
              >
                <X size={10} />
              </button>
            </span>
          )}
          <button
            onClick={() => { setFilterLawyer(''); setFilterServiceType('') }}
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
              Lawyer
            </span>
            <div className="relative">
              <select
                value={filterLawyer}
                onChange={(e) => setFilterLawyer(e.target.value)}
                className="h-[30px] appearance-none rounded-md border border-neutral-200 bg-white pl-2.5 pr-7 text-[12px] text-neutral-700 outline-none focus:border-orange-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                <option value="">All Lawyers</option>
                {lawyerOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              Service Type
            </span>
            <div className="relative">
              <select
                value={filterServiceType}
                onChange={(e) => setFilterServiceType(e.target.value)}
                className="h-[30px] appearance-none rounded-md border border-neutral-200 bg-white pl-2.5 pr-7 text-[12px] text-neutral-700 outline-none focus:border-orange-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                <option value="">All Service Types</option>
                {serviceTypeOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => { setFilterLawyer(''); setFilterServiceType('') }}
              className="ml-auto flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 cursor-pointer"
            >
              <X size={12} />
              Clear filters
            </button>
          )}
        </div>
      )}
      </div>

      {/* ── Bulk Action Bar ─────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 dark:border-orange-800 dark:bg-orange-950/30">
          <span className="text-[12px] font-medium text-orange-700 dark:text-orange-300">
            {selectedIds.size} selected
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-orange-600/70 dark:text-orange-400/70">
              Move to
            </span>
            <div className="relative">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) requestBulkMove(e.target.value as CaseStatus)
                }}
                className="h-[30px] appearance-none rounded-md border border-orange-200 bg-white pl-2.5 pr-7 text-[12px] font-medium text-orange-700 outline-none focus:border-orange-400 dark:border-orange-700 dark:bg-neutral-900 dark:text-orange-300"
              >
                <option value="">Select status…</option>
                {BULK_MOVE_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-orange-500" />
            </div>
          </div>

          <div className="h-4 w-px bg-orange-200 dark:bg-orange-800" />

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-orange-600/70 dark:text-orange-400/70 inline-flex items-center gap-1">
              <Scale size={11} />
              Lawyer
            </span>
            <div className="relative">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) requestBulkLawyer(e.target.value)
                }}
                className="h-[30px] appearance-none rounded-md border border-orange-200 bg-white pl-2.5 pr-7 text-[12px] font-medium text-orange-700 outline-none focus:border-orange-400 dark:border-orange-700 dark:bg-neutral-900 dark:text-orange-300"
              >
                <option value="">Assign lawyer…</option>
                {lawyerOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-orange-500" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-orange-600/70 dark:text-orange-400/70 inline-flex items-center gap-1">
              <UserCircle size={11} />
              Employee
            </span>
            <div className="relative">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) requestBulkEmployee(e.target.value)
                }}
                className="h-[30px] appearance-none rounded-md border border-orange-200 bg-white pl-2.5 pr-7 text-[12px] font-medium text-orange-700 outline-none focus:border-orange-400 dark:border-orange-700 dark:bg-neutral-900 dark:text-orange-300"
              >
                <option value="">Assign employee…</option>
                {employeeOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-orange-500" />
            </div>
          </div>

          <button
            onClick={clearSelection}
            className="ml-auto flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 cursor-pointer"
          >
            <X size={12} />
            Cancel
          </button>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none overflow-hidden">
          {/* Desktop header */}
          <div className="hidden lg:grid grid-cols-[40px_100px_minmax(140px,1.5fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_90px_80px_48px] gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 sticky top-0 z-10">
            <span className="flex items-center">
              <button
                onClick={toggleSelectAll}
                aria-label="Select all"
                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors cursor-pointer ${
                  allFilteredSelected || someFilteredSelected
                    ? 'border-orange-500 bg-orange-500'
                    : 'border-neutral-300 dark:border-neutral-600'
                }`}
              >
                {allFilteredSelected ? (
                  <Check size={10} className="text-white" strokeWidth={3} />
                ) : someFilteredSelected ? (
                  <Minus size={10} className="text-white" strokeWidth={3} />
                ) : null}
              </button>
            </span>
            <span>Case ID</span>
            <SortHeader label="Customer" sortKey="customerName" current={sortKey} dir={sortDir} onSort={toggleSort} />
            <span>Service Type</span>
            <span>Assigned Lawyer</span>
            <span>Employee Assigned</span>
            <span className="text-center">Status</span>
            <SortHeader label="Updated" sortKey="lastUpdated" current={sortKey} dir={sortDir} onSort={toggleSort} />
            <span />
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Briefcase size={36} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="font-medium text-neutral-500 dark:text-neutral-400">
                {cases.length === 0 ? 'No cases yet' : 'No cases found'}
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                {cases.length === 0
                  ? 'Get started by opening your first case'
                  : search
                    ? 'Try a different search term'
                    : hasActiveFilters
                      ? 'Try clearing filters to see more results'
                      : activeTab !== 'all'
                        ? 'No cases in this status'
                        : 'No cases match your criteria'}
              </p>
              {cases.length === 0 ? (
                <button
                  onClick={onCreate}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  Add your first case
                </button>
              ) : (search || hasActiveFilters) && (
                <button
                  onClick={() => {
                    setSearch('')
                    setFilterLawyer('')
                    setFilterServiceType('')
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors cursor-pointer"
                >
                  Clear search & filters
                </button>
              )}
            </div>
          ) : (
            pagedCases.map((cs, idx) => {
              const isLast = idx === pagedCases.length - 1
              const isMenuOpen = openMenu === cs.id
              const effectiveStatus = getStatus(cs)
              const statusCfg = STATUS_CONFIG[effectiveStatus]
              const isExpanded = expandedRow === cs.id
              const isSelected = selectedIds.has(cs.id)

              return (
                <div key={cs.id}>
                  {/* ── Desktop row ───────────────────────────────── */}
                  <div
                    className={`hidden lg:grid grid-cols-[40px_100px_minmax(140px,1.5fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_90px_80px_48px] gap-2 px-5 py-3.5 items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer ${
                      !isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''
                    } ${isSelected ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''}`}
                    onClick={() => onView?.(cs.id)}
                  >
                    {/* Select checkbox */}
                    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleSelectOne(cs.id)}
                        aria-label={isSelected ? 'Deselect case' : 'Select case'}
                        className={`flex h-4 w-4 items-center justify-center rounded border transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-neutral-300 dark:border-neutral-600 hover:border-orange-400'
                        }`}
                      >
                        {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                      </button>
                    </div>

                    {/* Case ID */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                        {cs.id.replace('W24-CASE-', '')}
                      </span>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getInitialColor(cs.customerName)}`}>
                        {getInitials(cs.customerName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{cs.customerName}</p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">{cs.customerId}</p>
                      </div>
                    </div>

                    {/* Service Type */}
                    <div className="min-w-0">
                      <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded truncate max-w-full" title={cs.serviceType}>
                        {cs.serviceType.length > 22 ? cs.serviceType.slice(0, 20) + '…' : cs.serviceType}
                      </span>
                    </div>

                    {/* Assigned Lawyer */}
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate">{getLawyer(cs)}</p>
                    </div>

                    {/* Employee Assigned */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${getInitialColor(getEmployee(cs))}`}>
                        {getInitials(getEmployee(cs))}
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate">{getEmployee(cs)}</p>
                    </div>

                    {/* Status */}
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${statusCfg.bg} ${statusCfg.text}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Last Updated */}
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 text-center whitespace-nowrap">
                      {formatDate(cs.lastUpdated)}
                    </p>

                    {/* Actions */}
                    <div className="relative flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenu(isMenuOpen ? null : cs.id)}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        aria-label={`Actions for ${cs.customerName}`}
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                      >
                        <MoreVertical size={14} />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg py-1.5 text-sm">
                            <MenuItem icon={<Eye size={13} />} label="View Case" onClick={() => { onView?.(cs.id); setOpenMenu(null) }} />
                            <MenuItem icon={<Pencil size={13} />} label="Edit Case" onClick={() => { openEditModal(cs); setOpenMenu(null) }} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ── Mobile / Tablet card ──────────────────────── */}
                  <div className={`lg:hidden ${!isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''} ${isSelected ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''}`}>
                    <div
                      className="px-5 py-4 cursor-pointer"
                      onClick={() => setExpandedRow(isExpanded ? null : cs.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleSelectOne(cs.id)}
                              aria-label={isSelected ? 'Deselect case' : 'Select case'}
                              className={`flex h-4 w-4 items-center justify-center rounded border transition-colors cursor-pointer ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-500'
                                  : 'border-neutral-300 dark:border-neutral-600 hover:border-orange-400'
                              }`}
                            >
                              {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                            </button>
                          </div>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getInitialColor(cs.customerName)}`}>
                            {getInitials(cs.customerName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{cs.customerName}</p>
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">{cs.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                            {statusCfg.label}
                          </span>
                          <ChevronDown size={14} className={`text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* Quick info */}
                      <div className="flex items-center gap-3 mt-2.5 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded">
                          {cs.serviceType}
                        </span>
                        <span className="flex items-center gap-1"><Scale size={10} /> {getLawyer(cs).replace('Adv. ', '')}</span>
                        <span className="flex items-center gap-1"><UserCircle size={10} /> {getEmployee(cs)}</span>
                      </div>

                    </div>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="px-5 pb-4 border-t border-neutral-100 dark:border-neutral-800/60 pt-3">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3 line-clamp-3">{cs.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-400 dark:text-neutral-500 mb-3">
                          <span>Created {formatDate(cs.createdAt)}</span>
                          <span>·</span>
                          <span>Updated {formatDate(cs.lastUpdated)}</span>
                        </div>
                        <div className="flex gap-2">
                          <MobileAction icon={<Eye size={12} />} label="View" onClick={() => onView?.(cs.id)} />
                          <MobileAction icon={<Pencil size={12} />} label="Edit" onClick={() => openEditModal(cs)} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}

          {/* Footer — pagination */}
          {filtered.length > 0 && (
            <div className="border-t border-neutral-200 dark:border-neutral-800">
              <Pagination
                page={page}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                itemLabel="cases"
              />
            </div>
          )}
      </div>

      {/* ── Edit Case Modal ───────────────────────────────────────────────── */}
      <Dialog open={editModal.open} onOpenChange={(open) => { if (!open) setEditModal({ open: false, item: null }) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Edit Case</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">Update case details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Type</label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              >
                <option value="Will Drafting">Will Drafting</option>
                <option value="Trust Formation">Trust Formation</option>
                <option value="Succession Certificate">Succession Certificate</option>
                <option value="Estate Planning">Estate Planning</option>
                <option value="Power of Attorney">Power of Attorney</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as CaseStatus)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              >
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Assigned Lawyer</label>
                <select
                  value={editLawyer}
                  onChange={(e) => setEditLawyer(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  {lawyerOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Assigned Employee</label>
                <select
                  value={editEmployee}
                  onChange={(e) => setEditEmployee(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  {employeeOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setEditModal({ open: false, item: null })}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSave}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Move Confirm ─────────────────────────────────────────── */}
      <Dialog
        open={bulkMoveConfirm.open}
        onOpenChange={(open) => setBulkMoveConfirm({ open, status: open ? bulkMoveConfirm.status : null })}
      >
        <DialogContent
          className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (bulkMoveConfirm.status) bulkMoveToStatus(bulkMoveConfirm.status)
              setBulkMoveConfirm({ open: false, status: null })
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Move {selectedIds.size} cases?</DialogTitle>
            <DialogDescription className="text-neutral-600 dark:text-neutral-400">
              This will update the status of <span className="font-semibold text-neutral-700 dark:text-neutral-200">{selectedIds.size} selected case{selectedIds.size === 1 ? '' : 's'}</span> to{' '}
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                {bulkMoveConfirm.status ? STATUS_CONFIG[bulkMoveConfirm.status]?.label ?? bulkMoveConfirm.status : ''}
              </span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setBulkMoveConfirm({ open: false, status: null })}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (bulkMoveConfirm.status) bulkMoveToStatus(bulkMoveConfirm.status)
                setBulkMoveConfirm({ open: false, status: null })
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Move {selectedIds.size} case{selectedIds.size === 1 ? '' : 's'} <span className="ml-1 text-[10px] text-orange-100/80 font-mono">↵</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Reassign Lawyer Confirm ──────────────────────────────── */}
      <Dialog
        open={bulkLawyerConfirm.open}
        onOpenChange={(open) => setBulkLawyerConfirm({ open, lawyer: open ? bulkLawyerConfirm.lawyer : null })}
      >
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Reassign {selectedIds.size} cases?</DialogTitle>
            <DialogDescription className="text-neutral-600 dark:text-neutral-400">
              This will set the assigned lawyer for{' '}
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">{selectedIds.size} selected case{selectedIds.size === 1 ? '' : 's'}</span> to{' '}
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">{bulkLawyerConfirm.lawyer ?? ''}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setBulkLawyerConfirm({ open: false, lawyer: null })}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (bulkLawyerConfirm.lawyer) bulkAssignLawyer(bulkLawyerConfirm.lawyer)
                setBulkLawyerConfirm({ open: false, lawyer: null })
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Reassign {selectedIds.size} case{selectedIds.size === 1 ? '' : 's'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Reassign Employee Confirm ────────────────────────────── */}
      <Dialog
        open={bulkEmployeeConfirm.open}
        onOpenChange={(open) => setBulkEmployeeConfirm({ open, employee: open ? bulkEmployeeConfirm.employee : null })}
      >
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Reassign {selectedIds.size} cases?</DialogTitle>
            <DialogDescription className="text-neutral-600 dark:text-neutral-400">
              This will set the assigned employee for{' '}
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">{selectedIds.size} selected case{selectedIds.size === 1 ? '' : 's'}</span> to{' '}
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">{bulkEmployeeConfirm.employee ?? ''}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setBulkEmployeeConfirm({ open: false, employee: null })}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (bulkEmployeeConfirm.employee) bulkAssignEmployee(bulkEmployeeConfirm.employee)
                setBulkEmployeeConfirm({ open: false, employee: null })
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Reassign {selectedIds.size} case{selectedIds.size === 1 ? '' : 's'}
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

function KpiCard({
  icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3.5">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">{value}</p>
    </div>
  )
}

function SortHeader({
  label,
  sortKey: key,
  current,
  dir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
}) {
  const isActive = current === key
  return (
    <button
      className="flex items-center gap-1 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
      onClick={() => onSort(key)}
      aria-label={`Sort by ${label}${isActive ? ` (currently ${dir === 'asc' ? 'ascending' : 'descending'})` : ''}`}
      aria-sort={isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span>{label}</span>
      <ArrowUpDown size={10} className={isActive ? 'text-orange-500' : 'text-neutral-300 dark:text-neutral-600'} />
    </button>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-left text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer"
    >
      <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  )
}

function MobileAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
    >
      {icon}
      {label}
    </button>
  )
}
