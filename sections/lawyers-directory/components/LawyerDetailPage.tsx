import { useState, useMemo } from 'react'
import { ArrowLeft, FileText, Briefcase, MapPin, Calendar, Folder, Download, Check, Clock } from 'lucide-react'
import type { Lawyer } from '../types'
import { LawyerDetail } from '../../team-management/components/TeamManagement'

type TabKey = 'details' | 'cases' | 'documents'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'details', label: 'Details', icon: <FileText size={14} /> },
  { key: 'cases', label: 'Cases Assigned', icon: <Briefcase size={14} /> },
  { key: 'documents', label: 'Documents', icon: <Folder size={14} /> },
]

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  'in-progress': { label: 'In Progress', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' },
  drafting: { label: 'Drafting', bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400' },
  'under-review': { label: 'Under Review', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  approved: { label: 'Approved', bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400' },
  completed: { label: 'Completed', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  'on-hold': { label: 'On Hold', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400' },
}

interface AssignedCase {
  id: string
  customerName: string
  serviceType: string
  serviceName: string
  status: string
  priority: string
  lastUpdated: string
  description: string
}

interface LawyerDetailPageProps {
  lawyer: Lawyer
  cases: AssignedCase[]
  onBack: () => void
  onViewCase?: (id: string) => void
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function LawyerDetailPage({ lawyer, cases, onBack, onViewCase }: LawyerDetailPageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('details')

  const assignedCases = useMemo(
    () => cases.filter((c) => c.assignedLawyer === lawyer.name || c.lawyerId?.toLowerCase() === lawyer.id.toLowerCase()),
    [cases, lawyer]
  )

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer mt-1"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-base font-bold text-emerald-700 dark:text-emerald-300">
            {getInitials(lawyer.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {lawyer.name}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
              <span className="font-mono text-neutral-400 dark:text-neutral-500">{lawyer.barCouncilId}</span>
              <span className="text-neutral-300 dark:text-neutral-600">•</span>
              <span>{lawyer.specialization}</span>
              <span className="text-neutral-300 dark:text-neutral-600">•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} />
                {lawyer.location}
              </span>
              <span className="text-neutral-300 dark:text-neutral-600">•</span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={11} />
                {lawyer.experienceYears} yrs experience
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-neutral-200 dark:border-neutral-700/60 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.key === 'cases' && (
                <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                }`}>
                  {assignedCases.length}
                </span>
              )}
              {tab.key === 'documents' && (
                <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                }`}>
                  {lawyer.documents.length}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t" />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
          <LawyerDetail lawyer={lawyer} />
        </div>
      )}

      {activeTab === 'cases' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
          {assignedCases.length === 0 ? (
            <div className="py-16 text-center">
              <Briefcase size={36} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="font-medium text-neutral-500 dark:text-neutral-400">No cases assigned</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                This lawyer has no cases assigned yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {assignedCases.map((cs) => {
                const statusCfg = STATUS_CONFIG[cs.status] ?? { label: cs.status, bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400' }
                return (
                  <div
                    key={cs.id}
                    onClick={() => onViewCase?.(cs.id)}
                    className="px-5 py-4 flex items-start gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                          {cs.id.replace('W24-CASE-', '')}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-1">{cs.serviceName}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{cs.customerName} · {cs.serviceType}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 line-clamp-2">{cs.description}</p>
                    </div>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap shrink-0 mt-1">
                      {formatDate(cs.lastUpdated)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
          {lawyer.documents.length === 0 ? (
            <div className="py-16 text-center">
              <Folder size={36} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="font-medium text-neutral-500 dark:text-neutral-400">No documents</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                No verification documents have been uploaded for this lawyer.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {lawyer.documents.map((doc) => {
                const isUploaded = doc.status === 'uploaded'
                return (
                  <div
                    key={doc.type}
                    className="px-5 py-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-neutral-500 dark:text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{doc.type}</p>
                      {doc.fileName && (
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5 truncate">
                          {doc.fileName}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isUploaded
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                    }`}>
                      {isUploaded ? <Check size={10} /> : <Clock size={10} />}
                      {isUploaded ? 'Uploaded' : 'Pending'}
                    </span>
                    {isUploaded && (
                      <button
                        className="p-1.5 rounded-md text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:text-orange-400 dark:hover:bg-orange-900/20 transition-colors cursor-pointer"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
