import { useState, useMemo } from 'react'
import {
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CircleDot,
  ShieldCheck,
  Loader2,
  Ban,
  FileText,
  IndianRupee,
  Info,
  Receipt,
  ChevronDown,
  User,
  Calendar,
  CreditCard,
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
  Payment,
  Invoice,
  Refund,
  RefundType,
  RefundStatus,
} from '../types'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RefundFormProps {
  payment: Payment
  invoice: Invoice
  onSubmit?: (data: { amount: number; type: RefundType; reason: string }) => void
  onCancel?: () => void
}

// Full refund workflow view — shows list of refunds with approval chain
export interface RefundWorkflowProps {
  refunds: Refund[]
  payments: Payment[]
  invoices: Invoice[]
  onApprove?: (refundId: string) => void
  onReject?: (refundId: string) => void
  onProcess?: (refundId: string) => void
  onComplete?: (refundId: string) => void
  onInitiateRefund?: (paymentId: string) => void
  onBack?: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REFUND_STATUS_CONFIG: Record<
  RefundStatus,
  { label: string; icon: React.ReactNode; bg: string; text: string; dot: string }
> = {
  requested: {
    label: 'Requested',
    icon: <CircleDot size={12} />,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  'pending-approval': {
    label: 'Pending Approval',
    icon: <Clock size={12} />,
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  approved: {
    label: 'Approved',
    icon: <ShieldCheck size={12} />,
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  processed: {
    label: 'Processed',
    icon: <Loader2 size={12} />,
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-400',
    dot: 'bg-violet-500',
  },
  completed: {
    label: 'Completed',
    icon: <CheckCircle2 size={12} />,
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    icon: <Ban size={12} />,
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
}

const APPROVAL_STEPS: { key: string; label: string }[] = [
  { key: 'requested', label: 'Requested' },
  { key: 'approved', label: 'Approved' },
  { key: 'processed', label: 'Processed' },
  { key: 'completed', label: 'Completed' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getStepStatus(refund: Refund, stepKey: string): 'done' | 'current' | 'pending' {
  const order: Record<string, number> = {
    requested: 0,
    'pending-approval': 0,
    approved: 1,
    processed: 2,
    completed: 3,
    rejected: -1,
  }
  const stepOrder: Record<string, number> = {
    requested: 0,
    approved: 1,
    processed: 2,
    completed: 3,
  }

  if (refund.status === 'rejected') {
    return stepKey === 'requested' ? 'done' : 'pending'
  }

  const currentIdx = order[refund.status] ?? 0
  const stepIdx = stepOrder[stepKey] ?? 0

  if (stepIdx < currentIdx) return 'done'
  if (stepIdx === currentIdx) return 'current'
  return 'pending'
}

// ---------------------------------------------------------------------------
// Modal State Types
// ---------------------------------------------------------------------------

interface ApproveModalState {
  refundId: string
  refundAmount: number
  customerName: string
}

interface RejectModalState {
  refundId: string
  customerName: string
  reason: string
}

interface ProcessModalState {
  refundId: string
  customerName: string
  refundAmount: number
}

interface CompleteModalState {
  refundId: string
  customerName: string
  refundAmount: number
}

interface InitiateRefundModalState {
  paymentId: string
  paymentAmount: number
  customerName: string
  refundAmount: string
  reason: string
}

// ---------------------------------------------------------------------------
// Refund Workflow Component
// ---------------------------------------------------------------------------

export function RefundWorkflow({
  refunds,
  payments,
  invoices,
  onApprove,
  onReject,
  onProcess,
  onComplete,
  onInitiateRefund,
  onBack,
}: RefundWorkflowProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    refunds.length > 0 ? refunds[0].id : null,
  )

  // Modal states
  const [approveModal, setApproveModal] = useState<ApproveModalState | null>(null)
  const [rejectModal, setRejectModal] = useState<RejectModalState | null>(null)
  const [processModal, setProcessModal] = useState<ProcessModalState | null>(null)
  const [completeModal, setCompleteModal] = useState<CompleteModalState | null>(null)
  const [initiateRefundModal, setInitiateRefundModal] = useState<InitiateRefundModalState | null>(null)

  // Stats
  const stats = useMemo(() => {
    const totalRefundAmount = refunds.reduce((s, r) => s + r.refundAmount, 0)
    const pendingCount = refunds.filter(
      (r) => r.status === 'requested' || r.status === 'pending-approval',
    ).length
    const approvedCount = refunds.filter(
      (r) => r.status === 'approved' || r.status === 'processed' || r.status === 'completed',
    ).length
    return { totalRefundAmount, pendingCount, approvedCount, total: refunds.length }
  }, [refunds])

  // Modal open handlers
  function openApproveModal(refund: Refund) {
    setApproveModal({
      refundId: refund.id,
      refundAmount: refund.refundAmount,
      customerName: refund.customerName,
    })
  }

  function openRejectModal(refund: Refund) {
    setRejectModal({
      refundId: refund.id,
      customerName: refund.customerName,
      reason: '',
    })
  }

  function openProcessModal(refund: Refund) {
    setProcessModal({
      refundId: refund.id,
      customerName: refund.customerName,
      refundAmount: refund.refundAmount,
    })
  }

  function openCompleteModal(refund: Refund) {
    setCompleteModal({
      refundId: refund.id,
      customerName: refund.customerName,
      refundAmount: refund.refundAmount,
    })
  }

  function openInitiateRefundModal(payment: Payment) {
    setInitiateRefundModal({
      paymentId: payment.id,
      paymentAmount: payment.amount,
      customerName: payment.customerName,
      refundAmount: payment.amount.toString(),
      reason: '',
    })
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Refund Workflow
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                Manage refund requests, approvals, and credit note generation
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50">
              <RotateCcw size={11} />
              Refunds
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <StatCard
              label="Total Refunds"
              value={stats.total.toString()}
              iconBg="bg-neutral-100 dark:bg-neutral-800"
              iconColor="text-neutral-500 dark:text-neutral-400"
              icon={<RotateCcw size={14} />}
            />
            <StatCard
              label="Refund Amount"
              value={formatCurrency(stats.totalRefundAmount)}
              iconBg="bg-red-100 dark:bg-red-900/40"
              iconColor="text-red-600 dark:text-red-400"
              icon={<IndianRupee size={14} />}
            />
            <StatCard
              label="Pending Approval"
              value={stats.pendingCount.toString()}
              iconBg="bg-orange-100 dark:bg-orange-900/40"
              iconColor="text-orange-600 dark:text-orange-400"
              icon={<Clock size={14} />}
            />
            <StatCard
              label="Approved / Done"
              value={stats.approvedCount.toString()}
              iconBg="bg-emerald-100 dark:bg-emerald-900/40"
              iconColor="text-emerald-600 dark:text-emerald-400"
              icon={<CheckCircle2 size={14} />}
            />
          </div>
        </div>
      </div>

      {/* ── Refund Cards ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {refunds.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none py-16 text-center">
            <RotateCcw
              size={36}
              className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3"
            />
            <p className="font-medium text-neutral-500 dark:text-neutral-400">
              No refund requests
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Refunds can be initiated from individual payment records
            </p>
          </div>
        ) : (
          refunds.map((refund) => {
            const rsCfg = REFUND_STATUS_CONFIG[refund.status]
            const isExpanded = expandedId === refund.id
            const relatedPayment = payments.find((p) => p.id === refund.paymentId)
            const relatedInvoice = invoices.find((inv) => inv.id === refund.invoiceId)

            return (
              <div
                key={refund.id}
                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none overflow-hidden"
              >
                {/* Card Header — always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : refund.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors text-left"
                >
                  {/* Status indicator */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${rsCfg.bg}`}
                  >
                    <span className={rsCfg.text}>{rsCfg.icon}</span>
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {refund.customerName}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${rsCfg.bg} ${rsCfg.text}`}
                      >
                        {rsCfg.label}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                        {refund.type}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
                      Requested by {refund.requestedBy} on{' '}
                      {formatDate(refund.requestedAt)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                      {formatCurrency(refund.refundAmount)}
                    </p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                      of {formatCurrency(refund.originalAmount)}
                    </p>
                  </div>

                  {/* Expand chevron */}
                  <ChevronDown
                    size={16}
                    className={`text-neutral-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 dark:border-neutral-800">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 lg:divide-x divide-neutral-100 dark:divide-neutral-800">
                      {/* Left: Details */}
                      <div className="lg:col-span-3 p-5 space-y-4">
                        {/* Reason */}
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
                            Reason for Refund
                          </p>
                          <div className="px-3 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-sm text-neutral-700 dark:text-neutral-300">
                            {refund.reason}
                          </div>
                        </div>

                        {/* Payment & Invoice Reference */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Original Payment */}
                          {relatedPayment && (
                            <div className="px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5 flex items-center gap-1">
                                <CreditCard size={10} />
                                Original Payment
                              </p>
                              <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                                {relatedPayment.receiptNumber}
                              </p>
                              <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                                <span>{formatDate(relatedPayment.receivedDate)}</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                                  {relatedPayment.paymentMode}
                                </span>
                                <span className="font-semibold tabular-nums font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                                  {formatCurrency(relatedPayment.amount)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Invoice Reference */}
                          {relatedInvoice && (
                            <div className="px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5 flex items-center gap-1">
                                <FileText size={10} />
                                Invoice
                              </p>
                              <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                                {relatedInvoice.invoiceNumber}
                              </p>
                              <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded ${
                                    relatedInvoice.type === 'proforma'
                                      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                                      : 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                                  }`}
                                >
                                  {relatedInvoice.type === 'proforma' ? 'PI' : 'Tax'}
                                </span>
                                <span className="font-semibold tabular-nums font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                                  {formatCurrency(relatedInvoice.total)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Credit Note */}
                        {refund.creditNoteNumber && (
                          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                            <FileText
                              size={14}
                              className="text-emerald-600 dark:text-emerald-400 shrink-0"
                            />
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Credit Note Generated
                              </p>
                              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                                {refund.creditNoteNumber}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Approval Chain */}
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
                            Approval Chain
                          </p>

                          {refund.status === 'rejected' ? (
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                              <Ban
                                size={14}
                                className="text-red-500 shrink-0"
                              />
                              <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                                Refund request was rejected
                              </p>
                            </div>
                          ) : (
                            <div className="relative">
                              {/* Vertical line */}
                              <div className="absolute left-[15px] top-4 bottom-4 w-px bg-neutral-200 dark:bg-neutral-700" />

                              <div className="space-y-0">
                                {APPROVAL_STEPS.map((step, idx) => {
                                  const status = getStepStatus(refund, step.key)
                                  const date = getStepDate(refund, step.key)
                                  const actor = getStepActor(refund, step.key)

                                  return (
                                    <div
                                      key={step.key}
                                      className="relative flex items-start gap-3 py-2.5"
                                    >
                                      {/* Step indicator */}
                                      <div
                                        className={`relative z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 ${
                                          status === 'done'
                                            ? 'bg-emerald-500 text-white'
                                            : status === 'current'
                                              ? 'bg-orange-500 text-white ring-4 ring-orange-100 dark:ring-orange-900/30'
                                              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500'
                                        }`}
                                      >
                                        {status === 'done' ? (
                                          <CheckCircle2 size={14} />
                                        ) : status === 'current' ? (
                                          <Clock size={14} />
                                        ) : (
                                          <CircleDot size={12} />
                                        )}
                                      </div>

                                      {/* Step content */}
                                      <div className="min-w-0 flex-1 pt-1">
                                        <div className="flex items-center gap-2">
                                          <p
                                            className={`text-sm font-semibold ${
                                              status === 'done'
                                                ? 'text-neutral-900 dark:text-neutral-100'
                                                : status === 'current'
                                                  ? 'text-orange-700 dark:text-orange-400'
                                                  : 'text-neutral-400 dark:text-neutral-500'
                                            }`}
                                          >
                                            {step.label}
                                          </p>
                                          {status === 'current' && (
                                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                                              Current
                                            </span>
                                          )}
                                        </div>
                                        {date && (
                                          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                                            {formatDate(date)}
                                            {actor && (
                                              <span>
                                                {' '}
                                                by{' '}
                                                <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                                                  {actor}
                                                </span>
                                              </span>
                                            )}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions sidebar */}
                      <div className="lg:col-span-2 p-5 bg-neutral-50 dark:bg-neutral-800/20 space-y-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                          Actions
                        </p>

                        {/* Contextual action buttons based on status */}
                        {refund.status === 'pending-approval' && (
                          <div className="space-y-2">
                            <button
                              onClick={() => openApproveModal(refund)}
                              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-colors cursor-pointer"
                            >
                              <ShieldCheck size={14} />
                              Approve Refund
                            </button>
                            <button
                              onClick={() => openRejectModal(refund)}
                              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-neutral-800 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                            >
                              <Ban size={14} />
                              Reject
                            </button>
                          </div>
                        )}

                        {refund.status === 'approved' && (
                          <button
                            onClick={() => openProcessModal(refund)}
                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-violet-500 hover:bg-violet-600 rounded-lg shadow-sm transition-colors cursor-pointer"
                          >
                            <Loader2 size={14} />
                            Process Refund
                          </button>
                        )}

                        {refund.status === 'processed' && (
                          <button
                            onClick={() => openCompleteModal(refund)}
                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-colors cursor-pointer"
                          >
                            <CheckCircle2 size={14} />
                            Mark Complete
                          </button>
                        )}

                        {(refund.status === 'completed' || refund.status === 'rejected') && (
                          <div
                            className={`px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                              refund.status === 'completed'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                                : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {refund.status === 'completed' ? (
                              <CheckCircle2 size={13} />
                            ) : (
                              <Ban size={13} />
                            )}
                            {refund.status === 'completed'
                              ? 'Refund completed'
                              : 'Refund rejected'}
                          </div>
                        )}

                        {refund.status === 'requested' && (
                          <div className="px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <Info size={12} />
                            Awaiting review before approval
                          </div>
                        )}

                        {/* Initiate Refund button for payments with available refund */}
                        {relatedPayment && refund.status === 'requested' && (
                          <button
                            onClick={() => openInitiateRefundModal(relatedPayment)}
                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-orange-600 dark:text-orange-400 bg-white dark:bg-neutral-800 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors cursor-pointer"
                          >
                            <RotateCcw size={14} />
                            Initiate Refund
                          </button>
                        )}

                        {/* Summary card */}
                        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                            Summary
                          </p>
                          <SummaryRow
                            label="Refund Type"
                            value={refund.type === 'full' ? 'Full Refund' : 'Partial Refund'}
                          />
                          <SummaryRow
                            label="Refund Amount"
                            value={formatCurrency(refund.refundAmount)}
                            mono
                            highlight
                          />
                          <SummaryRow
                            label="Original Payment"
                            value={formatCurrency(refund.originalAmount)}
                            mono
                          />
                          <SummaryRow
                            label="Requested By"
                            value={refund.requestedBy}
                          />
                          {refund.approvedBy && (
                            <SummaryRow
                              label="Approved By"
                              value={refund.approvedBy}
                            />
                          )}
                          <SummaryRow
                            label="Account"
                            value={refund.accountEntryId}
                            mono
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── Approve Confirmation Modal ─────────────────────────────────── */}
      <Dialog open={approveModal !== null} onOpenChange={(open) => { if (!open) setApproveModal(null) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Approve Refund</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Are you sure you want to approve this refund of{' '}
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {approveModal ? formatCurrency(approveModal.refundAmount) : ''}
              </span>{' '}
              for {approveModal?.customerName}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              This will move the refund to the processing stage.
            </p>
          </div>
          <DialogFooter>
            <button
              onClick={() => setApproveModal(null)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (approveModal) {
                  onApprove?.(approveModal.refundId)
                  setApproveModal(null)
                }
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Approve
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Confirmation Modal ──────────────────────────────────── */}
      <Dialog open={rejectModal !== null} onOpenChange={(open) => { if (!open) setRejectModal(null) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Reject Refund</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Are you sure you want to reject this refund for {rejectModal?.customerName}?
            </DialogDescription>
          </DialogHeader>
          {rejectModal && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Reason for rejection
                </label>
                <textarea
                  rows={3}
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  placeholder="Provide a reason for rejecting this refund..."
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setRejectModal(null)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (rejectModal) {
                  onReject?.(rejectModal.refundId)
                  setRejectModal(null)
                }
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Process Confirmation Modal ─────────────────────────────────── */}
      <Dialog open={processModal !== null} onOpenChange={(open) => { if (!open) setProcessModal(null) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Process Refund</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Mark this refund of{' '}
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {processModal ? formatCurrency(processModal.refundAmount) : ''}
              </span>{' '}
              for {processModal?.customerName} as processed?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/40">
            <Loader2 size={14} className="text-violet-600 dark:text-violet-400 shrink-0" />
            <p className="text-sm text-violet-700 dark:text-violet-400">
              This indicates the refund has been initiated with the payment provider.
            </p>
          </div>
          <DialogFooter>
            <button
              onClick={() => setProcessModal(null)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (processModal) {
                  onProcess?.(processModal.refundId)
                  setProcessModal(null)
                }
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Mark as Processed
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Complete Confirmation Modal ────────────────────────────────── */}
      <Dialog open={completeModal !== null} onOpenChange={(open) => { if (!open) setCompleteModal(null) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Complete Refund</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Mark this refund of{' '}
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {completeModal ? formatCurrency(completeModal.refundAmount) : ''}
              </span>{' '}
              for {completeModal?.customerName} as completed?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              This marks the refund as fully completed. A credit note will be generated.
            </p>
          </div>
          <DialogFooter>
            <button
              onClick={() => setCompleteModal(null)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (completeModal) {
                  onComplete?.(completeModal.refundId)
                  setCompleteModal(null)
                }
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Mark as Completed
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Initiate Refund Modal ──────────────────────────────────────── */}
      <Dialog open={initiateRefundModal !== null} onOpenChange={(open) => { if (!open) setInitiateRefundModal(null) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Initiate Refund</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Initiate a refund for {initiateRefundModal?.customerName}
            </DialogDescription>
          </DialogHeader>
          {initiateRefundModal && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Payment ID
                </label>
                <input
                  type="text"
                  value={initiateRefundModal.paymentId}
                  readOnly
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Refund Amount
                </label>
                <input
                  type="number"
                  value={initiateRefundModal.refundAmount}
                  onChange={(e) => setInitiateRefundModal({ ...initiateRefundModal, refundAmount: e.target.value })}
                  max={initiateRefundModal.paymentAmount}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
                <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                  Maximum: {formatCurrency(initiateRefundModal.paymentAmount)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Reason
                </label>
                <textarea
                  rows={3}
                  value={initiateRefundModal.reason}
                  onChange={(e) => setInitiateRefundModal({ ...initiateRefundModal, reason: e.target.value })}
                  placeholder="Provide a reason for this refund..."
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setInitiateRefundModal(null)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (initiateRefundModal) {
                  onInitiateRefund?.(initiateRefundModal.paymentId)
                  setInitiateRefundModal(null)
                }
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Initiate Refund
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step helpers
// ---------------------------------------------------------------------------

function getStepDate(refund: Refund, stepKey: string): string | null {
  switch (stepKey) {
    case 'requested':
      return refund.requestedAt
    case 'approved':
      return refund.approvedAt
    case 'processed':
      return refund.processedAt
    case 'completed':
      return refund.completedAt
    default:
      return null
  }
}

function getStepActor(refund: Refund, stepKey: string): string | null {
  switch (stepKey) {
    case 'requested':
      return refund.requestedBy
    case 'approved':
      return refund.approvedBy
    default:
      return null
  }
}

// ===========================================================================
// Sub-components
// ===========================================================================

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}
        >
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-0.5">
        {label}
      </p>
      <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
        {value}
      </p>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      <span
        className={`font-medium ${
          highlight
            ? 'text-red-600 dark:text-red-400 font-bold'
            : 'text-neutral-700 dark:text-neutral-300'
        } ${
          mono
            ? "font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]"
            : ''
        }`}
      >
        {value}
      </span>
    </div>
  )
}
