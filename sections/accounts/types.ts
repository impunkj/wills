// =============================================================================
// Data Types
// =============================================================================

export type AccountEntryStatus =
  | 'pi-sent'
  | 'payment-received'
  | 'invoice-sent'
  | 'subscription-enabled'

export type InvoiceType = 'proforma' | 'tax'

export type InvoiceStatus = 'pending' | 'partial' | 'paid' | 'overdue'

export type GstType = 'cgst-sgst' | 'igst'

export type PaymentMode =
  | 'neft'
  | 'rtgs'
  | 'imps'
  | 'upi'
  | 'cheque'
  | 'cash'
  | 'online-gateway'

export type RefundType = 'full' | 'partial'

export type RefundStatus =
  | 'requested'
  | 'pending-approval'
  | 'approved'
  | 'processed'
  | 'completed'
  | 'rejected'

// ---------------------------------------------------------------------------
// Account Entry
// ---------------------------------------------------------------------------

export interface AccountEntry {
  id: string
  leadId: string
  name: string
  phone: string
  email: string
  company: string
  designation: string
  city: string
  state: string
  wealthManagerId: string
  wealthManagerName: string
  quotationRef: string
  quotationAmount: number
  serviceInterest: string
  assignedEmployee: string
  status: AccountEntryStatus
  piSentDate: string
  notes: string
  assignedAt: string
  customerId: string | null
}

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------

export interface InvoiceLineItem {
  serviceId: string
  serviceName: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  type: InvoiceType
  accountEntryId: string
  leadId: string
  customerId: string | null
  customerName: string
  customerEmail: string
  customerState: string
  billingAddress: string
  sellerState: string
  items: InvoiceLineItem[]
  subtotal: number
  gstType: GstType
  cgst: number
  sgst: number
  igst: number
  totalTax: number
  total: number
  tds: number
  netPayable: number
  status: InvoiceStatus
  dueDate: string
  createdAt: string
  paidAt: string | null
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export interface Payment {
  id: string
  invoiceId: string
  accountEntryId: string
  customerName: string
  amount: number
  tds: number
  netReceived: number
  paymentMode: PaymentMode
  transactionRef: string
  receivedDate: string
  invoiceDate: string
  remarks: string
  receiptNumber: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Refund
// ---------------------------------------------------------------------------

export interface Refund {
  id: string
  paymentId: string
  invoiceId: string
  accountEntryId: string
  customerName: string
  originalAmount: number
  refundAmount: number
  type: RefundType
  reason: string
  status: RefundStatus
  creditNoteNumber: string | null
  requestedBy: string
  approvedBy: string | null
  requestedAt: string
  approvedAt: string | null
  processedAt: string | null
  completedAt: string | null
}

// ---------------------------------------------------------------------------
// Summary Stats
// ---------------------------------------------------------------------------

export interface KpiStats {
  totalPISent: number
  totalPendingAmount: number
  receivedPayment: number
  totalQuotationsSent: number
}

export interface StatusCounts {
  all: number
  'pi-sent': number
  'payment-received': number
  'invoice-sent': number
  'subscription-enabled': number
}

// =============================================================================
// Component Props
// =============================================================================

export interface AccountsListProps {
  /** Account entries (leads assigned to accounts) */
  accountEntries: AccountEntry[]
  /** KPI summary stats */
  kpiStats: KpiStats
  /** Count badges for status tabs */
  statusCounts: StatusCounts
  /** Called when user wants to view an account entry's details */
  onView?: (id: string) => void
  /** Called when user wants to edit an account entry */
  onEdit?: (id: string) => void
  /** Called when user wants to add a follow-up */
  onFollowUp?: (id: string) => void
  /** Called when user wants to send a Proforma Invoice */
  onSendPI?: (id: string) => void
  /** Called when user wants to send a Tax Invoice */
  onSendInvoice?: (id: string) => void
  /** Called when user wants to record a payment */
  onRecordPayment?: (id: string) => void
  /** Called when user wants to convert a lead to customer */
  onConvertToCustomer?: (id: string) => void
}

export interface PaymentFormProps {
  /** The account entry to record payment for */
  accountEntry: AccountEntry
  /** The invoice being paid */
  invoice: Invoice
  /** Previous payments against this invoice (for partial payment tracking) */
  existingPayments?: Payment[]
  /** Called when payment is saved */
  onSave?: (data: Omit<Payment, 'id' | 'receiptNumber' | 'createdAt'>) => void
  /** Called when user cancels */
  onCancel?: () => void
}

export interface InvoiceDetailProps {
  /** The invoice to display */
  invoice: Invoice
  /** Payments recorded against this invoice */
  payments: Payment[]
  /** Refunds against payments on this invoice */
  refunds: Refund[]
  /** Called when user wants to record a payment */
  onRecordPayment?: () => void
  /** Called when user wants to initiate a refund */
  onInitiateRefund?: (paymentId: string) => void
  /** Called when user wants to download the invoice PDF */
  onDownloadPDF?: () => void
  /** Called when user navigates back */
  onBack?: () => void
}

export interface RefundFormProps {
  /** The payment to refund */
  payment: Payment
  /** The original invoice */
  invoice: Invoice
  /** Called when refund request is submitted */
  onSubmit?: (data: { amount: number; type: RefundType; reason: string }) => void
  /** Called when user cancels */
  onCancel?: () => void
}
