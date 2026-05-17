import { useState, useMemo } from 'react'
import {
  ArrowLeft,
  Pencil,
  MessageSquarePlus,
  FileText,
  ArrowRightLeft,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  Calendar,
  Send,
  MessageCircle,
  Briefcase,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ExternalLink,
  IndianRupee,
  Paperclip,
  Plus,
  StickyNote,
  UserCircle,
  MessageSquare,
} from 'lucide-react'
import type {
  Lead,
  FollowUp,
  Quotation,
  QuotationSentVia,
  LeadStatus,
  FollowUpType,
  QuotationStatus,
  FollowUpInput,
} from '../types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LeadDetailProps {
  lead: Lead
  followUps: FollowUp[]
  quotations: Quotation[]
  onBack?: () => void
  onEditLead?: (id: string, updates?: Partial<Lead>) => void | Promise<void>
  onAddFollowUp?: (leadId: string, followUp?: FollowUpInput) => void | Promise<void>
  onCreateQuotation?: (leadId: string) => void
  onSendQuotation?: (quotationId: string, via: QuotationSentVia) => void | Promise<void>
  onAssignToAccounts?: (leadId: string) => void | Promise<void>
}

// ---------------------------------------------------------------------------
// Status / type config
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

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'quotation-sent', label: 'Quotation Sent' },
  { value: 'projected', label: 'Projected' },
  { value: 'invoice-sent', label: 'Invoice Sent' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

const FOLLOWUP_TYPE_CONFIG: Record<
  FollowUpType,
  { label: string; icon: typeof MessageCircle; color: string; bg: string }
> = {
  update: {
    label: 'Update',
    icon: MessageCircle,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
  },
  meeting: {
    label: 'Meeting',
    icon: Calendar,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
  },
  quotation: {
    label: 'Quotation',
    icon: FileText,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
  },
}

const QUOTATION_STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; icon: typeof CheckCircle2; color: string; bg: string }
> = {
  draft: {
    label: 'Draft',
    icon: FileText,
    color: 'text-neutral-600 dark:text-neutral-400',
    bg: 'bg-neutral-50 dark:bg-neutral-800',
  },
  sent: {
    label: 'Sent',
    icon: Send,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
  },
  expired: {
    label: 'Expired',
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
  },
}

