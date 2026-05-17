import { useState } from 'react'
import {
  ArrowLeft,
  User,
  Briefcase,
  Layers,
  FileText,
  IndianRupee,
  MessageSquare,
  Pencil,
  Send,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  Download,
  Eye,
  UserCircle,
  Hash,
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
  CustomerDetailProps,
  Customer,
  CustomerService,
  CustomerCase,
  CustomerDocument,
  CustomerPayment,
  CustomerFollowUp,
  WealthManager,
  CaseStatus,
  ServiceStatus,
  DocumentStatus,
  PaymentStatus,
  FollowUpType,
  CustomerStatus,
} from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TabKey = 'profile' | 'services' | 'cases' | 'documents' | 'payments'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'services', label: 'Services' },
  { key: 'cases', label: 'Cases' },
  { key: 'documents', label: 'Documents' },
  { key: 'payments', label: 'Payments' },
]

const CUSTOMER_STATUS: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  active: { label: 'Active', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  inactive: { label: 'Inactive', dot: 'bg-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400' },
  pending: { label: 'Pending', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
}

const SERVICE_STATUS: Record<ServiceStatus, { label: string; dot: string; bg: string; text: string }> = {
  pending: { label: 'Pending', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  'in-progress': { label: 'In Progress', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' },
  completed: { label: 'Completed', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
}

const CASE_STATUS: Record<CaseStatus, { label: string; dot: string; bg: string; text: string }> = {
  pending: { label: 'Pending', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  'in-progress': { label: 'In Progress', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' },
  completed: { label: 'Completed', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
}

const DOC_STATUS: Record<DocumentStatus, { label: string; dot: string; bg: string; text: string }> = {
  draft: { label: 'Draft', dot: 'bg-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400' },
  'under-review': { label: 'Under Review', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  approved: { label: 'Approved', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' },
  delivered: { label: 'Delivered', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  registered: { label: 'Registered', dot: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400' },
}

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; dot: string; bg: string; text: string }> = {
  confirmed: { label: 'Confirmed', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  pending: { label: 'Pending', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  failed: { label: 'Failed', dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' },
}

const FOLLOWUP_TYPE_CONFIG: Record<FollowUpType, { label: string; bg: string; text: string }> = {
  update: { label: 'Update', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' },
  meeting: { label: 'Meeting', bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400' },
  quotation: { label: 'Quotation', bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function getAge(dob: string) {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--
  return age
}

function paymentModeLabel(mode: string) {
  const map: Record<string, string> = {
    neft: 'NEFT', rtgs: 'RTGS', imps: 'IMPS', upi: 'UPI',
    cheque: 'Cheque', cash: 'Cash', 'online-gateway': 'Online',
  }
  return map[mode] || mode.toUpperCase()
}

function docTypeLabel(type: string) {
  const map: Record<string, string> = {
    will: 'Will', trust: 'Trust', 'succession-certificate': 'Succession Certificate',
  }
  return map[type] || type
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerDetail({
  customer,
  services,
  cases,
  documents,
  payments,
  followUps,
  wealthManager,
  onEdit,
  onSendQuotation,
  onViewCase,
  onDownloadDocument,
  onBack,
}: CustomerDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('profile')

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [quotationModalOpen, setQuotationModalOpen] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState(customer.name)
  const [editEmail, setEditEmail] = useState(customer.email)
  const [editPhone, setEditPhone] = useState(customer.phone)
  const [editStatus, setEditStatus] = useState<string>(customer.status)
  const [editCompany, setEditCompany] = useState(customer.company)

  // Follow-up form state
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpType, setFollowUpType] = useState('Call')
  const [followUpNotes, setFollowUpNotes] = useState('')
  const [followUpAttachments, setFollowUpAttachments] = useState<string[]>([])

  function openEditModal() {
    setEditName(customer.name)
    setEditEmail(customer.email)
    setEditPhone(customer.phone)
    setEditStatus(customer.status)
    setEditCompany(customer.company)
    setEditModalOpen(true)
  }

  function handleEditSave() {
    onEdit?.()
    setEditModalOpen(false)
  }

  function openQuotationModal() {
    setFollowUpDate('')
    setFollowUpType('Call')
    setFollowUpNotes('')
    setFollowUpAttachments([])
    setQuotationModalOpen(true)
  }

  function handleQuotationSend() {
    onSendQuotation?.()
    setQuotationModalOpen(false)
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Customer info */}
            <div className="flex items-start gap-4">
              {/* Back button */}
              <button
                onClick={onBack}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer mt-1"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-lg font-bold text-orange-700 dark:text-orange-300 shrink-0">
                {getInitials(customer.name)}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                    {customer.name}
                  </h1>
                  <StatusBadge status={customer.status} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400 flex-wrap">
                  <span className="font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] text-xs font-medium text-neutral-400 dark:text-neutral-500">
                    {customer.id}
                  </span>
                  {customer.company && (
                    <>
                      <span className="text-neutral-300 dark:text-neutral-600">·</span>
                      <span className="flex items-center gap-1">
                        <Building2 size={12} />
                        {customer.company}
                      </span>
                    </>
                  )}
                  {customer.designation && (
                    <>
                      <span className="text-neutral-300 dark:text-neutral-600">·</span>
                      <span>{customer.designation}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={openEditModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                <Pencil size={12} />
                Edit
              </button>
              <button
                onClick={openQuotationModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-500 transition-colors cursor-pointer shadow-sm"
              >
                <Send size={12} />
                Send Followup
              </button>
            </div>
          </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0 border-b border-neutral-200 dark:border-neutral-700/60 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const count = tab.key === 'services' ? services.length
            : tab.key === 'cases' ? cases.length
            : tab.key === 'documents' ? documents.length
            : tab.key === 'payments' ? payments.length
            : null
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
                {count !== null && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}
                    style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                  >
                    {count}
                  </span>
                )}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 rounded-t-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && <ProfileTab customer={customer} />}
            {activeTab === 'services' && <ServicesTab services={services} onViewCase={onViewCase} />}
            {activeTab === 'cases' && <CasesTab cases={cases} onViewCase={onViewCase} />}
            {activeTab === 'documents' && <DocumentsTab documents={documents} onDownload={onDownloadDocument} />}
            {activeTab === 'payments' && <PaymentsTab payments={payments} />}
          </div>

          {/* Sidebar — Wealth Manager card */}
          <div className="w-full lg:w-72 shrink-0">
            <WealthManagerCard wm={wealthManager} />
          </div>
        </div>
      </div>

      {/* ── Edit Customer Modal ─────────────────────────────────────────── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
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
                onChange={(e) => setEditStatus(e.target.value)}
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
              onClick={() => setEditModalOpen(false)}
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

      {/* ── Send Followup Modal ───────────────────────────────────────────── */}
      <Dialog open={quotationModalOpen} onOpenChange={setQuotationModalOpen}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Send Followup</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">Record a new follow-up entry for this customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Type</label>
              <select
                value={followUpType}
                onChange={(e) => setFollowUpType(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              >
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Meeting">Meeting</option>
                <option value="Court Visit">Court Visit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Notes</label>
              <textarea
                rows={4}
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                placeholder="Enter follow-up details..."
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Attachments</label>
              {followUpAttachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {followUpAttachments.map((file, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <FileText size={11} />
                      {file}
                      <button
                        onClick={() => setFollowUpAttachments(prev => prev.filter((_, idx) => idx !== i))}
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
                  setFollowUpAttachments(prev => [...prev, randomFile])
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
              onClick={() => setQuotationModalOpen(false)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleQuotationSend}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Send Followup
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===========================================================================
// Tabs
// ===========================================================================

// ── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab({ customer }: { customer: Customer }) {
  return (
    <div className="space-y-5">
      {/* Personal Information */}
      <SectionCard title="Personal Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <FieldRow icon={<User size={13} />} label="Full Name" value={customer.name} />
          <FieldRow icon={<Calendar size={13} />} label="Date of Birth" value={`${formatDate(customer.dateOfBirth)} (${getAge(customer.dateOfBirth)} yrs)`} />
          <FieldRow icon={<Hash size={13} />} label="PAN" value={customer.pan} mono />
          <FieldRow icon={<Hash size={13} />} label="Customer ID" value={customer.id} mono />
          <FieldRow icon={<Hash size={13} />} label="Lead ID" value={customer.leadId} mono />
          <FieldRow icon={<Hash size={13} />} label="Account Entry" value={customer.accountEntryId} mono />
        </div>
      </SectionCard>

      {/* Contact Information */}
      <SectionCard title="Contact Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <FieldRow icon={<Phone size={13} />} label="Phone" value={customer.phone} />
          <FieldRow icon={<Mail size={13} />} label="Email" value={customer.email} />
          <FieldRow icon={<MapPin size={13} />} label="City" value={`${customer.city}, ${customer.state}`} />
          <FieldRow icon={<MapPin size={13} />} label="Address" value={customer.address} />
        </div>
      </SectionCard>

      {/* Company Details */}
      {(customer.company || customer.designation) && (
        <SectionCard title="Company Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <FieldRow icon={<Building2 size={13} />} label="Company" value={customer.company || '—'} />
            <FieldRow icon={<UserCircle size={13} />} label="Designation" value={customer.designation || '—'} />
          </div>
        </SectionCard>
      )}

      {/* Conversion Info */}
      <SectionCard title="Conversion">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <FieldRow icon={<Calendar size={13} />} label="Converted On" value={formatDate(customer.convertedAt)} />
          <FieldRow icon={<UserCircle size={13} />} label="Wealth Manager" value={customer.wealthManagerName} />
        </div>
        {customer.notes && (
          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">Notes</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{customer.notes}</p>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

// ── Services Tab ────────────────────────────────────────────────────────────

function ServicesTab({ services, onViewCase }: { services: CustomerService[]; onViewCase?: (caseId: string) => void }) {
  if (services.length === 0) {
    return <EmptyState icon={<Layers size={32} />} title="No services" description="This customer hasn't availed any services yet." />
  }

  // Group by category
  const grouped = services.reduce<Record<string, CustomerService[]>>((acc, svc) => {
    ;(acc[svc.category] ??= []).push(svc)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, svcs]) => (
        <SectionCard key={category} title={category} badge={`${svcs.length}`}>
          <div className="space-y-3">
            {svcs.map((svc) => {
              const cfg = SERVICE_STATUS[svc.status]
              return (
                <div
                  key={svc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{svc.serviceName}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                      <span className="font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">{svc.id}</span>
                      <span>Started {formatDate(svc.startDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                      {formatCurrency(svc.amount)}
                    </span>
                    <StatusPill cfg={cfg} />
                    {svc.caseId && (
                      <button
                        onClick={() => onViewCase?.(svc.caseId!)}
                        className="text-[11px] font-medium text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                      >
                        View Case
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}

// ── Cases Tab ───────────────────────────────────────────────────────────────

function CasesTab({ cases, onViewCase }: { cases: CustomerCase[]; onViewCase?: (caseId: string) => void }) {
  if (cases.length === 0) {
    return <EmptyState icon={<Briefcase size={32} />} title="No cases" description="No cases have been created for this customer." />
  }

  return (
    <div className="space-y-4">
      {cases.map((cs) => {
        const statusCfg = CASE_STATUS[cs.status]

        return (
          <div
            key={cs.id}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{cs.serviceType}</p>
                  <StatusPill cfg={statusCfg} />
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-400 dark:text-neutral-500 flex-wrap">
                  <span className="font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] font-medium">{cs.id}</span>
                  <span>Assigned to {cs.assignedLawyer}</span>
                  <span>{cs.followUpCount} follow-ups</span>
                </div>
              </div>
              <button
                onClick={() => onViewCase?.(cs.id)}
                className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 cursor-pointer shrink-0"
              >
                <Eye size={12} />
                View Case
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">{cs.description}</p>

            {/* Dates */}
            <div className="flex items-center gap-4 mt-3 text-[10px] text-neutral-400 dark:text-neutral-500">
              <span>Created {formatDate(cs.createdAt)}</span>
              <span>Updated {formatDate(cs.lastUpdated)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Documents Tab ───────────────────────────────────────────────────────────

function DocumentsTab({ documents, onDownload }: { documents: CustomerDocument[]; onDownload?: (docId: string) => void }) {
  if (documents.length === 0) {
    return <EmptyState icon={<FileText size={32} />} title="No documents" description="No documents have been generated for this customer." />
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_100px_80px_60px_80px_48px] gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 hidden sm:grid">
        <span>Document</span>
        <span>Type</span>
        <span className="text-center">Version</span>
        <span className="text-center">Format</span>
        <span className="text-center">Status</span>
        <span />
      </div>

      {documents.map((doc, idx) => {
        const statusCfg = DOC_STATUS[doc.status]
        const isLast = idx === documents.length - 1

        return (
          <div key={doc.id}>
            {/* Desktop row */}
            <div
              className={`hidden sm:grid grid-cols-[1fr_100px_80px_60px_80px_48px] gap-2 px-5 py-3.5 items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${
                !isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{doc.title}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                  <span className="font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">{doc.id}</span>
                  <span>·</span>
                  <span>{doc.fileSize}</span>
                  <span>·</span>
                  <span>Updated {formatDate(doc.updatedAt)}</span>
                </div>
              </div>
              <span className="text-xs text-neutral-600 dark:text-neutral-300">{docTypeLabel(doc.type)}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 text-center font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">v{doc.version}</span>
              <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 text-center uppercase">{doc.format}</span>
              <div className="flex justify-center">
                <StatusPill cfg={statusCfg} />
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => onDownload?.(doc.id)}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors cursor-pointer"
                >
                  <Download size={13} />
                </button>
              </div>
            </div>

            {/* Mobile card */}
            <div
              className={`sm:hidden px-5 py-4 ${
                !isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400 dark:text-neutral-500 flex-wrap">
                    <span>{docTypeLabel(doc.type)}</span>
                    <span>·</span>
                    <span>v{doc.version}</span>
                    <span>·</span>
                    <span className="uppercase">{doc.format}</span>
                    <span>·</span>
                    <span>{doc.fileSize}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill cfg={statusCfg} />
                  <button
                    onClick={() => onDownload?.(doc.id)}
                    className="p-1.5 rounded-md text-neutral-400 hover:text-orange-500 transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Payments Tab ────────────────────────────────────────────────────────────

function PaymentsTab({ payments }: { payments: CustomerPayment[] }) {
  if (payments.length === 0) {
    return <EmptyState icon={<IndianRupee size={32} />} title="No payments" description="No payments have been recorded for this customer." />
  }

  const totalAmount = payments.reduce((s, p) => s + p.amount, 0)
  const totalTds = payments.reduce((s, p) => s + p.tds, 0)
  const totalNet = payments.reduce((s, p) => s + p.netReceived, 0)

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Gross Amount</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] mt-0.5">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">TDS Deducted</p>
          <p className="text-lg font-bold text-red-500 dark:text-red-400 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] mt-0.5">{formatCurrency(totalTds)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Net Received</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] mt-0.5">{formatCurrency(totalNet)}</p>
        </div>
      </div>

      {/* Payment records */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
        <div className="hidden sm:grid grid-cols-[minmax(100px,1fr)_100px_90px_90px_80px_100px_80px] gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <span>Invoice</span>
          <span className="text-right">Amount</span>
          <span className="text-right">TDS</span>
          <span className="text-right">Net Received</span>
          <span className="text-center">Mode</span>
          <span>Date</span>
          <span className="text-center">Status</span>
        </div>

        {payments.map((pmt, idx) => {
          const statusCfg = PAYMENT_STATUS[pmt.status]
          const isLast = idx === payments.length - 1

          return (
            <div key={pmt.id}>
              {/* Desktop */}
              <div
                className={`hidden sm:grid grid-cols-[minmax(100px,1fr)_100px_90px_90px_80px_100px_80px] gap-2 px-5 py-3.5 items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${
                  !isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''
                }`}
              >
                <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] truncate">
                  {pmt.invoiceNumber.replace('W24-PI-2026-', 'PI-')}
                </span>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 text-right font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                  {formatCurrency(pmt.amount)}
                </span>
                <span className={`text-xs text-right font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] ${pmt.tds > 0 ? 'text-red-500 dark:text-red-400 font-medium' : 'text-neutral-400 dark:text-neutral-500'}`}>
                  {pmt.tds > 0 ? `-${formatCurrency(pmt.tds)}` : '—'}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-right font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                  {formatCurrency(pmt.netReceived)}
                </span>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 text-center uppercase">
                  {paymentModeLabel(pmt.paymentMode)}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {formatDate(pmt.receivedDate)}
                </span>
                <div className="flex justify-center">
                  <StatusPill cfg={statusCfg} />
                </div>
              </div>

              {/* Mobile */}
              <div
                className={`sm:hidden px-5 py-4 ${
                  !isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                    {pmt.invoiceNumber.replace('W24-PI-2026-', 'PI-')}
                  </span>
                  <StatusPill cfg={statusCfg} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    <span>{paymentModeLabel(pmt.paymentMode)}</span>
                    <span className="mx-1.5">·</span>
                    <span>{formatDate(pmt.receivedDate)}</span>
                  </div>
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                    {formatCurrency(pmt.amount)}
                  </span>
                </div>
                {pmt.tds > 0 && (
                  <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 text-right">
                    TDS: -{formatCurrency(pmt.tds)} · Net: {formatCurrency(pmt.netReceived)}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===========================================================================
// Shared Sub-components
// ===========================================================================

function StatusBadge({ status }: { status: string }) {
  const cfg = CUSTOMER_STATUS[status] ?? CUSTOMER_STATUS.active
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

function StatusPill({ cfg }: { cfg: { label: string; dot: string; bg: string; text: string } }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

function SectionCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
        {badge && (
          <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function FieldRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p
        className={`text-sm text-neutral-800 dark:text-neutral-200 ${
          mono ? 'font-[family-name:var(--font-mono,\'IBM_Plex_Mono\',ui-monospace,monospace)] text-xs font-medium' : ''
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="py-16 text-center">
      <div className="text-neutral-300 dark:text-neutral-600 mb-3 flex justify-center">{icon}</div>
      <p className="font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{description}</p>
    </div>
  )
}

function WealthManagerCard({ wm }: { wm: WealthManager }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-5 sticky top-16">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-4">
        Wealth Manager
      </h3>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center text-xs font-bold text-yellow-700 dark:text-yellow-300">
          {getInitials(wm.name)}
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{wm.name}</p>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{wm.company}</p>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
          <Mail size={12} className="shrink-0 text-neutral-400 dark:text-neutral-500" />
          <span className="truncate">{wm.email}</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
          <Phone size={12} className="shrink-0 text-neutral-400 dark:text-neutral-500" />
          <span>{wm.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
          <MapPin size={12} className="shrink-0 text-neutral-400 dark:text-neutral-500" />
          <span>{wm.city}, {wm.state}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Customers</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{wm.totalCustomers}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Active Leads</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{wm.activeLeads}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
