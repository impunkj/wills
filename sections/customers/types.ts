// =============================================================================
// Data Types
// =============================================================================

export type CustomerStatus = 'active' | 'inactive' | 'pending'

export type ServiceStatus = 'pending' | 'in-progress' | 'completed'

export type CaseStatus = 'pending' | 'in-progress' | 'completed'

export type CaseLevel =
  | 'not-started'
  | 'drafting'
  | 'review'
  | 'court-filing'
  | 'delivered'

export type DocumentType = 'will' | 'trust' | 'succession-certificate'

export type DocumentStatus =
  | 'draft'
  | 'under-review'
  | 'approved'
  | 'delivered'
  | 'registered'

export type PaymentMode =
  | 'neft'
  | 'rtgs'
  | 'imps'
  | 'upi'
  | 'cheque'
  | 'cash'
  | 'online-gateway'

export type PaymentStatus = 'confirmed' | 'pending' | 'failed'

export type FollowUpType = 'update' | 'meeting' | 'quotation'

export type FollowUpPriority = 'low' | 'normal' | 'high'

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export interface Customer {
  id: string
  leadId: string
  accountEntryId: string
  name: string
  phone: string
  email: string
  company: string
  designation: string
  city: string
  state: string
  address: string
  dateOfBirth: string
  pan: string
  wealthManagerId: string
  wealthManagerName: string
  servicesAvailed: string[]
  activeCases: number
  totalCases: number
  totalPayments: number
  pendingAmount: number
  status: CustomerStatus
  convertedAt: string
  notes: string
}

// ---------------------------------------------------------------------------
// Customer Service
// ---------------------------------------------------------------------------

export interface CustomerService {
  id: string
  customerId: string
  serviceId: string
  serviceName: string
  category: string
  caseId: string | null
  status: ServiceStatus
  startDate: string
  amount: number
}

// ---------------------------------------------------------------------------
// Customer Case
// ---------------------------------------------------------------------------

export interface CustomerCase {
  id: string
  customerId: string
  customerName: string
  serviceType: string
  assignedLawyer: string
  lawyerId: string
  status: CaseStatus
  caseLevel: CaseLevel
  followUpCount: number
  lastUpdated: string
  createdAt: string
  description: string
}

// ---------------------------------------------------------------------------
// Customer Document
// ---------------------------------------------------------------------------

export interface CustomerDocument {
  id: string
  caseId: string
  customerId: string
  title: string
  type: DocumentType
  templateId: string
  version: number
  status: DocumentStatus
  format: 'pdf' | 'docx'
  createdAt: string
  updatedAt: string
  fileSize: string
}

// ---------------------------------------------------------------------------
// Customer Payment
// ---------------------------------------------------------------------------

export interface CustomerPayment {
  id: string
  customerId: string
  invoiceNumber: string
  amount: number
  tds: number
  netReceived: number
  paymentMode: PaymentMode
  receivedDate: string
  status: PaymentStatus
}

// ---------------------------------------------------------------------------
// Customer Follow-Up
// ---------------------------------------------------------------------------

export interface CustomerFollowUp {
  id: string
  customerId: string
  caseId: string | null
  type: FollowUpType
  title: string
  notes: string
  author: string
  priority: FollowUpPriority
  createdAt: string
}

// ---------------------------------------------------------------------------
// Wealth Manager
// ---------------------------------------------------------------------------

export interface WealthManager {
  id: string
  name: string
  email: string
  phone: string
  company: string
  city: string
  state: string
  totalCustomers: number
  activeLeads: number
  photoUrl: string | null
}

// ---------------------------------------------------------------------------
// Summary Stats
// ---------------------------------------------------------------------------

export interface KpiStats {
  totalCustomers: number
  activeCases: number
  servicesAvailed: number
  revenueGenerated: number
}

export interface StatusCounts {
  all: number
  active: number
  inactive: number
}

// =============================================================================
// Component Props
// =============================================================================

export interface CustomerListProps {
  /** All converted customers */
  customers: Customer[]
  /** KPI summary stats */
  kpiStats: KpiStats
  /** Count badges for status filters */
  statusCounts: StatusCounts
  /** Called when user wants to view a customer's details */
  onView?: (id: string) => void
  /** Called when user wants to edit a customer */
  onEdit?: (id: string) => void
  /** Called when user wants to send a quotation for additional services */
  onSendQuotation?: (id: string) => void
  /** Called when user wants to view a customer's cases */
  onViewCases?: (id: string) => void
  /** Called when user wants to view a customer's documents */
  onViewDocuments?: (id: string) => void
  /** Called when user submits the New Customer form */
  onCreate?: (customer: Customer) => void
}

export interface CustomerDetailProps {
  /** The customer to display */
  customer: Customer
  /** Services availed by this customer */
  services: CustomerService[]
  /** Cases associated with this customer */
  cases: CustomerCase[]
  /** Documents generated for this customer */
  documents: CustomerDocument[]
  /** Payment history for this customer */
  payments: CustomerPayment[]
  /** Follow-up timeline for this customer */
  followUps: CustomerFollowUp[]
  /** Assigned Wealth Manager details */
  wealthManager: WealthManager
  /** Called when user wants to edit the customer */
  onEdit?: () => void
  /** Called when user wants to send a quotation for additional services */
  onSendQuotation?: () => void
  /** Called when user wants to view a specific case */
  onViewCase?: (caseId: string) => void
  /** Called when user wants to download a document */
  onDownloadDocument?: (docId: string) => void
  /** Called when user navigates back */
  onBack?: () => void
}