const LEAD_TYPE_COLORS: Record<string, string> = {
  HNI: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-800',
  Individual: 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
  Corporate: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const INITIAL_COLORS = [
  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
]

function getInitialColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// ---------------------------------------------------------------------------
// LeadDetail Component
// ---------------------------------------------------------------------------

export function LeadDetail({
  lead,
  followUps,
  quotations,
  onBack,
  onEditLead,
  onAddFollowUp,
  onCreateQuotation,
  onSendQuotation,
  onAssignToAccounts,
}: LeadDetailProps) {
  const status = STATUS_CONFIG[lead.status]

  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'quotations' | 'followups' | 'notes'>('overview')

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false)
  const [sendQuotationModal, setSendQuotationModal] = useState<{ open: boolean; quotationId: string | null }>({ open: false, quotationId: null })
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteAttachments, setNoteAttachments] = useState<string[]>([])
  const [extraNotes, setExtraNotes] = useState<{ content: string; createdAt: string; attachments: string[] }[]>([])

  function openNoteModal() {
    setNoteContent('')
    setNoteAttachments([])
    setNoteModalOpen(true)
  }

  function handleNoteSave() {
    if (noteContent.trim()) {
      setExtraNotes((prev) => [
        { content: noteContent.trim(), createdAt: new Date().toISOString(), attachments: [...noteAttachments] },
        ...prev,
      ])
    }
    setNoteModalOpen(false)
  }

  // Edit form state
  const [editName, setEditName] = useState(lead.name)
  const [editPhone, setEditPhone] = useState(lead.phone)
  const [editEmail, setEditEmail] = useState(lead.email)
  const [editStatus, setEditStatus] = useState<LeadStatus>(lead.status)
  const [editSource, setEditSource] = useState(lead.source)
  const [editAssignedEmployee, setEditAssignedEmployee] = useState(lead.assignedEmployee)

  // Follow-up form state
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpType, setFollowUpType] = useState<'Call' | 'Email' | 'Meeting' | 'WhatsApp'>('Call')
  const [followUpNotes, setFollowUpNotes] = useState('')

  // Send quotation form state
  const [quotationVia, setQuotationVia] = useState<'email' | 'whatsapp'>('email')
  const [quotationMessage, setQuotationMessage] = useState('')

  // Modal handlers
  const openEditModal = () => {
    setEditName(lead.name)
    setEditPhone(lead.phone)
    setEditEmail(lead.email)
    setEditStatus(lead.status)
    setEditSource(lead.source)
    setEditAssignedEmployee(lead.assignedEmployee)
    setEditModalOpen(true)
  }

  const openFollowUpModal = () => {
    setFollowUpDate('')
    setFollowUpType('Call')
    setFollowUpNotes('')
    setFollowUpModalOpen(true)
  }

  const openSendQuotationModal = (quotationId: string) => {
    setQuotationVia('email')
    setQuotationMessage('')
    setSendQuotationModal({ open: true, quotationId })
  }

  // Sort follow-ups chronologically (newest first)
  const sortedFollowUps = useMemo(
    () => [...followUps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [followUps]
  )

  // Sort quotations by date (newest first)
  const sortedQuotations = useMemo(
    () => [...quotations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [quotations]
  )

  return (
    <div className="space-y-6 pb-8">
      {/* ----------------------------------------------------------------- */}
      {/* Back + Header                                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-6">
        {/* Lead header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Back button */}
            <button
              onClick={() => onBack?.()}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[20px] font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                  {lead.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.text}`}
                >
                  {status.label}
                </span>
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${LEAD_TYPE_COLORS[lead.leadType]}`}
                >
                  {lead.leadType}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-[12px] text-neutral-400 dark:text-neutral-500">
                <span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
                  {lead.id}
                </span>
                <span>via {lead.source}</span>
                <span>Created {formatDate(lead.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={openEditModal}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-[7px] text-[12px] font-medium text-neutral-600 transition-all hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600"
            >
              <Pencil size={12} strokeWidth={2} />
              Edit
            </button>
            <button
              onClick={openFollowUpModal}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-[7px] text-[12px] font-medium text-neutral-600 transition-all hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600"
            >
              <MessageSquarePlus size={12} strokeWidth={2} />
              Follow-up
            </button>
            <button
              onClick={() => onCreateQuotation?.(lead.id)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-[7px] text-[12px] font-medium text-neutral-600 transition-all hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600"
            >
              <FileText size={12} strokeWidth={2} />
              Add Quotation
            </button>
            <button
              onClick={() => onAssignToAccounts?.(lead.id)}
              className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-[7px] text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-orange-500 hover:shadow-md active:scale-[0.98]"
            >
              <ArrowRightLeft size={12} strokeWidth={2} />
              Assign to Accounts
            </button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Tabs                                                               */}
      {/* ----------------------------------------------------------------- */}
      {(() => {
        const TABS = [
          { id: 'overview', label: 'Overview' },
          { id: 'quotations', label: 'Quotations', count: sortedQuotations.length },
          { id: 'followups', label: 'Follow-ups', count: sortedFollowUps.length },
          { id: 'notes', label: 'Notes' },
        ] as const

        return (
          <>
            {/* Tab bar */}
            <div className="flex items-center gap-0 border-b border-neutral-200 dark:border-neutral-700/60">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer ${
                    activeTab === t.id
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {t.label}
                    {'count' in t && t.count !== undefined && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          activeTab === t.id
                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                        style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                      >
                        {t.count}
                      </span>
                    )}
                  </span>
                  {activeTab === t.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* ── Overview Tab ── */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-[3fr_2fr] gap-5">
                {/* Left column: Contact + Lead Details + Wealth Manager */}
                <div className="space-y-5">
                  {/* Contact Information */}
                  <div className="rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-800/60">
                    <div className="border-b border-neutral-100 px-5 py-3.5 dark:border-neutral-700/50">
                      <h3 className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
                        Contact Information
                      </h3>
                    </div>
                    <div className="space-y-5 p-5">
                      <InfoRow icon={Phone} label="Phone" value={lead.phone} />
                      <InfoRow icon={Mail} label="Email" value={lead.email} />
                      <InfoRow
                        icon={MapPin}
                        label="Address"
                        value={[lead.address, lead.city, lead.state, lead.pinCode].filter(Boolean).join(', ')}
                      />
                      {lead.company && (
                        <InfoRow icon={Building2} label="Company" value={lead.company} />
                      )}
                      {lead.designation && (
                        <InfoRow icon={Briefcase} label="Designation" value={lead.designation} />
                      )}
                    </div>
                  </div>

                  {/* Lead Details */}
                  <div className="rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-800/60">
                    <div className="border-b border-neutral-100 px-5 py-3.5 dark:border-neutral-700/50">
                      <h3 className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
                        Lead Details
                      </h3>
                    </div>
                    <div className="space-y-5 p-5">
                      <InfoRow icon={Tag} label="Service Interest" value={lead.serviceInterest} />
                      <InfoRow icon={User} label="Assigned To" value={lead.assignedEmployee} />
                      <InfoRow
                        icon={Calendar}
                        label="Last Activity"
                        value={formatDateTime(lead.lastActivity)}
                        mono
                      />
                    </div>
                  </div>

                  {/* Wealth Manager */}
                  <div className="rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-800/60">
                    <div className="border-b border-neutral-100 px-5 py-3.5 dark:border-neutral-700/50">
                      <h3 className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
                        Wealth Manager
                      </h3>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-[12px] font-bold text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                          {lead.wealthManagerName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
                            {lead.wealthManagerName}
                          </p>
                          <p
                            className="text-[11px] text-neutral-400"
                            style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                          >
                            {lead.wealthManagerId}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column: Lead Timeline */}
                {(() => {
                  // Build unified timeline entries
                  type TimelineEntry = {
                    id: string
                    date: string
                    type: 'follow-up' | 'quotation' | 'status' | 'created'
                    dotColor: string
                    title: string
                  }

                  const timelineEntries: TimelineEntry[] = []

                  // Add follow-ups
                  sortedFollowUps.forEach((fu) => {
                    timelineEntries.push({
                      id: fu.id,
                      date: fu.createdAt,
                      type: 'follow-up',
                      dotColor: 'bg-orange-500',
                      title: `Follow up added by ${fu.author}`,
                    })
                  })

                  // Add quotations
                  sortedQuotations.forEach((qt) => {
                    timelineEntries.push({
                      id: qt.id,
                      date: qt.createdAt,
                      type: 'quotation',
                      dotColor: 'bg-orange-500',
                      title: `Quotation sent to ${lead.name}`,
                    })
                  })

                  // Add lead created entry
                  timelineEntries.push({
                    id: 'created',
                    date: lead.createdAt,
                    type: 'created',
                    dotColor: 'bg-emerald-500',
                    title: 'Lead created in the system',
                  })

                  // Sort by date descending
                  timelineEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

                  return (
                    <div className="rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-800/60">
                      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5 dark:border-neutral-700/50">
                        <h2 className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
                          Lead Timeline
                        </h2>
                        <span
                          className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                          style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                        >
                          {timelineEntries.length}
                        </span>
                      </div>

                      <div className="relative">
                        <div className="absolute left-[24px] top-0 bottom-0 w-px bg-neutral-100 dark:bg-neutral-700/50" />
                        {timelineEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="relative flex items-start gap-3 px-5 py-4"
                          >
                            <div className={`relative z-10 mt-1.5 h-[10px] w-[10px] shrink-0 rounded-full ${entry.dotColor}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
                                {entry.title}
                              </p>
                              <p className="mt-1 text-[12px] text-neutral-400 dark:text-neutral-500">
                                {formatDate(entry.date)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* ── Quotations Tab ── */}
            {activeTab === 'quotations' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Quotations</h2>
                  <button
                    onClick={() => onCreateQuotation?.(lead.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-500 transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus size={12} />
                    Add Quotation
                  </button>
                </div>
                <div className="rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-800/60">
                {sortedQuotations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText size={24} className="mb-2 text-neutral-300 dark:text-neutral-600" />
                    <p className="text-[13px] text-neutral-400">No quotations created</p>
                    <button
                      onClick={() => onCreateQuotation?.(lead.id)}
                      className="mt-2 text-[12px] font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
                    >
                      Create first quotation
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-700/40">
                    {sortedQuotations.map((qt) => {
                      const qStatus = QUOTATION_STATUS_CONFIG[qt.status]
                      const StatusIcon = qStatus.icon

                      return (
                        <div key={qt.id} className="px-5 py-4 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-700/10">
                          {/* Quotation header */}
                          <div className="mb-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-200"
                                style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                              >
                                {qt.referenceNumber}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${qStatus.bg} ${qStatus.color}`}
                              >
                                <StatusIcon size={10} strokeWidth={2} />
                                {qStatus.label}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                              {formatDate(qt.createdAt)}
                            </span>
                          </div>

                          {/* Line items */}
                          <div className="mb-2.5 space-y-1">
                            {qt.items.map((item, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-[12px]"
                              >
                                <span className="text-neutral-600 dark:text-neutral-300">
                                  {item.serviceName}
                                  {item.quantity > 1 && (
                                    <span className="ml-1 text-neutral-400">x{item.quantity}</span>
                                  )}
                                </span>
                                <span
                                  className="text-neutral-500 dark:text-neutral-400"
                                  style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                                >
                                  {formatCurrency(item.amount)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Total + actions */}
                          <div className="flex items-center justify-between border-t border-neutral-100 pt-2.5 dark:border-neutral-700/40">
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="text-[10px] text-neutral-400">Total</span>
                                <p
                                  className="text-[14px] font-bold text-neutral-900 dark:text-neutral-50"
                                  style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                                >
                                  {formatCurrency(qt.total)}
                                </p>
                              </div>
                              <span className="text-[10px] text-neutral-300 dark:text-neutral-600">
                                (incl. {qt.taxRate}% GST)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {qt.sentVia && qt.sentAt && (
                                <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                                  <Send size={9} strokeWidth={2} />
                                  Sent via {qt.sentVia} on {formatDate(qt.sentAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                </div>
              </div>
            )}

            {/* ── Follow-ups Tab ── */}
            {activeTab === 'followups' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Follow-ups</h2>
                  <button
                    onClick={openFollowUpModal}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-500 transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus size={12} />
                    Add Follow-up
                  </button>
                </div>

                {sortedFollowUps.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="text-neutral-300 dark:text-neutral-600 mb-3 flex justify-center">
                      <MessageSquare size={32} />
                    </div>
                    <p className="font-medium text-neutral-500 dark:text-neutral-400">No follow-ups</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">No follow-up entries have been recorded.</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[19px] top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800" />

                    <div className="space-y-0">
                      {sortedFollowUps.map((fu, idx) => {
                        const typeCfg = FOLLOWUP_TYPE_CONFIG[fu.type]
                        const isFirst = idx === 0

                        return (
                          <div key={fu.id} className="relative pl-12 pb-6">
                            <div
                              className={`absolute left-3.5 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-950 ${
                                isFirst ? 'bg-orange-500' : 'bg-neutral-300 dark:bg-neutral-600'
                              }`}
                            />

                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-4">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.color}`}>
                                    {typeCfg.label}
                                  </span>
                                </div>
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                                  {formatDateTime(fu.createdAt)}
                                </span>
                              </div>

                              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">{fu.title}</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{fu.notes}</p>

                              <div className="flex items-center gap-2 mt-3 text-[10px] text-neutral-400 dark:text-neutral-500">
                                <UserCircle size={11} />
                                <span>{fu.author}</span>
                                {fu.quotationRef && (
                                  <>
                                    <span>·</span>
                                    <span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{fu.quotationRef}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Notes Tab ── */}
            {activeTab === 'notes' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Internal Notes</h2>
                  <button
                    onClick={openNoteModal}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-500 transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus size={12} />
                    Add Note
                  </button>
                </div>

                {(lead.notes || extraNotes.length > 0) ? (
                  <div className="space-y-3">
                    {extraNotes.map((n, i) => (
                      <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none p-4">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${getInitialColor(lead.assignedEmployee)}`}>
                              {getInitials(lead.assignedEmployee)}
                            </div>
                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{lead.assignedEmployee}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{formatDateTime(n.createdAt)}</span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                        {n.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {n.attachments.map((file, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                <FileText size={11} />
                                {file}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {lead.notes && (
                      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none p-4">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${getInitialColor(lead.assignedEmployee)}`}>
                              {getInitials(lead.assignedEmployee)}
                            </div>
                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{lead.assignedEmployee}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{formatDateTime(lead.createdAt)}</span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{lead.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <div className="text-neutral-300 dark:text-neutral-600 mb-3 flex justify-center">
                      <StickyNote size={32} />
                    </div>
                    <p className="font-medium text-neutral-500 dark:text-neutral-400">No notes yet</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Add internal notes for private team observations.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )
      })()}

      {/* ----------------------------------------------------------------- */}
      {/* Edit Lead Modal                                                   */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Edit Lead</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Update the lead information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as LeadStatus)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Source</label>
                <select
                  value={editSource}
                  onChange={(e) => setEditSource(e.target.value as Lead['source'])}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Wealth Manager">Wealth Manager</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Campaign">Campaign</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Assigned Employee</label>
                <input
                  type="text"
                  value={editAssignedEmployee}
                  onChange={(e) => setEditAssignedEmployee(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setEditModalOpen(false)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                void onEditLead?.(lead.id, {
                  name: editName,
                  phone: editPhone,
                  email: editEmail,
                  status: editStatus,
                  source: editSource,
                  assignedEmployee: editAssignedEmployee,
                })
                setEditModalOpen(false)
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Add Follow-up Modal                                               */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={followUpModalOpen} onOpenChange={setFollowUpModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Add Follow-up</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Schedule a follow-up for {lead.name}.
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
              onClick={() => setFollowUpModalOpen(false)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const nextFollowUp: FollowUpInput = {
                  type:
                    followUpType === 'Meeting'
                      ? 'meeting'
                      : followUpType === 'WhatsApp'
                        ? 'quotation'
                        : 'update',
                  title: `${followUpType} follow-up`,
                  notes: followUpNotes || `${followUpType} follow-up scheduled`,
                  author: 'Wills24 Admin',
                  priority: followUpType === 'Meeting' ? 'high' : 'medium',
                  nextActionDate: followUpDate ? new Date(followUpDate).toISOString() : null,
                  ...(followUpType === 'Meeting' && followUpDate
                    ? { meetingDate: new Date(followUpDate).toISOString() }
                    : {}),
                  ...(followUpType === 'Meeting'
                    ? { meetingLocation: 'To be confirmed' }
                    : {}),
                }
                void onAddFollowUp?.(lead.id, nextFollowUp)
                setFollowUpModalOpen(false)
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Save Follow-up
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Send Quotation Modal                                              */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={sendQuotationModal.open} onOpenChange={(open) => setSendQuotationModal({ open, quotationId: open ? sendQuotationModal.quotationId : null })}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Send Quotation</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Send the quotation to {lead.name} via your preferred channel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Send via</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="quotationViaDetail"
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
                    name="quotationViaDetail"
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
              onClick={() => setSendQuotationModal({ open: false, quotationId: null })}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (sendQuotationModal.quotationId) {
                  onSendQuotation?.(sendQuotationModal.quotationId, quotationVia)
                }
                setSendQuotationModal({ open: false, quotationId: null })
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Send size={14} />
                Send
              </span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Add Note Modal                                                    */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Add Note</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">Add an internal note to this lead.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Content</label>
              <textarea
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your note here..."
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Attachments</label>
              {noteAttachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {noteAttachments.map((file, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <FileText size={11} />
                      {file}
                      <button
                        onClick={() => setNoteAttachments(prev => prev.filter((_, idx) => idx !== i))}
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
                  const names = ['Document.pdf', 'Agreement.pdf', 'ID_Proof.jpg', 'Court_Order.pdf', 'Will_Draft.docx', 'Receipt.pdf', 'Affidavit.pdf', 'Photo.png']
                  const randomFile = names[Math.floor(Math.random() * names.length)]
                  setNoteAttachments(prev => [...prev, randomFile])
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                <Paperclip size={12} />
                Add Attachment
              </button>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setNoteModalOpen(false)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleNoteSave}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Add Note
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Phone
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon
        size={13}
        strokeWidth={2}
        className="mt-0.5 shrink-0 text-neutral-400 dark:text-neutral-500"
      />
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {label}
        </p>
        <p
          className="mt-0.5 text-[12px] text-neutral-700 dark:text-neutral-200"
          style={mono ? { fontFamily: '"IBM Plex Mono", monospace' } : undefined}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function StatCell({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="bg-white p-3.5 dark:bg-neutral-800/60">
      <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">{label}</p>
      <p
        className={`mt-0.5 text-[16px] font-bold ${accent}`}
        style={{ fontFamily: '"IBM Plex Mono", monospace' }}
      >
        {value}
      </p>
    </div>
  )
}
