import { useState, useMemo, useEffect } from 'react'
import { useDebounce } from '@/lib/use-debounce'
import { useInitialLoading } from '@/lib/use-initial-loading'
import { Pagination } from '@/components/ui/pagination'
import { ListSkeleton } from '@/components/ui/list-skeleton'
import {
  Search,
  Plus,
  Upload,
  Download,
  Eye,
  Pencil,
  MessageSquarePlus,
  ArrowRightLeft,
  ChevronDown,
  MoreHorizontal,
  Phone,
  Mail,
  Building2,
  MapPin,
  Filter,
  X,
  Trash2,
  Send,
  Check,
  Minus,
} from 'lucide-react'
import type {
  SalesCRMProps,
  Lead,
  LeadStatus,
} from '../types'
import { LeadForm } from './LeadForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  new: {
    label: 'New',
    dot: 'bg-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-300',
  },
  assigned: {
    label: 'Assigned',
    dot: 'bg-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
  },
  'follow-up': {
    label: 'Follow-up',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
  },
  'quotation-sent': {
    label: 'Quotation Sent',
    dot: 'bg-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-700 dark:text-violet-300',
  },
  projected: {
    label: 'Projected',
    dot: 'bg-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-700 dark:text-cyan-300',
  },
  'invoice-sent': {
    label: 'Invoice Sent',
    dot: 'bg-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  won: {
    label: 'Won',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  lost: {
    label: 'Lost',
    dot: 'bg-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
  },
}

const TAB_ORDER: Array<'all' | LeadStatus> = [
  'all',
  'new',
  'assigned',
  'follow-up',
  'quotation-sent',
  'projected',
  'invoice-sent',
  'won',
  'lost',
]

const TAB_LABELS: Record<string, string> = {
  all: 'All Leads',
  new: 'New',
  assigned: 'Assigned',
  'follow-up': 'Follow-up',
  'quotation-sent': 'Quotation Sent',
  projected: 'Projected',
  'invoice-sent': 'Invoice Sent',
  won: 'Won',
  lost: 'Lost',
}

