import { useState, useMemo, useEffect } from 'react'
import { useDebounce } from '@/lib/use-debounce'
import { useInitialLoading } from '@/lib/use-initial-loading'
import { Pagination } from '@/components/ui/pagination'
import { ListSkeleton } from '@/components/ui/list-skeleton'
import { formatCurrency, formatDate, timeAgo } from '@/lib/format'
import {
  Search,
  Users,
  Briefcase,
  Layers,
  IndianRupee,
  MoreVertical,
  Eye,
  Pencil,
  Send,
  FolderOpen,
  FileText,
  Filter,
  Download,
  ChevronDown,
  ArrowUpDown,
  MapPin,
  Building2,
  Phone,
  Mail,
  Calendar,
  UserCircle,
  X,
  Plus,
  Check,
  Upload,
  Loader2,
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
  CustomerListProps,
  Customer,
  CustomerStatus,
  KpiStats,
} from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TabKey = 'all' | CustomerStatus

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All Customers' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'pending', label: 'Pending' },
]

const STATUS_CONFIG: Record<CustomerStatus, { label: string; dot: string; bg: string; text: string }> = {
  active: {
    label: 'Active',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  inactive: {
    label: 'Inactive',
    dot: 'bg-neutral-400',
    bg: 'bg-neutral-100 dark:bg-neutral-800',
    text: 'text-neutral-600 dark:text-neutral-400',
  },
  pending: {
    label: 'Pending',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
  },
}

type SortKey = 'name' | 'convertedAt' | 'totalPayments' | 'activeCases'
type SortDir = 'asc' | 'desc'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerList({
  customers,
  kpiStats,
  statusCounts,
  onView,
  onEdit,
  onSendQuotation,
  onViewCases,
  onViewDocuments,
  onCreate,
}: CustomerListProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('convertedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filterWM, setFilterWM] = useState('')
  const [filterService, setFilterService] = useState('')

  const wmOptions = useMemo(() => {
    const set = new Set<string>()
    customers.forEach((c) => set.add(c.wealthManagerName))
    return Array.from(set).sort()
  }, [customers])

  const serviceOptions = useMemo(() => {
    const set = new Set<string>()
    customers.forEach((c) => c.servicesAvailed.forEach((s) => set.add(s)))
    return Array.from(set).sort()
  }, [customers])

  const activeFilterCount = (filterWM ? 1 : 0) + (filterService ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0
  const isLoading = useInitialLoading()

  // Modal state
  const [editModal, setEditModal] = useState<{ open: boolean; item: Customer | null }>({ open: false, item: null })
  const [quotationModal, setQuotationModal] = useState<{ open: boolean; customerId: string | null }>({ open: false, customerId: null })

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editStatus, setEditStatus] = useState<CustomerStatus>('active')
  const [editCompany, setEditCompany] = useState('')

  // Quotation form state
  const [quotationChannel, setQuotationChannel] = useState<'email' | 'whatsapp'>('email')
  const [quotationMessage, setQuotationMessage] = useState('')

  // Add Customer modal state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addStep, setAddStep] = useState<1 | 2 | 3 | 4>(1)
  // Step 1 — Profile
  const [addName, setAddName] = useState('')
  const [addDob, setAddDob] = useState('')
  const [addPan, setAddPan] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addCity, setAddCity] = useState('')
  const [addState, setAddState] = useState('')
  const [addAddress, setAddAddress] = useState('')
  const [addCompany, setAddCompany] = useState('')
  const [addDesignation, setAddDesignation] = useState('')
  const [addWealthManagerName, setAddWealthManagerName] = useState('')
  const [addNotes, setAddNotes] = useState('')
  // Step 2 — Services
  const [addServices, setAddServices] = useState<string[]>([])
  // Step 3 — Documents (file uploads — name + size captured for display)
  const [addDocuments, setAddDocuments] = useState<{ name: string; size: number }[]>([])
  // Step 4 — Initial payment (optional)
  const [addPaymentAmount, setAddPaymentAmount] = useState('')
  const [addPaymentMode, setAddPaymentMode] = useState<'' | 'neft' | 'rtgs' | 'imps' | 'upi' | 'cheque' | 'cash' | 'online-gateway'>('')
  const [addPaymentDate, setAddPaymentDate] = useState('')

  function resetAddForm() {
    setAddStep(1)
    setAddName('')
    setAddDob('')
    setAddPan('')
    setAddPhone('')
    setAddEmail('')
    setAddCity('')
    setAddState('')
    setAddAddress('')
    setAddCompany('')
    setAddDesignation('')
    setAddWealthManagerName('')
    setAddNotes('')
    setAddServices([])
    setAddDocuments([])
    setAddPaymentAmount('')
    setAddPaymentMode('')
    setAddPaymentDate('')
  }

  const profileStepValid =
    addName.trim() !== '' && addPhone.trim() !== '' && addEmail.trim() !== ''

  function toggleService(name: string) {
    setAddServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    )
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const next = Array.from(files).map((f) => ({ name: f.name, size: f.size }))
    setAddDocuments((prev) => [...prev, ...next])
    // Reset the input so the same file can be selected again if removed
    e.target.value = ''
  }

  function removeDocument(idx: number) {
    setAddDocuments((prev) => prev.filter((_, i) => i !== idx))
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)
  function handleAddSubmit() {
    if (!profileStepValid || isSubmittingAdd) return
    setIsSubmittingAdd(true)
    setTimeout(() => {
      const initialPayment = Number(addPaymentAmount) > 0 ? Number(addPaymentAmount) : 0
      const customer: Customer = {
        id: `cust_${Date.now()}`,
        leadId: '',
        accountEntryId: '',
        name: addName.trim(),
        phone: addPhone.trim(),
        email: addEmail.trim(),
        company: addCompany.trim(),
        designation: addDesignation.trim(),
        city: addCity.trim(),
        state: addState.trim(),
        address: addAddress.trim(),
        dateOfBirth: addDob,
        pan: addPan.trim().toUpperCase(),
        wealthManagerId: '',
        wealthManagerName: addWealthManagerName.trim(),
        servicesAvailed: [...addServices],
        activeCases: 0,
        totalCases: 0,
        totalPayments: initialPayment,
        pendingAmount: 0,
        status: 'active',
        convertedAt: new Date().toISOString(),
        notes: addNotes.trim(),
      }
      onCreate?.(customer)
      resetAddForm()
      setAddModalOpen(false)
      setIsSubmittingAdd(false)
    }, 600)
  }

  const SERVICE_OPTIONS = [
    'Will Drafting (Basic)',
    'Will Drafting (Advanced)',
    'Will Advisory',
    'Trust Drafting',
    'Trust Registration',
    'Trust Advisory',
    'Succession Certificate — Filing',
    'Court Representation',
  ]

  const PAYMENT_MODES: { value: typeof addPaymentMode; label: string }[] = [
    { value: '', label: 'Select mode' },
    { value: 'neft', label: 'NEFT' },
    { value: 'rtgs', label: 'RTGS' },
    { value: 'imps', label: 'IMPS' },
    { value: 'upi', label: 'UPI' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'cash', label: 'Cash' },
    { value: 'online-gateway', label: 'Online Gateway' },
  ]

  const STEPS: { key: 1 | 2 | 3 | 4; label: string }[] = [
    { key: 1, label: 'Profile' },
    { key: 2, label: 'Services' },
    { key: 3, label: 'Documents' },
    { key: 4, label: 'Payments' },
  ]

  function openEditModal(customer: Customer) {
    setEditName(customer.name)
    setEditEmail(customer.email)
    setEditPhone(customer.phone)
    setEditStatus(customer.status)
    setEditCompany(customer.company)
    setEditModal({ open: true, item: customer })
  }

  function handleEditSave() {
    if (editModal.item) {
      onEdit?.(editModal.item.id)
    }
    setEditModal({ open: false, item: null })
  }

  function openQuotationModal(customerId: string) {
    setQuotationChannel('email')
    setQuotationMessage('')
    setQuotationModal({ open: true, customerId })
  }

  function handleQuotationSend() {
    if (quotationModal.customerId) {
      onSendQuotation?.(quotationModal.customerId)
    }
    setQuotationModal({ open: false, customerId: null })
  }

  // --- Filter & Sort --------------------------------------------------------

  const filtered = useMemo(() => {
    let list = customers

    // Tab filter
    if (activeTab !== 'all') list = list.filter((c) => c.status === activeTab)

    // Search filter (debounced)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.wealthManagerName.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.servicesAvailed.some((s) => s.toLowerCase().includes(q)),
      )
    }

    // Dropdown filters
    if (filterWM) list = list.filter((c) => c.wealthManagerName === filterWM)
    if (filterService) {
      list = list.filter((c) => c.servicesAvailed.includes(filterService))
    }

    // Sort
    list = [...list].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'convertedAt':
          cmp = new Date(a.convertedAt).getTime() - new Date(b.convertedAt).getTime()
          break
        case 'totalPayments':
          cmp = a.totalPayments - b.totalPayments
          break
        case 'activeCases':
          cmp = a.activeCases - b.activeCases
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [
    customers,
    activeTab,
    debouncedSearch,
    sortKey,
    sortDir,
    filterWM,
    filterService,
  ])

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterWM, filterService, activeTab, pageSize])
  const pagedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  if (isLoading) return <ListSkeleton kpis={4} rows={6} />

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Customers
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 dark:hover:border-neutral-600 dark:hover:bg-neutral-700 transition-all cursor-pointer">
            <Download size={13} />
            Export
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={13} />
            New Customer
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<Users size={16} />}
          label="Total Customers"
          value={kpiStats.totalCustomers}
          iconBg="bg-orange-100 dark:bg-orange-900/40"
          iconColor="text-orange-600 dark:text-orange-400"
        />
        <KpiCard
          icon={<Briefcase size={16} />}
          label="Active Cases"
          value={kpiStats.activeCases}
          iconBg="bg-blue-100 dark:bg-blue-900/40"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          icon={<Layers size={16} />}
          label="Services Availed"
          value={kpiStats.servicesAvailed}
          iconBg="bg-violet-100 dark:bg-violet-900/40"
          iconColor="text-violet-600 dark:text-violet-400"
        />
        <KpiCard
          icon={<IndianRupee size={16} />}
          label="Revenue Generated"
          value={formatCurrency(kpiStats.revenueGenerated)}
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-neutral-200/50 dark:bg-neutral-800 rounded-lg p-1 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            const count =
              tab.key === 'all'
                ? statusCounts.all
                : tab.key === 'active'
                  ? statusCounts.active
                  : tab.key === 'inactive'
                    ? statusCounts.inactive
                    : 0
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
              placeholder="Search customers, services..."
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

      {/* ── Edit Customer Modal ─────────────────────────────────────────── */}
      <Dialog open={editModal.open} onOpenChange={(open) => { if (!open) setEditModal({ open: false, item: null }) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Edit Customer</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">Update customer details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Phone</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as CustomerStatus)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Company</label>
              <input
                type="text"
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value)}
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

      {/* ── Add Customer Modal ──────────────────────────────────────────── */}
      <Dialog
        open={addModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetAddForm()
            setAddModalOpen(false)
          }
        }}
      >
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Add New Customer</DialogTitle>
          </DialogHeader>

          {/* Step indicator — clicking a complete step jumps back to it */}
          <div className="flex items-center justify-between gap-2 px-1 py-3">
            {STEPS.map((s, i) => {
              const isActive = addStep === s.key
              const isComplete = addStep > s.key
              const canJump = isComplete && profileStepValid
              const stepInner = (
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-colors ${
                      isComplete
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : isActive
                        ? 'border-orange-500 text-orange-600 bg-white dark:bg-neutral-900'
                        : 'border-neutral-300 dark:border-neutral-600 text-neutral-400'
                    }`}
                  >
                    {isComplete ? <Check size={12} strokeWidth={3} /> : s.key}
                  </div>
                  <span
                    className={`text-[12px] font-medium whitespace-nowrap ${
                      isActive
                        ? 'text-orange-600 dark:text-orange-400'
                        : isComplete
                        ? 'text-neutral-700 dark:text-neutral-300'
                        : 'text-neutral-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              )
              return (
                <div key={s.key} className="flex flex-1 items-center">
                  {canJump ? (
                    <button
                      type="button"
                      onClick={() => setAddStep(s.key)}
                      className="flex items-center gap-2 rounded-md transition-colors cursor-pointer hover:opacity-80"
                      aria-label={`Go to step ${s.key}: ${s.label}`}
                    >
                      {stepInner}
                    </button>
                  ) : (
                    stepInner
                  )}
                  {i < STEPS.length - 1 && (
                    <div
                      className={`mx-2 h-px flex-1 ${
                        addStep > s.key ? 'bg-orange-500' : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="space-y-6 py-2">
            {/* Step 1 — Profile */}
            {addStep === 1 && (
              <>
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={addDob}
                          onChange={(e) => setAddDob(e.target.value)}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">PAN</label>
                        <input
                          type="text"
                          value={addPan}
                          onChange={(e) => setAddPan(e.target.value.toUpperCase())}
                          placeholder="ABCDE1234F"
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-mono text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={addPhone}
                          onChange={(e) => setAddPhone(e.target.value)}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={addEmail}
                          onChange={(e) => setAddEmail(e.target.value)}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">City</label>
                        <input
                          type="text"
                          value={addCity}
                          onChange={(e) => setAddCity(e.target.value)}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">State</label>
                        <input
                          type="text"
                          value={addState}
                          onChange={(e) => setAddState(e.target.value)}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Address</label>
                      <textarea
                        value={addAddress}
                        onChange={(e) => setAddAddress(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                    Company Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Company</label>
                      <input
                        type="text"
                        value={addCompany}
                        onChange={(e) => setAddCompany(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Designation</label>
                      <input
                        type="text"
                        value={addDesignation}
                        onChange={(e) => setAddDesignation(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                    Conversion
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Wealth Manager</label>
                      <input
                        type="text"
                        value={addWealthManagerName}
                        onChange={(e) => setAddWealthManagerName(e.target.value)}
                        placeholder="Assigned partner / WM name"
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Notes</label>
                      <textarea
                        value={addNotes}
                        onChange={(e) => setAddNotes(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                      />
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Step 2 — Services */}
            {addStep === 2 && (
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                  Services Availed
                </h3>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_OPTIONS.map((svc) => {
                    const selected = addServices.includes(svc)
                    return (
                      <button
                        key={svc}
                        type="button"
                        onClick={() => toggleService(svc)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                          selected
                            ? 'border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-400 dark:bg-orange-950/30 dark:text-orange-300'
                            : 'border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:border-orange-300'
                        }`}
                      >
                        {selected && <Check size={12} strokeWidth={3} />}
                        {svc}
                      </button>
                    )
                  })}
                </div>
                {addServices.length > 0 && (
                  <p className="mt-3 text-[12px] text-neutral-500 dark:text-neutral-400">
                    {addServices.length} service{addServices.length === 1 ? '' : 's'} selected
                  </p>
                )}
              </section>
            )}

            {/* Step 3 — Documents */}
            {addStep === 3 && (
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                  Documents
                </h3>
                <label
                  htmlFor="add-customer-files"
                  className="flex flex-col items-center justify-center cursor-pointer rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/30 px-4 py-8 text-center hover:border-orange-400 hover:bg-orange-50/40 dark:hover:bg-orange-950/10 transition-colors"
                >
                  <Upload size={24} className="mb-2 text-neutral-400" />
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Click to upload or drag &amp; drop
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    PDF, JPG, PNG (multiple files allowed)
                  </p>
                  <input
                    id="add-customer-files"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
                {addDocuments.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {addDocuments.map((doc, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <FileText size={14} className="text-neutral-400 shrink-0" />
                          <span className="truncate">{doc.name}</span>
                          <span className="text-[11px] text-neutral-400 shrink-0">
                            {formatFileSize(doc.size)}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDocument(i)}
                          className="text-neutral-400 hover:text-red-500 cursor-pointer ml-2 shrink-0"
                          aria-label="Remove file"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[12px] text-neutral-400 italic">
                    No files uploaded — you can skip this step.
                  </p>
                )}
              </section>
            )}

            {/* Step 4 — Payments */}
            {addStep === 4 && (
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                  Initial Payment
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Amount (₹)</label>
                      <input
                        type="number"
                        value={addPaymentAmount}
                        onChange={(e) => setAddPaymentAmount(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-mono text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Payment Mode</label>
                      <select
                        value={addPaymentMode}
                        onChange={(e) => setAddPaymentMode(e.target.value as typeof addPaymentMode)}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      >
                        {PAYMENT_MODES.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={addPaymentDate}
                      onChange={(e) => setAddPaymentDate(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                </div>
              </section>
            )}
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
            <button
              onClick={() => {
                resetAddForm()
                setAddModalOpen(false)
              }}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              {addStep > 1 && (
                <button
                  onClick={() => setAddStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Back
                </button>
              )}
              {addStep < 4 ? (
                <button
                  onClick={() => setAddStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
                  disabled={addStep === 1 && !profileStepValid}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleAddSubmit}
                  disabled={!profileStepValid || isSubmittingAdd}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmittingAdd && <Loader2 size={13} className="animate-spin" />}
                  {isSubmittingAdd ? 'Adding…' : 'Add Customer'}
                </button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Send Quotation Modal ──────────────────────────────────────────── */}
      <Dialog open={quotationModal.open} onOpenChange={(open) => { if (!open) setQuotationModal({ open: false, customerId: null }) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Send Quotation</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">Choose a channel and compose your message.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Channel</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setQuotationChannel('email')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    quotationChannel === 'email'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                      : 'border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Mail size={14} className="inline mr-1.5 -mt-0.5" />
                  Email
                </button>
                <button
                  onClick={() => setQuotationChannel('whatsapp')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    quotationChannel === 'whatsapp'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                      : 'border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Phone size={14} className="inline mr-1.5 -mt-0.5" />
                  WhatsApp
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Message</label>
              <textarea
                rows={4}
                value={quotationMessage}
                onChange={(e) => setQuotationMessage(e.target.value)}
                placeholder="Enter your quotation message..."
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setQuotationModal({ open: false, customerId: null })}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleQuotationSend}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Send Quotation
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none overflow-hidden">
          {/* Table header — desktop */}
          <div className="hidden lg:grid grid-cols-[100px_minmax(180px,2fr)_minmax(120px,1fr)_minmax(140px,1.2fr)_90px_100px_80px_48px] gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 sticky top-0 z-10">
            <span>ID</span>
            <SortHeader label="Customer" sortKey="name" current={sortKey} dir={sortDir} onSort={toggleSort} />
            <span>Wealth Manager</span>
            <span>Services</span>
            <SortHeader label="Cases" sortKey="activeCases" current={sortKey} dir={sortDir} onSort={toggleSort} />
            <SortHeader label="Payments" sortKey="totalPayments" current={sortKey} dir={sortDir} onSort={toggleSort} />
            <span className="text-center">Status</span>
            <span />
          </div>

          {/* Table rows */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={36} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="font-medium text-neutral-500 dark:text-neutral-400">
                {customers.length === 0 ? 'No customers yet' : 'No customers found'}
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                {customers.length === 0
                  ? 'Get started by adding your first customer'
                  : search
                    ? 'Try a different search term'
                    : activeFilterCount > 0
                      ? 'Try clearing filters to see more results'
                      : activeTab !== 'all'
                        ? 'No customers in this status'
                        : 'No customers match your criteria'}
              </p>
              {customers.length === 0 ? (
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  Add your first customer
                </button>
              ) : (search || activeFilterCount > 0) && (
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
            pagedCustomers.map((customer, idx) => {
              const isLast = idx === pagedCustomers.length - 1
              const isMenuOpen = openMenu === customer.id
              const isExpanded = expandedRow === customer.id
              const statusCfg = STATUS_CONFIG[customer.status]

              return (
                <div key={customer.id}>
                  {/* ── Desktop row ─────────────────────────────────── */}
                  <div
                    className={`hidden lg:grid grid-cols-[100px_minmax(180px,2fr)_minmax(120px,1fr)_minmax(140px,1.2fr)_90px_100px_80px_48px] gap-2 px-5 py-3.5 items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer ${
                      !isLast && !isExpanded ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''
                    } ${isExpanded ? 'bg-neutral-50 dark:bg-neutral-800/20' : ''}`}
                    onClick={() => onView?.(customer.id)}
                  >
                    {/* Customer ID */}
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                      {customer.id.replace('WCUS-', '')}
                    </span>

                    {/* Customer name + contact */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${getInitialColor(customer.name)}`}
                      >
                        {getInitials(customer.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {customer.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                          {customer.company ? (
                            <span className="truncate">{customer.company}</span>
                          ) : (
                            <>
                              <MapPin size={10} className="shrink-0" />
                              <span className="truncate">{customer.city}, {customer.state}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Wealth Manager */}
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate">
                        {customer.wealthManagerName}
                      </p>
                    </div>

                    {/* Services */}
                    <div className="flex flex-wrap gap-1 min-w-0">
                      {customer.servicesAvailed.slice(0, 2).map((svc) => (
                        <span
                          key={svc}
                          className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded truncate max-w-[120px]"
                          title={svc}
                        >
                          {svc.length > 18 ? svc.slice(0, 16) + '…' : svc}
                        </span>
                      ))}
                      {customer.servicesAvailed.length > 2 && (
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded">
                          +{customer.servicesAvailed.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Active Cases */}
                    <div className="text-center">
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          customer.activeCases > 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-neutral-400 dark:text-neutral-500'
                        }`}
                      >
                        {customer.activeCases}
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                        /{customer.totalCases}
                      </span>
                    </div>

                    {/* Total Payments */}
                    <div className="text-right">
                      <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                        {formatCurrency(customer.totalPayments)}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex justify-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div
                      className="relative flex justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setOpenMenu(isMenuOpen ? null : customer.id)}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        aria-label={`Actions for ${customer.name}`}
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                      >
                        <MoreVertical size={14} />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 top-8 z-20 w-52 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg py-1.5 text-sm">
                            <MenuItem
                              icon={<Eye size={13} />}
                              label="View Details"
                              onClick={() => {
                                onView?.(customer.id)
                                setOpenMenu(null)
                              }}
                            />
                            <MenuItem
                              icon={<Pencil size={13} />}
                              label="Edit Customer"
                              onClick={() => {
                                openEditModal(customer)
                                setOpenMenu(null)
                              }}
                            />
                            <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />
                            <MenuItem
                              icon={<Send size={13} />}
                              label="Send Quotation"
                              onClick={() => {
                                openQuotationModal(customer.id)
                                setOpenMenu(null)
                              }}
                              accent
                            />
                            <MenuItem
                              icon={<FolderOpen size={13} />}
                              label="View Cases"
                              onClick={() => {
                                onViewCases?.(customer.id)
                                setOpenMenu(null)
                              }}
                            />
                            <MenuItem
                              icon={<FileText size={13} />}
                              label="View Documents"
                              onClick={() => {
                                onViewDocuments?.(customer.id)
                                setOpenMenu(null)
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ── Mobile / Tablet card ────────────────────────── */}
                  <div
                    className={`lg:hidden ${
                      !isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''
                    }`}
                  >
                    <div
                      className="px-5 py-4 cursor-pointer"
                      onClick={() => setExpandedRow(isExpanded ? null : customer.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getInitialColor(customer.name)}`}
                          >
                            {getInitials(customer.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                              {customer.name}
                            </p>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                              {customer.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}
                          >
                            {statusCfg.label}
                          </span>
                          <ChevronDown
                            size={14}
                            className={`text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </div>

                      {/* Quick stats row */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Briefcase size={11} />
                          {customer.activeCases} active
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers size={11} />
                          {customer.servicesAvailed.length} services
                        </span>
                        <span className="flex items-center gap-1 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] font-medium text-neutral-900 dark:text-neutral-100">
                          <IndianRupee size={11} />
                          {formatCurrency(customer.totalPayments).replace('₹', '')}
                        </span>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-5 pb-4 border-t border-neutral-100 dark:border-neutral-800/60 pt-3">
                        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                          <InfoCell
                            icon={<Building2 size={11} />}
                            label="Company"
                            value={customer.company || '—'}
                          />
                          <InfoCell
                            icon={<MapPin size={11} />}
                            label="Location"
                            value={`${customer.city}, ${customer.state}`}
                          />
                          <InfoCell
                            icon={<UserCircle size={11} />}
                            label="Wealth Manager"
                            value={customer.wealthManagerName}
                          />
                          <InfoCell
                            icon={<Calendar size={11} />}
                            label="Converted"
                            value={formatDate(customer.convertedAt)}
                          />
                          <InfoCell icon={<Phone size={11} />} label="Phone" value={customer.phone} />
                          <InfoCell icon={<Mail size={11} />} label="Email" value={customer.email} />
                        </div>

                        {/* Services */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {customer.servicesAvailed.map((svc) => (
                            <span
                              key={svc}
                              className="inline-block px-2 py-0.5 text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded"
                            >
                              {svc}
                            </span>
                          ))}
                        </div>

                        {customer.pendingAmount > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-2 mb-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[11px] font-medium">
                            <IndianRupee size={11} />
                            {formatCurrency(customer.pendingAmount)} pending
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          <MobileAction
                            icon={<Eye size={12} />}
                            label="View"
                            onClick={() => onView?.(customer.id)}
                          />
                          <MobileAction
                            icon={<Pencil size={12} />}
                            label="Edit"
                            onClick={() => openEditModal(customer)}
                          />
                          <MobileAction
                            icon={<Send size={12} />}
                            label="Quotation"
                            onClick={() => openQuotationModal(customer.id)}
                            accent
                          />
                          <MobileAction
                            icon={<FolderOpen size={12} />}
                            label="Cases"
                            onClick={() => onViewCases?.(customer.id)}
                          />
                          <MobileAction
                            icon={<FileText size={12} />}
                            label="Docs"
                            onClick={() => onViewDocuments?.(customer.id)}
                          />
                        </div>
                      </div>
                    )}
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
                itemLabel="customers"
              />
            </div>
          )}
      </div>
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
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-0.5">
        {label}
      </p>
      <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
        {value}
      </p>
    </div>
  )
}

// ── Sort Header ──────────────────────────────────────────────────────────────

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
      <ArrowUpDown
        size={10}
        className={isActive ? 'text-orange-500' : 'text-neutral-300 dark:text-neutral-600'}
      />
    </button>
  )
}

// ── Menu Item ───────────────────────────────────────────────────────────────

function MenuItem({
  icon,
  label,
  onClick,
  accent,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors cursor-pointer ${
        accent
          ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 font-medium'
          : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
      }`}
    >
      <span className={accent ? 'text-orange-500' : 'text-neutral-400 dark:text-neutral-500'}>{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  )
}

// ── Info Cell (mobile expanded) ─────────────────────────────────────────────

function InfoCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-0.5 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{value}</p>
    </div>
  )
}

// ── Mobile Action Button ────────────────────────────────────────────────────

function MobileAction({
  icon,
  label,
  onClick,
  accent,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
        accent
          ? 'bg-orange-500 text-white hover:bg-orange-500'
          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
