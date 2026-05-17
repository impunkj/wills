import { useState } from 'react'
import { formatDate, timeAgo } from '@/lib/format'
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  FileText,
  Scale,
  User,
  Search,
  Download,
  Paperclip,
  CheckCircle2,
  StickyNote,
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
  CaseDetailProps,
  Case,
  CaseFollowUp,
  CaseNote,
  CaseDocument,
  Lawyer,
  CaseStatus,
  DocumentStatus,
  DocumentType,
  AuthorRole,
  LawyerAvailability,
  ServiceAction,
} from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TabKey = 'followups' | 'details' | 'notes' | 'documents'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'followups', label: 'Follow-ups', icon: <MessageSquare size={14} /> },
  { key: 'details', label: 'Case Details', icon: <FileText size={14} /> },
  { key: 'notes', label: 'Notes', icon: <StickyNote size={14} /> },
  { key: 'documents', label: 'Documents', icon: <FileText size={14} /> },
]

const CASE_STATUS_CONFIG: Record<CaseStatus, { label: string; dot: string; bg: string; text: string }> = {
  'in-progress': { label: 'In Progress', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' },
  drafting: { label: 'Drafting', dot: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400' },
  'under-review': { label: 'Under Review', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  approved: { label: 'Approved', dot: 'bg-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400' },
  completed: { label: 'Completed', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  'on-hold': { label: 'On Hold', dot: 'bg-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400' },
}

const DOC_STATUS_CONFIG: Record<DocumentStatus, { label: string; dot: string; bg: string; text: string }> = {
  draft: { label: 'Draft', dot: 'bg-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400' },
  'under-review': { label: 'Under Review', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  approved: { label: 'Approved', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' },
  delivered: { label: 'Delivered', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  registered: { label: 'Registered', dot: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400' },
}

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  will: 'Will',
  trust: 'Trust Deed',
  'succession-certificate': 'Succession Certificate',
}

const AUTHOR_ROLE_CONFIG: Record<AuthorRole, { label: string; bg: string; text: string }> = {
  lawyer: { label: 'Lawyer', bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400' },
  operations: { label: 'Operations', bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400' },
  admin: { label: 'Admin', bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400' },
  legal: { label: 'Legal', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
}

const SERVICE_ACTION_CONFIG: Record<string, { bg: string; text: string }> = {
  'Drafting': { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400' },
  'Client Review': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  'Revision': { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-400' },
  'Registration': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  'Advisory': { bg: 'bg-neutral-200 dark:bg-neutral-700', text: 'text-neutral-700 dark:text-neutral-300' },
  'Trust Drafting': { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400' },
  'Trust Registration': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  'Application Filing': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  'Court Hearing': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  'Certificate Obtained': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
}

const AVAILABILITY_CONFIG: Record<LawyerAvailability, { label: string; dot: string; text: string }> = {
  available: { label: 'Available', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  busy: { label: 'Busy', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  'on-leave': { label: 'On Leave', dot: 'bg-neutral-400', text: 'text-neutral-500 dark:text-neutral-400' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

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

function daysBetween(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CaseDetail({
  caseData,
  followUps,
  notes,
  documents,
  lawyers,
  onEdit,
  onAddFollowUp,
  onAddNote,
  onAssignLawyer,
  onDownloadDocument,
  onBack,
}: CaseDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('followups')

  // Modal state
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [assignLawyerModalOpen, setAssignLawyerModalOpen] = useState(false)

  // Follow-up form state
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpType, setFollowUpType] = useState('Call')
  const [followUpNotes, setFollowUpNotes] = useState('')
  const [followUpAttachments, setFollowUpAttachments] = useState<string[]>([])

  // Note form state
  const [noteContent, setNoteContent] = useState('')
  const [noteAttachments, setNoteAttachments] = useState<string[]>([])

  // Assign lawyer state
  const [assignLawyerSearch, setAssignLawyerSearch] = useState('')
  const [selectedLawyerId, setSelectedLawyerId] = useState<string | null>(null)

  function openFollowUpModal() {
    setFollowUpDate('')
    setFollowUpType('Call')
    setFollowUpNotes('')
    setFollowUpAttachments([])
    setFollowUpModalOpen(true)
  }

  function handleFollowUpSave() {
    onAddFollowUp?.()
    setFollowUpModalOpen(false)
  }

  function openNoteModal() {
    setNoteContent('')
    setNoteAttachments([])
    setNoteModalOpen(true)
  }

  function handleNoteSave() {
    onAddNote?.()
    setNoteModalOpen(false)
  }

  function openAssignLawyerModal() {
    setAssignLawyerSearch('')
    setSelectedLawyerId(null)
    setAssignLawyerModalOpen(true)
  }

  function handleAssignLawyer() {
    if (selectedLawyerId) {
      onAssignLawyer?.(selectedLawyerId)
    }
    setAssignLawyerModalOpen(false)
  }

  const filteredLawyersForModal = lawyers.filter(l => {
    if (!assignLawyerSearch.trim()) return true
    const q = assignLawyerSearch.toLowerCase()
    return l.name.toLowerCase().includes(q) || l.specialization.toLowerCase().includes(q)
  })

  const statusCfg = CASE_STATUS_CONFIG[caseData.status]

  return (
    <div className="space-y-6 pb-8 overflow-x-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <div>
          {/* Case Identity */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 min-w-0">
            <div className="flex items-start gap-3 min-w-0">
              <button
                onClick={onBack}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer mt-0.5"
              >
                <ArrowLeft size={20} />
              </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                  {caseData.id}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                  {statusCfg.label}
                </span>
              </div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1.5 tracking-tight">
                {caseData.serviceName}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-neutral-500 dark:text-neutral-400 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <User size={13} />
                  {caseData.customerName}
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                    {caseData.customerId}
                  </span>
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">|</span>
                <span className="flex items-center gap-1.5">
                  <Scale size={13} />
                  {caseData.assignedLawyer}
                </span>
              </div>
            </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {TABS.map(tab => {
              const isActive = activeTab === tab.key
              let count: number | null = null
              if (tab.key === 'followups') count = followUps.length
              else if (tab.key === 'notes') count = notes.length
              else if (tab.key === 'documents') count = documents.length

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                      : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {count !== null && (
                    <span className={`text-[10px] font-bold tabular-nums ${isActive ? 'text-orange-400 dark:text-orange-500' : 'text-neutral-400 dark:text-neutral-600'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <div>
        {activeTab === 'followups' && (
          <FollowUpsTab followUps={followUps} onAddFollowUp={openFollowUpModal} />
        )}
        {activeTab === 'details' && (
          <DetailsTab caseData={caseData} />
        )}
        {activeTab === 'notes' && (
          <NotesTab notes={notes} onAddNote={openNoteModal} />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab documents={documents} onDownloadDocument={onDownloadDocument} />
        )}
      </div>

      {/* ── Add Follow-up Modal ───────────────────────────────────────────── */}
      <Dialog open={followUpModalOpen} onOpenChange={setFollowUpModalOpen}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Add Follow-up</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">Record a new follow-up entry for this case.</DialogDescription>
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
              onClick={() => setFollowUpModalOpen(false)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleFollowUpSave}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Add Follow-up
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Note Modal ────────────────────────────────────────────────── */}
      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Add Note</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">Add an internal note to this case.</DialogDescription>
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

      {/* ── Assign Lawyer Modal ───────────────────────────────────────────── */}
      <Dialog open={assignLawyerModalOpen} onOpenChange={setAssignLawyerModalOpen}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Assign Lawyer</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">Select a lawyer to assign to this case.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <input
                type="text"
                value={assignLawyerSearch}
                onChange={(e) => setAssignLawyerSearch(e.target.value)}
                placeholder="Search lawyers..."
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredLawyersForModal.map((lawyer) => {
                const isSelected = selectedLawyerId === lawyer.id
                const isCurrent = lawyer.id === caseData.lawyerId
                const availCfg = AVAILABILITY_CONFIG[lawyer.availability]
                return (
                  <button
                    key={lawyer.id}
                    onClick={() => setSelectedLawyerId(lawyer.id)}
                    disabled={isCurrent}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                        : isCurrent
                          ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 opacity-60 cursor-not-allowed'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{lawyer.name}</p>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{lawyer.specialization}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                      <span>{lawyer.experience} yrs exp</span>
                      <span>{lawyer.activeCases} active cases</span>
                      <span>{lawyer.rating.toFixed(1)} rating</span>
                    </div>
                  </button>
                )
              })}
              {filteredLawyersForModal.length === 0 && (
                <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-4">No lawyers found</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setAssignLawyerModalOpen(false)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignLawyer}
              disabled={!selectedLawyerId}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Assign Lawyer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===========================================================================
// Tab: Follow-ups
// ===========================================================================

function FollowUpsTab({ followUps, onAddFollowUp }: { followUps: CaseFollowUp[]; onAddFollowUp?: () => void }) {
  const sorted = [...followUps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Follow-up Timeline</h2>
        <button
          onClick={onAddFollowUp}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-500 transition-colors cursor-pointer shadow-sm"
        >
          <Plus size={12} />
          Add Follow-up
        </button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={<MessageSquare size={32} />} title="No follow-ups yet" subtitle="Add the first follow-up entry to start tracking this case." />
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

          <div className="space-y-0">
            {sorted.map((fu, idx) => {
              const actionCfg = SERVICE_ACTION_CONFIG[fu.serviceAction] ?? SERVICE_ACTION_CONFIG['Advisory']
              const roleCfg = AUTHOR_ROLE_CONFIG[fu.authorRole]
              const isFirst = idx === 0

              return (
                <div key={fu.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Timeline dot */}
                  <div className="hidden sm:flex shrink-0 relative z-10">
                    <div className={`w-[31px] h-[31px] rounded-full border-2 flex items-center justify-center ${
                      isFirst
                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/40 dark:border-orange-500'
                        : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900'
                    }`}>
                      <MessageSquare size={12} className={isFirst ? 'text-orange-500' : 'text-neutral-400 dark:text-neutral-500'} />
                    </div>
                  </div>

                  {/* Card */}
                  <div className={`flex-1 bg-white dark:bg-neutral-900 rounded-xl border p-4 ${
                    isFirst
                      ? 'border-orange-200 dark:border-orange-900/50 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-800'
                  }`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{fu.title}</h3>
                      </div>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap shrink-0">
                        {timeAgo(fu.createdAt)}
                      </p>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{fu.notes}</p>

                    {fu.attachments.length > 0 && (
                      <div className="flex items-center justify-end">
                        <div className="flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-500">
                          <Paperclip size={10} />
                          <span>{fu.attachments.length} {fu.attachments.length === 1 ? 'file' : 'files'}</span>
                        </div>
                      </div>
                    )}

                    {/* Attachment list */}
                    {fu.attachments.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="flex flex-wrap gap-1.5">
                          {fu.attachments.map((att, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded border border-neutral-200 dark:border-neutral-700">
                              <FileText size={9} />
                              {att}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// Tab: Details
// ===========================================================================

function DetailsTab({ caseData }: { caseData: Case }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-5">
        <SectionCard title="Description">
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{caseData.description}</p>
        </SectionCard>

        <SectionCard title="Case Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldRow label="Case ID" value={caseData.id} mono />
            <FieldRow label="Customer ID" value={caseData.customerId} mono />
            <FieldRow label="Customer" value={caseData.customerName} />
            <FieldRow label="Service Type" value={caseData.serviceType} />
            <FieldRow label="Assigned Lawyer" value={caseData.assignedLawyer} />
            <FieldRow label="Created" value={formatDate(caseData.createdAt)} />
            <FieldRow label="Last Updated" value={formatDate(caseData.lastUpdated)} />
          </div>
        </SectionCard>

        <SectionCard title="Document Checklist">
          {caseData.documentChecklist.length === 0 ? (
            <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">No checklist items</p>
          ) : (
            <ul className="space-y-2">
              {caseData.documentChecklist.map((item, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-600 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800">
                    <CheckCircle2 size={11} className="text-neutral-300 dark:text-neutral-600" />
                  </div>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        <SectionCard title="Status Summary">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Status</span>
              <StatusBadge status={caseData.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Follow-ups</span>
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">{caseData.followUpCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Documents</span>
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">{caseData.documentCount}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Timeline">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">Created</p>
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mt-0.5">{formatDateTime(caseData.createdAt)}</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">Last Updated</p>
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mt-0.5">{formatDateTime(caseData.lastUpdated)}</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">Duration</p>
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mt-0.5">{daysBetween(caseData.createdAt, caseData.lastUpdated)} days</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

// ===========================================================================
// Tab: Notes
// ===========================================================================

function NotesTab({ notes, onAddNote }: { notes: CaseNote[]; onAddNote?: () => void }) {
  const sorted = [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Internal Notes</h2>
        </div>
        <button
          onClick={onAddNote}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-500 transition-colors cursor-pointer shadow-sm"
        >
          <Plus size={12} />
          Add Note
        </button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={<StickyNote size={32} />} title="No notes yet" subtitle="Add internal notes for private team observations." />
      ) : (
        <div className="space-y-3">
          {sorted.map(note => {
            const roleCfg = AUTHOR_ROLE_CONFIG[note.authorRole]
            return (
              <div key={note.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${getInitialColor(note.author)}`}>
                      {getInitials(note.author)}
                    </div>
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{note.author}</span>
                    <span className={`px-1 py-0.5 rounded text-[9px] font-semibold ${roleCfg.bg} ${roleCfg.text}`}>{roleCfg.label}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{formatDateTime(note.createdAt)}</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{note.content}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// Tab: Documents
// ===========================================================================

function DocumentsTab({ documents, onDownloadDocument }: { documents: CaseDocument[]; onDownloadDocument?: (docId: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Documents</h2>
        <span className="text-xs text-neutral-400 dark:text-neutral-500">{documents.length} {documents.length === 1 ? 'document' : 'documents'}</span>
      </div>

      {documents.length === 0 ? (
        <EmptyState icon={<FileText size={32} />} title="No documents yet" subtitle="Documents generated for this case will appear here." />
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[2fr_100px_60px_60px_100px_60px] gap-3 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              <span>Document</span>
              <span>Type</span>
              <span className="text-center">Ver.</span>
              <span>Format</span>
              <span>Status</span>
              <span className="text-center">Size</span>
            </div>

            {documents.map((doc, idx) => {
              const statusCfg = DOC_STATUS_CONFIG[doc.status]
              const isLast = idx === documents.length - 1
              return (
                <div
                  key={doc.id}
                  className={`grid grid-cols-[2fr_100px_60px_60px_100px_60px] gap-3 px-5 py-3.5 items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${
                    !isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                      <FileText size={14} className={doc.format === 'pdf' ? 'text-red-500' : 'text-blue-500'} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{doc.title}</p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500">Updated {formatDate(doc.updatedAt)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">{DOC_TYPE_LABELS[doc.type]}</span>
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 text-center tabular-nums">v{doc.version}</span>
                  <span className="text-[10px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">{doc.format}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${statusCfg.bg} ${statusCfg.text}`}>
                    {statusCfg.label}
                  </span>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => onDownloadDocument?.(doc.id)}
                      className="p-1.5 rounded-md text-neutral-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors cursor-pointer"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {documents.map(doc => {
              const statusCfg = DOC_STATUS_CONFIG[doc.status]
              return (
                <div key={doc.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                        <FileText size={14} className={doc.format === 'pdf' ? 'text-red-500' : 'text-blue-500'} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{doc.title}</p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{DOC_TYPE_LABELS[doc.type]} · v{doc.version} · {doc.format.toUpperCase()} · {doc.fileSize}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDownloadDocument?.(doc.id)}
                      className="p-1.5 rounded-md text-neutral-400 hover:text-orange-500 transition-colors cursor-pointer shrink-0"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                      {statusCfg.label}
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Updated {formatDate(doc.updatedAt)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// Shared Sub-Components
// ===========================================================================

function StatusBadge({ status }: { status: CaseStatus }) {
  const cfg = CASE_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none p-5">
      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function FieldRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="py-1.5">
      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold mb-0.5">{label}</p>
      <p className={`text-sm text-neutral-700 dark:text-neutral-300 ${mono ? 'font-[family-name:var(--font-mono,\'IBM_Plex_Mono\',ui-monospace,monospace)] text-xs' : ''}`}>{value}</p>
    </div>
  )
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="py-16 text-center">
      <div className="text-neutral-300 dark:text-neutral-600 mb-3 flex justify-center">{icon}</div>
      <p className="font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{subtitle}</p>
    </div>
  )
}