const SOURCE_COLORS: Record<string, string> = {
  Website: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  Referral: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  'Wealth Manager': 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  'Walk-in': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  Campaign: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// LeadsList Component
// ---------------------------------------------------------------------------

export function LeadsList({
  leads,
  statusCounts,
  wealthManagers,
  onViewLead,
  onEditLead,
  onDeleteLead,
  onCreateLead,
  onImportLeads,
  onExportLeads,
  onAddFollowUp,
  onAssignToAccounts,
}: SalesCRMProps) {
  const [activeTab, setActiveTab] = useState<'all' | LeadStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 250)
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [employeeFilter, setEmployeeFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null)

  const isLoading = useInitialLoading()

  // Bulk-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [statusOverrides, setStatusOverrides] = useState<Record<string, LeadStatus>>({})
  const [bulkMoveConfirm, setBulkMoveConfirm] = useState<{ open: boolean; status: LeadStatus | null }>({ open: false, status: null })
  const getStatus = (lead: Lead): LeadStatus => statusOverrides[lead.id] ?? lead.status

  // Modal states
  const [editModal, setEditModal] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null })
  const [followUpModal, setFollowUpModal] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null })
  const [sendQuotationModal, setSendQuotationModal] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null })
  const [importModal, setImportModal] = useState(false)

  // Follow-up form state
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpType, setFollowUpType] = useState<'Call' | 'Email' | 'Meeting' | 'WhatsApp'>('Call')
  const [followUpNotes, setFollowUpNotes] = useState('')

  // Send quotation form state
  const [quotationVia, setQuotationVia] = useState<'email' | 'whatsapp'>('email')
  const [quotationMessage, setQuotationMessage] = useState('')

  // Derived data
  const employees = useMemo(() => {
    const set = new Set(leads.map((l) => l.assignedEmployee).filter(Boolean))
    return Array.from(set).sort()
  }, [leads])

  const sources = useMemo(() => {
    const set = new Set(leads.map((l) => l.source))
    return Array.from(set).sort()
  }, [leads])

  const filteredLeads = useMemo(() => {
    let result = leads

    // Status tab filter (uses override if set)
    if (activeTab !== 'all') {
      result = result.filter((l) => getStatus(l) === activeTab)
    }

    // Search (debounced)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.wealthManagerName.toLowerCase().includes(q)
      )
    }

    // Source filter
    if (sourceFilter) {
      result = result.filter((l) => l.source === sourceFilter)
    }

    // Employee filter
    if (employeeFilter) {
      result = result.filter((l) => l.assignedEmployee === employeeFilter)
    }

    return result
  }, [leads, activeTab, debouncedSearch, sourceFilter, employeeFilter, statusOverrides])

  // Override-aware status counts (so tab badges reflect bulk moves)
  const effectiveStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length }
    leads.forEach((l) => {
      const s = getStatus(l)
      counts[s] = (counts[s] ?? 0) + 1
    })
    return counts
  }, [leads, statusOverrides])

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, sourceFilter, employeeFilter, activeTab, pageSize])
  const pagedLeads = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredLeads.slice(start, start + pageSize)
  }, [filteredLeads, page, pageSize])

  // Bulk-select helpers
  const allFilteredSelected =
    filteredLeads.length > 0 && filteredLeads.every((l) => selectedIds.has(l.id))
  const someFilteredSelected =
    !allFilteredSelected && filteredLeads.some((l) => selectedIds.has(l.id))

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredLeads.forEach((l) => next.delete(l.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredLeads.forEach((l) => next.add(l.id))
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

  function bulkMoveToStatus(status: LeadStatus) {
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
      `${count} lead${count === 1 ? '' : 's'} moved`,
      `Stage updated to ${TAB_LABELS[status] ?? status}`,
    )
  }

  function requestBulkMove(status: LeadStatus) {
    if (selectedIds.size >= 5) {
      setBulkMoveConfirm({ open: true, status })
    } else {
      bulkMoveToStatus(status)
    }
  }

  const hasActiveFilters = sourceFilter || employeeFilter
  const activeFilterCount = [sourceFilter, employeeFilter].filter(Boolean).length

  // Modal handlers
  const openEditModal = (lead: Lead) => {
    setEditModal({ open: true, lead })
  }

  const openDeleteModal = (lead: Lead) => {
    setDeleteModal({ open: true, lead })
  }

  const openFollowUpModal = (lead: Lead) => {
    setFollowUpDate('')
    setFollowUpType('Call')
    setFollowUpNotes('')
    setFollowUpModal({ open: true, lead })
  }

  const openSendQuotationModal = (lead: Lead) => {
    setQuotationVia('email')
    setQuotationMessage('')
    setSendQuotationModal({ open: true, lead })
  }

  if (editModal.open && editModal.lead) {
    const employeeOptions = Array.from(
      new Set(leads.map((l) => l.assignedEmployee).filter(Boolean)),
    ).sort()
    return (
      <LeadForm
        lead={editModal.lead}
        wealthManagers={wealthManagers}
        employees={employeeOptions}
        onSave={() => {
          if (editModal.lead) {
            onEditLead?.(editModal.lead.id)
            toast.success('Lead updated', `${editModal.lead.name}'s details saved`)
          }
          setEditModal({ open: false, lead: null })
        }}
        onCancel={() => setEditModal({ open: false, lead: null })}
      />
    )
  }

  if (isLoading) return <ListSkeleton kpis={4} rows={6} />

  return (
    <div className="space-y-6 pb-8">
      {/* ----------------------------------------------------------------- */}
      {/* Page Header                                                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Sales CRM
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-[7px] text-[12px] font-medium text-neutral-600 transition-all hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-700"
          >
            <Upload size={13} strokeWidth={2} />
            Import
          </button>
          <button
            onClick={() => onExportLeads?.()}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-[7px] text-[12px] font-medium text-neutral-600 transition-all hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-700"
          >
            <Download size={13} strokeWidth={2} />
            Export
          </button>
          <button
            onClick={() => onCreateLead?.()}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3.5 py-[7px] text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-orange-500 hover:shadow-md active:scale-[0.98]"
          >
            <Plus size={14} strokeWidth={2.5} />
            Add Lead
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Status Tabs                                                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="border-b border-neutral-200 dark:border-neutral-700/60">
        <div className="-mb-px flex gap-0 overflow-x-auto">
          {TAB_ORDER.map((tab) => {
            const count = effectiveStatusCounts[tab as string] ?? 0
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-[12px] font-medium transition-colors ${
                  isActive
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                {TAB_LABELS[tab]}
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                  style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                >
                  {count}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-orange-500" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Search & Filters Bar                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={14}
            strokeWidth={2}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Search by name, ID, email, phone, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-[36px] w-full rounded-lg border border-neutral-200 bg-white pl-8 pr-3 text-[12px] text-neutral-800 placeholder-neutral-400 outline-none transition-colors focus:border-orange-300 focus:ring-2 focus:ring-orange-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder-neutral-500 dark:focus:border-orange-700 dark:focus:ring-orange-900/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-[36px] items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-all ${
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

      {/* Expanded filter row */}
      {hasActiveFilters && !showFilters && (
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mr-1">
            Active filters
          </span>
          {sourceFilter && (
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
              Source: {sourceFilter}
              <button
                onClick={() => setSourceFilter('')}
                className="ml-0.5 inline-flex items-center justify-center rounded-full p-0.5 hover:bg-orange-100 dark:hover:bg-orange-900/40 cursor-pointer"
                aria-label={`Clear filter Source: ${sourceFilter}`}
              >
                <X size={10} />
              </button>
            </span>
          )}
          {employeeFilter && (
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
              Assignee: {employeeFilter}
              <button
                onClick={() => setEmployeeFilter('')}
                className="ml-0.5 inline-flex items-center justify-center rounded-full p-0.5 hover:bg-orange-100 dark:hover:bg-orange-900/40 cursor-pointer"
                aria-label={`Clear filter Assignee: ${employeeFilter}`}
              >
                <X size={10} />
              </button>
            </span>
          )}
          <button
            onClick={() => { setSourceFilter(''); setEmployeeFilter('') }}
            className="ml-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {showFilters && (
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
          {/* Source filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              Source
            </span>
            <div className="relative">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="h-[30px] appearance-none rounded-md border border-neutral-200 bg-white pl-2.5 pr-7 text-[12px] text-neutral-700 outline-none focus:border-orange-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                <option value="">All Sources</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400"
              />
            </div>
          </div>

          {/* Employee filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              Assigned To
            </span>
            <div className="relative">
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="h-[30px] appearance-none rounded-md border border-neutral-200 bg-white pl-2.5 pr-7 text-[12px] text-neutral-700 outline-none focus:border-orange-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                <option value="">All Employees</option>
                {employees.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400"
              />
            </div>
          </div>

          {/* Clear all */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSourceFilter('')
                setEmployeeFilter('')
              }}
              className="ml-auto flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
            >
              <X size={12} />
              Clear filters
            </button>
          )}
        </div>
      )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Bulk Action Bar                                                   */}
      {/* ----------------------------------------------------------------- */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 dark:border-orange-800 dark:bg-orange-950/30">
          <span className="text-[12px] font-medium text-orange-700 dark:text-orange-300">
            {selectedIds.size} selected
          </span>

          <div className="ml-2 flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-orange-600/70 dark:text-orange-400/70">
              Move to
            </span>
            <div className="relative">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) requestBulkMove(e.target.value as LeadStatus)
                }}
                className="h-[30px] appearance-none rounded-md border border-orange-200 bg-white pl-2.5 pr-7 text-[12px] font-medium text-orange-700 outline-none focus:border-orange-400 dark:border-orange-700 dark:bg-neutral-900 dark:text-orange-300"
              >
                <option value="">Select stage…</option>
                {TAB_ORDER.filter((t) => t !== 'all').map((s) => (
                  <option key={s} value={s}>{TAB_LABELS[s]}</option>
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

      {/* ----------------------------------------------------------------- */}
      {/* Data Table                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-800/60">
        {/* Table header */}
        <div className="hidden lg:grid grid-cols-[40px_80px_90px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_100px_80px_40px] gap-4 items-center border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 dark:border-neutral-700/50 dark:bg-neutral-800 sticky top-0 z-10">
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
          {[
            'Lead ID',
            'Source',
            'Contact',
            'Company',
            'Employee Assigned',
            'Service',
            'Status',
            'Activity',
            '',
          ].map((heading) => (
            <span
              key={heading}
              className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
            >
              {heading}
            </span>
          ))}
        </div>

        {/* Table rows */}
        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <Search size={20} className="text-neutral-400" />
            </div>
            <p className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
              {leads.length === 0 ? 'No leads yet' : 'No leads found'}
            </p>
            <p className="mt-0.5 text-[12px] text-neutral-400 dark:text-neutral-500">
              {leads.length === 0
                ? 'Get started by creating your first lead'
                : searchQuery || hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : activeTab !== 'all'
                    ? 'No leads in this stage'
                    : 'No leads match your criteria'}
            </p>
            {leads.length === 0 ? (
              <button
                onClick={() => onCreateLead?.()}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus size={13} />
                Add your first lead
              </button>
            ) : (searchQuery || hasActiveFilters) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSourceFilter('')
                  setEmployeeFilter('')
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors cursor-pointer"
              >
                Clear search & filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-700/40">
            {pagedLeads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={{ ...lead, status: getStatus(lead) }}
                selected={selectedIds.has(lead.id)}
                onToggleSelect={() => toggleSelectOne(lead.id)}
                isActionMenuOpen={openActionMenu === lead.id}
                onToggleActionMenu={() =>
                  setOpenActionMenu(openActionMenu === lead.id ? null : lead.id)
                }
                onCloseActionMenu={() => setOpenActionMenu(null)}
                onView={() => onViewLead?.(lead.id)}
                onEdit={() => openEditModal(lead)}
                onDelete={() => openDeleteModal(lead)}
                onFollowUp={() => openFollowUpModal(lead)}
                onSendQuotation={() => openSendQuotationModal(lead)}
                onAssignToAccounts={() => onAssignToAccounts?.(lead.id)}
              />
            ))}
          </div>
        )}

        {/* Table footer — pagination */}
        {filteredLeads.length > 0 && (
          <div className="border-t border-neutral-100 dark:border-neutral-700/50">
            <Pagination
              page={page}
              pageSize={pageSize}
              totalItems={filteredLeads.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="leads"
            />
          </div>
        )}
      </div>


      {/* ----------------------------------------------------------------- */}
      {/* Delete Confirmation Modal                                         */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ open, lead: open ? deleteModal.lead : null })}>
        <DialogContent
          className="sm:max-w-md bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (deleteModal.lead) {
                onDeleteLead?.(deleteModal.lead.id)
                toast.success('Lead deleted', `${deleteModal.lead.name} removed`)
              }
              setDeleteModal({ open: false, lead: null })
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Delete Lead</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Are you sure you want to delete <span className="font-semibold text-neutral-700 dark:text-neutral-200">{deleteModal.lead?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setDeleteModal({ open: false, lead: null })}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (deleteModal.lead) {
                  onDeleteLead?.(deleteModal.lead.id)
                  toast.success('Lead deleted', `${deleteModal.lead.name} removed`)
                }
                setDeleteModal({ open: false, lead: null })
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Delete <span className="ml-1 text-[10px] text-red-100/80 font-mono">↵</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Bulk Move Confirm                                                 */}
      {/* ----------------------------------------------------------------- */}
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
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Move {selectedIds.size} leads?</DialogTitle>
            <DialogDescription className="text-neutral-600 dark:text-neutral-400">
              This will update the stage of <span className="font-semibold text-neutral-700 dark:text-neutral-200">{selectedIds.size} selected lead{selectedIds.size === 1 ? '' : 's'}</span> to{' '}
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                {bulkMoveConfirm.status ? (TAB_LABELS[bulkMoveConfirm.status] ?? bulkMoveConfirm.status) : ''}
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
              Move {selectedIds.size} lead{selectedIds.size === 1 ? '' : 's'} <span className="ml-1 text-[10px] text-orange-100/80 font-mono">↵</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Add Follow-up Modal                                               */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={followUpModal.open} onOpenChange={(open) => setFollowUpModal({ open, lead: open ? followUpModal.lead : null })}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Add Follow-up</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Schedule a follow-up for {followUpModal.lead?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Type</label>
              <select
                value={followUpType}
                onChange={(e) => setFollowUpType(e.target.value as 'Call' | 'Email' | 'Meeting' | 'WhatsApp')}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Meeting">Meeting</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Notes</label>
              <textarea
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                rows={3}
                placeholder="Add notes about this follow-up..."
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setFollowUpModal({ open: false, lead: null })}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (followUpModal.lead) {
                  onAddFollowUp?.(followUpModal.lead.id)
                }
                setFollowUpModal({ open: false, lead: null })
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 transition-colors"
            >
              Save Follow-up
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Send Quotation Modal                                              */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={sendQuotationModal.open} onOpenChange={(open) => setSendQuotationModal({ open, lead: open ? sendQuotationModal.lead : null })}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Send Quotation</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Send a quotation to {sendQuotationModal.lead?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Send via</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="quotationVia"
                    value="email"
                    checked={quotationVia === 'email'}
                    onChange={() => setQuotationVia('email')}
                    className="accent-orange-500"
                  />
                  <Mail size={14} className="text-neutral-500 dark:text-neutral-400" />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="quotationVia"
                    value="whatsapp"
                    checked={quotationVia === 'whatsapp'}
                    onChange={() => setQuotationVia('whatsapp')}
                    className="accent-orange-500"
                  />
                  <Phone size={14} className="text-neutral-500 dark:text-neutral-400" />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">WhatsApp</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Message</label>
              <textarea
                value={quotationMessage}
                onChange={(e) => setQuotationMessage(e.target.value)}
                rows={4}
                placeholder="Add a personal message to accompany the quotation..."
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setSendQuotationModal({ open: false, lead: null })}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (sendQuotationModal.lead) {
                  // Using lead id as a quotation reference for the callback
                  onCreateQuotation?.(sendQuotationModal.lead.id)
                }
                setSendQuotationModal({ open: false, lead: null })
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Send size={14} />
                Send Quotation
              </span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Import Leads Modal                                                */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={importModal} onOpenChange={setImportModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Import Leads</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Upload a CSV or Excel file to import leads in bulk.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-8 transition-colors hover:border-orange-400 dark:hover:border-orange-600">
              <Upload size={32} className="mb-3 text-neutral-400 dark:text-neutral-500" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Drop your file here or click to browse
              </p>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                Supports .csv, .xlsx, .xls (max 5MB)
              </p>
              <button className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 transition-colors">
                Choose File
              </button>
            </div>
            <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-3">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Required columns:</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                Name, Phone, Email, Source, Service Interest
              </p>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setImportModal(false)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onImportLeads?.()
                setImportModal(false)
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 transition-colors"
            >
              Import
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// LeadRow — Individual table row
// ---------------------------------------------------------------------------

interface LeadRowProps {
  lead: Lead
  selected: boolean
  onToggleSelect: () => void
  isActionMenuOpen: boolean
  onToggleActionMenu: () => void
  onCloseActionMenu: () => void
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onFollowUp?: () => void
  onSendQuotation?: () => void
  onAssignToAccounts?: () => void
}

function LeadRow({
  lead,
  selected,
  onToggleSelect,
  isActionMenuOpen,
  onToggleActionMenu,
  onCloseActionMenu,
  onView,
  onEdit,
  onDelete,
  onFollowUp,
  onSendQuotation,
  onAssignToAccounts,
}: LeadRowProps) {
  const status = STATUS_CONFIG[lead.status]
  const sourceColor = SOURCE_COLORS[lead.source] ?? 'bg-neutral-100 text-neutral-600'

  return (
    <>
    {/* ── Mobile card (< lg) ──────────────────────────────────────────── */}
    <div
      className={`lg:hidden px-4 py-3 transition-colors hover:bg-orange-50/30 dark:hover:bg-orange-950/10 cursor-pointer ${
        selected ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''
      }`}
      onClick={onView}
    >
      <div className="flex items-start gap-3">
        <div onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleSelect}
            aria-label={selected ? 'Deselect lead' : 'Select lead'}
            className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded border transition-colors cursor-pointer ${
              selected
                ? 'border-orange-500 bg-orange-500'
                : 'border-neutral-300 dark:border-neutral-600 hover:border-orange-400'
            }`}
          >
            {selected && <Check size={10} className="text-white" strokeWidth={3} />}
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                {lead.name}
              </p>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{lead.id.replace('W24-LEAD-', 'L-')}</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${sourceColor}`}>
              {lead.source}
            </span>
            <span className="flex items-center gap-1"><Phone size={10} /> {lead.phone}</span>
            {lead.city && <span className="flex items-center gap-1"><MapPin size={10} /> {lead.city}</span>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span className="truncate">{lead.serviceInterest}</span>
            {lead.company && <span className="truncate">· {lead.company}</span>}
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleActionMenu}
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            aria-label={`Actions for ${lead.name}`}
            aria-haspopup="menu"
            aria-expanded={isActionMenuOpen}
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>
    </div>

    {/* ── Desktop row (≥ lg) ──────────────────────────────────────────── */}
    <div
      className={`group hidden lg:grid grid-cols-[40px_80px_90px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_100px_80px_40px] gap-4 items-center px-4 py-3 transition-colors hover:bg-orange-50/30 dark:hover:bg-orange-950/10 ${
        selected ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''
      }`}
      onClick={onView}
      style={{ cursor: 'pointer' }}
    >
      {/* Select checkbox */}
      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onToggleSelect}
          aria-label={selected ? 'Deselect lead' : 'Select lead'}
          className={`flex h-4 w-4 items-center justify-center rounded border transition-colors cursor-pointer ${
            selected
              ? 'border-orange-500 bg-orange-500'
              : 'border-neutral-300 dark:border-neutral-600 hover:border-orange-400'
          }`}
        >
          {selected && <Check size={10} className="text-white" strokeWidth={3} />}
        </button>
      </div>

      {/* Lead ID */}
      <div>
        <span
          className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-200"
          style={{ fontFamily: '"IBM Plex Mono", monospace' }}
        >
          {lead.id.replace('W24-LEAD-', 'L-')}
        </span>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-neutral-400">
          <MapPin size={9} />
          {lead.city}
        </div>
      </div>

      {/* Source */}
      <div>
        <span
          className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${sourceColor}`}
        >
          {lead.source}
        </span>
      </div>

      {/* Contact */}
      <div className="min-w-0 overflow-hidden">
        <p className="truncate text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
          {lead.name}
        </p>
        <div className="mt-0.5 flex items-center gap-2.5 overflow-hidden">
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-neutral-400">
            <Phone size={9} strokeWidth={2} />
            <span className="truncate">{lead.phone}</span>
          </span>
        </div>
      </div>

      {/* Company */}
      <div className="min-w-0 overflow-hidden">
        {lead.company ? (
          <>
            <p className="truncate text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
              {lead.company}
            </p>
            {lead.designation && (
              <p className="truncate text-[10px] text-neutral-400">{lead.designation}</p>
            )}
          </>
        ) : (
          <span className="text-[11px] text-neutral-300 dark:text-neutral-600">--</span>
        )}
      </div>

      {/* Employee Assigned */}
      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
          {lead.wealthManagerName}
        </p>
      </div>

      {/* Service Interest */}
      <div className="min-w-0">
        <span className="block truncate text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
          {lead.serviceInterest}
        </span>
      </div>

      {/* Status */}
      <div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.text}`}
        >
          {status.label}
        </span>
      </div>

      {/* Last Activity */}
      <div>
        <span
          className="text-[11px] text-neutral-400 dark:text-neutral-500"
          style={{ fontFamily: '"IBM Plex Mono", monospace' }}
        >
          {formatRelativeTime(lead.lastActivity)}
        </span>
      </div>

      {/* Actions */}
      <div className="relative flex justify-end" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onToggleActionMenu}
          className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
          aria-label={`Actions for ${lead.name}`}
          aria-haspopup="menu"
          aria-expanded={isActionMenuOpen}
        >
          <MoreHorizontal size={15} />
        </button>

        {isActionMenuOpen && (
          <>
            {/* Click-away overlay */}
            <div className="fixed inset-0 z-10" onClick={onCloseActionMenu} />

            {/* Dropdown */}
            <div className="absolute right-0 top-8 z-20 w-[180px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
              {[
                {
                  icon: Eye,
                  label: 'View Details',
                  action: onView,
                },
                {
                  icon: Pencil,
                  label: 'Edit Lead',
                  action: onEdit,
                },
                {
                  icon: MessageSquarePlus,
                  label: 'Add Follow-up',
                  action: onFollowUp,
                },
                {
                  icon: Send,
                  label: 'Send Quotation',
                  action: onSendQuotation,
                },
                {
                  icon: ArrowRightLeft,
                  label: 'Assign to Accounts',
                  action: onAssignToAccounts,
                },
                {
                  icon: Trash2,
                  label: 'Delete',
                  action: onDelete,
                  danger: true,
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    item.action?.()
                    onCloseActionMenu()
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors ${
                    (item as any).danger
                      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30'
                      : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700/60'
                  }`}
                >
                  <item.icon size={13} strokeWidth={2} className={(item as any).danger ? 'text-red-400' : 'text-neutral-400'} />
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
    </>
  )
}
