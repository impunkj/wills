import { useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  User,
  Scale,
  Briefcase,
  FileText,
  StickyNote,
  CheckSquare,
  Send,
  X,
  Phone,
  Mail,
  MapPin,
  Shield,
  Search,
  Paperclip,
  Upload,
  Loader2,
} from 'lucide-react'
import type {
  AddCaseFormProps,
  CustomerRef,
  Lawyer,
} from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVICE_TYPES = [
  'Will Drafting (Basic)',
  'Will Drafting (Advanced)',
  'Trust Drafting',
  'Trust Registration',
  'Trust Advisory',
  'Succession Certificate',
] as const

const DOCUMENT_CHECKLISTS: Record<string, string[]> = {
  'Will Drafting (Basic)': ['Property Documents', 'Beneficiary Details', 'ID Proofs', 'Witness Details'],
  'Will Drafting (Advanced)': ['Property Documents', 'Beneficiary Details', 'ID Proofs', 'Witness Details', 'Previous Will (if any)', 'CA Certificate'],
  'Trust Drafting': ['Trust Deed Draft', 'Settlor Details', 'Beneficiary Details', 'Property Valuation', 'CA Certificate'],
  'Trust Registration': ['Approved Trust Deed', 'Stamp Duty Receipt', 'Sub-Registrar Forms', 'Settlor ID Proof'],
  'Trust Advisory': ['Existing Trust Deed', 'Advisory Requirements', 'Relevant Documents'],
  'Succession Certificate': ['Death Certificate', 'Legal Heir Certificate', 'Property Documents', 'ID Proof of all claimants', 'Court Fee Receipt'],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const INITIAL_COLORS = [
  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
]

function getInitialColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddCaseForm({
  customers,
  lawyers,
  onSubmit,
  onCancel,
  initialData,
}: AddCaseFormProps & {
  initialData?: {
    caseId: string
    customerId: string
    serviceType: string
    lawyerId: string
    description: string
    notes?: string
  }
}) {
  const isEditMode = !!initialData
  const [customerId, setCustomerId] = useState(initialData?.customerId ?? '')
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const [serviceType, setServiceType] = useState(initialData?.serviceType ?? '')
  const [lawyerId, setLawyerId] = useState(initialData?.lawyerId ?? '')
  const [lawyerSearch, setLawyerSearch] = useState('')
  const [lawyerDropdownOpen, setLawyerDropdownOpen] = useState(false)
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [noteAttachments, setNoteAttachments] = useState<string[]>([])
  const [documents, setDocuments] = useState<string[]>([])

  // Derived
  const filteredCustomers = customers.filter(c => {
    if (!customerSearch.trim()) return true
    const q = customerSearch.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.phone.includes(q)
  })
  const filteredLawyers = lawyers.filter(l => {
    if (!lawyerSearch.trim()) return true
    const q = lawyerSearch.toLowerCase()
    return l.name.toLowerCase().includes(q) || l.specialization.toLowerCase().includes(q)
  })
  const selectedCustomer = customers.find(c => c.id === customerId)
  const selectedLawyer = lawyers.find(l => l.id === lawyerId)
  const checklist = serviceType ? (DOCUMENT_CHECKLISTS[serviceType] ?? []) : []
  const caseId = initialData?.caseId ?? ('W24-CASE-' + String(Math.floor(10000 + Math.random() * 90000)))

  const isValid = customerId && serviceType && description.trim().length > 0
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || isSubmitting) return
    setIsSubmitting(true)
    setTimeout(() => {
      onSubmit?.({ customerId, serviceType, lawyerId, description, notes })
      setIsSubmitting(false)
    }, 600)
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {isEditMode ? 'Edit Case' : 'Add New Case'}
              </h1>
            </div>
            <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
              {caseId}
            </span>
          </div>
          <div className="mt-1 ml-10">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isEditMode ? 'Update the case details below' : 'Create a new case for a converted customer'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Form ────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Customer Selection */}
            <FormSection icon={<User size={15} />} title="Customer" description="Select the customer this case is for">
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => { setCustomerSearch(e.target.value); setCustomerDropdownOpen(true); if (!e.target.value) setCustomerId('') }}
                  onFocus={() => setCustomerDropdownOpen(true)}
                  placeholder="Search by name, ID or phone..."
                  className="w-full px-4 py-3 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
                />
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                {customerDropdownOpen && !customerId && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setCustomerDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-52 overflow-y-auto py-1">
                      {filteredCustomers.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-neutral-400 dark:text-neutral-500 text-center">No customers found</p>
                      ) : (
                        filteredCustomers.map(c => (
                          <button
                            key={c.id}
                            onClick={() => { setCustomerId(c.id); setCustomerSearch(c.name); setCustomerDropdownOpen(false) }}
                            className="w-full px-4 py-2.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                          >
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{c.name}</p>
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{c.id} · {c.phone} · {c.city}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Selected customer info */}
              {selectedCustomer && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getInitialColor(selectedCustomer.name)}`}>
                    {getInitials(selectedCustomer.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{selectedCustomer.name}</p>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1"><Phone size={9} /> {selectedCustomer.phone}</span>
                      <span className="flex items-center gap-1"><Mail size={9} /> {selectedCustomer.email}</span>
                      <span className="flex items-center gap-1"><MapPin size={9} /> {selectedCustomer.city}</span>
                    </div>
                  </div>
                </div>
              )}
            </FormSection>

            {/* Service Type */}
            <FormSection icon={<Briefcase size={15} />} title="Service Type" description="Select the legal service for this case">
              <div className="relative">
                <select
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                  className="w-full appearance-none px-4 py-3 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all cursor-pointer"
                >
                  <option value="">Select a service type...</option>
                  {SERVICE_TYPES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </FormSection>

            {/* Lawyer Assignment */}
            <FormSection icon={<Scale size={15} />} title="Assign Lawyer" description="Optional — assign a lawyer to handle this case">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by name or specialization..."
                  value={selectedLawyer && !lawyerDropdownOpen ? selectedLawyer.name : lawyerSearch}
                  onChange={e => { setLawyerSearch(e.target.value); setLawyerDropdownOpen(true) }}
                  onFocus={() => setLawyerDropdownOpen(true)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
                />
                {lawyerDropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredLawyers.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-neutral-400">No lawyers found</p>
                    ) : (
                      filteredLawyers.map(l => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => { setLawyerId(l.id); setLawyerSearch(''); setLawyerDropdownOpen(false) }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer flex items-center gap-2.5 ${lawyerId === l.id ? 'bg-orange-50 dark:bg-orange-950/20' : ''}`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${getInitialColor(l.name)}`}>
                            {getInitials(l.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{l.name}</p>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{l.specialization}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </FormSection>

            {/* Description */}
            <FormSection icon={<FileText size={15} />} title="Description" description="Describe the case details and requirements">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Provide details about the case — property information, beneficiaries, special requirements..."
                className="w-full px-4 py-3 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all resize-none"
              />
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 text-right">{description.length} characters</p>
            </FormSection>

            {/* Notes */}
            <FormSection icon={<StickyNote size={15} />} title="Internal Notes" description="Optional notes visible only to the team">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any internal observations, special instructions, or context..."
                className="w-full px-4 py-3 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all resize-none"
              />
              <div className="mt-3">
                {noteAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {noteAttachments.map((file, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <FileText size={11} />
                        {file}
                        <button
                          type="button"
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
            </FormSection>

            {/* Documents */}
            <FormSection icon={<Upload size={15} />} title="Documents" description="Upload supporting documents for this case">
              {documents.length > 0 && (
                <div className="space-y-2 mb-3">
                  {documents.map((file, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={13} className="text-neutral-400 shrink-0" />
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{file}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDocuments(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-neutral-400 hover:text-red-500 transition-colors cursor-pointer shrink-0 ml-2"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  const names = ['ID_Proof.pdf', 'Property_Deed.pdf', 'Death_Certificate.pdf', 'Legal_Heir_Certificate.pdf', 'Affidavit.pdf', 'Court_Fee_Receipt.pdf', 'Stamp_Duty.pdf', 'Will_Draft.docx']
                  const randomFile = names[Math.floor(Math.random() * names.length)]
                  setDocuments(prev => [...prev, randomFile])
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                <Paperclip size={12} />
                Add Document
              </button>
            </FormSection>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Summary card */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none p-5 sticky top-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">Case Summary</h3>
              <div className="space-y-3">
                <SummaryRow label="Case ID" value={caseId} mono />
                <SummaryRow
                  label="Customer"
                  value={selectedCustomer?.name ?? '—'}
                />
                <SummaryRow label="Service" value={serviceType || '—'} />
                <SummaryRow label="Lawyer" value={selectedLawyer?.name ?? '—'} />
              </div>

              <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
                {!isValid && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                    {(() => {
                      const missing: string[] = []
                      if (!customerId) missing.push('Customer')
                      if (!serviceType) missing.push('Service Type')
                      if (!description.trim()) missing.push('Description')
                      return `Required: ${missing.join(', ')}`
                    })()}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  onClick={handleSubmit}
                  className="w-full py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 bg-orange-500 text-white hover:bg-orange-500 shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {isSubmitting
                    ? isEditMode ? 'Saving…' : 'Creating…'
                    : isEditMode ? 'Save Changes' : 'Create Case'}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Document checklist */}
            {checklist.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare size={14} className="text-orange-500" />
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Document Checklist</h3>
                </div>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mb-3">Required documents for {serviceType}</p>
                <ul className="space-y-2">
                  {checklist.map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded border border-neutral-300 dark:border-neutral-600 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 shrink-0">
                      </div>
                      <span className="text-xs text-neutral-700 dark:text-neutral-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

// ===========================================================================
// Sub-Components
// ===========================================================================

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-orange-500">{icon}</span>
        <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{title}</h2>
      </div>
      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-4">{description}</p>
      {children}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  mono,
  badge,
}: {
  label: string
  value: string
  mono?: boolean
  badge?: string
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
      {badge ? (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${badge}`}>{value}</span>
      ) : (
        <span className={`text-xs font-medium text-neutral-700 dark:text-neutral-300 ${mono ? 'font-[family-name:var(--font-mono,\'IBM_Plex_Mono\',ui-monospace,monospace)] text-[11px]' : ''}`}>
          {value}
        </span>
      )}
    </div>
  )
}
