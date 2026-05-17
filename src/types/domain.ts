// Core domain types for Wills24 Admin.
// Section-specific view-model types live in sections/[section-id]/types.ts.
// These are minimal canonical shapes — adapt field names as needed for your backend.

// ─── Shared enums ───────────────────────────────────────────────────────────

export type LeadStatus =
  | 'new'
  | 'assigned'
  | 'follow-up'
  | 'quotation-sent'
  | 'projected'
  | 'invoice-sent'
  | 'won'
  | 'lost'

export type PaymentMode =
  | 'neft'
  | 'rtgs'
  | 'imps'
  | 'upi'
  | 'cheque'
  | 'cash'
  | 'online-gateway'

export type GstType = 'cgst-sgst' | 'igst'

export type InvoiceType = 'proforma' | 'tax'

export type InvoiceStatus = 'pending' | 'partial' | 'paid' | 'overdue'

export type RefundType = 'full' | 'partial'

export type RefundStatus =
  | 'requested'
  | 'pending-approval'
  | 'approved'
  | 'processed'
  | 'completed'
  | 'rejected'

export type CaseStatus =
  | 'in-progress'
  | 'drafting'
  | 'under-review'
  | 'approved'
  | 'completed'
  | 'on-hold'

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

export type WMTier = 'platinum' | 'gold' | 'silver' | 'bronze'

export type WMStatus = 'active' | 'inactive'

export type LawyerAvailability = 'available' | 'on-leave' | 'overloaded' | 'busy'

export type EmployeeRole = 'admin' | 'sales' | 'operations' | 'legal' | 'accounts' | 'hr'

// ─── Entities ───────────────────────────────────────────────────────────────

export interface Lead {
  id: string
  source: string
  name: string
  phone: string
  email: string
  city: string
  state: string
  company: string
  designation: string
  serviceInterest: string
  wealthManagerId: string
  assignedEmployee: string
  status: LeadStatus
  notes: string
  createdAt: string
  lastActivity: string
}

export interface Customer {
  id: string // W24-CUST-XXXXX
  leadId: string
  name: string
  phone: string
  email: string
  company: string
  city: string
  state: string
  pan: string
  wealthManagerId: string
  convertedAt: string
  status: 'active' | 'inactive' | 'pending'
}

export interface Case {
  id: string // W24-CASE-XXXXX
  customerId: string
  serviceType: string
  assignedLawyerId: string
  status: CaseStatus
  caseLevel: CaseLevel
  priority: 'low' | 'normal' | 'high'
  createdAt: string
  lastUpdated: string
  description: string
}

export interface Quotation {
  id: string
  leadId: string
  referenceNumber: string
  items: Array<{ serviceId: string; quantity: number; unitPrice: number }>
  subtotal: number
  taxAmount: number
  total: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  sentVia: 'email' | 'whatsapp'
  sentAt: string
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  type: InvoiceType
  customerId: string | null
  customerName: string
  customerState: string
  sellerState: string
  subtotal: number
  gstType: GstType
  totalTax: number
  total: number
  status: InvoiceStatus
  dueDate: string
  createdAt: string
  paidAt: string | null
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  tds: number
  netReceived: number
  paymentMode: PaymentMode
  transactionRef: string
  receivedDate: string
  receiptNumber: string
  createdAt: string
}

export interface Service {
  id: string
  category: 'Wills' | 'Trusts' | 'Succession Certificate'
  name: string
  basePrice: number
  taxRate: number
  estimatedTAT: string
  documentChecklist: string[]
  isActive: boolean
}

export interface Template {
  id: string
  type: DocumentType
  name: string
  version: number
  isActive: boolean
}

export interface CaseDocument {
  id: string
  caseId: string
  templateId: string | null
  title: string
  type: DocumentType
  version: number
  status: DocumentStatus
  format: 'pdf' | 'docx'
  createdAt: string
  updatedAt: string
}

export interface FollowUp {
  id: string
  // Either lead or case context (not both)
  leadId?: string
  caseId?: string
  type: 'update' | 'meeting' | 'quotation'
  title: string
  notes: string
  author: string
  priority: 'low' | 'normal' | 'high' | 'medium'
  createdAt: string
}

export interface WealthManager {
  id: string // PAT-XXXXX
  name: string
  email: string
  phone: string
  company: { name: string; gstNumber: string; panNumber: string }
  tier: WMTier
  status: WMStatus
  willsRemaining: number
  willsUsed: number
  totalSales: number
  joinedAt: string
}

export interface WMPackage {
  id: string
  wmId: string
  tier: WMTier
  willsIncluded: number
  willsUsed: number
  willsRemaining: number
  totalPrice: number
  validityMonths: number
  purchasedAt: string
  expiresAt: string
  status: 'active' | 'expired' | 'exhausted'
}

export interface WalletTransaction {
  id: string
  wmId: string
  type: 'package_purchase' | 'will_used'
  title: string
  amount: number
  willCredits: number | null
  customerName: string | null
  remarks: string
  createdAt: string
}

export interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  mobile: string
  role: EmployeeRole
  department: string
  designation: string
  dateOfJoining: string
  status: 'active' | 'inactive'
}

export interface Lawyer {
  id: string
  name: string
  email: string
  phone: string
  specialization: string
  barCouncilId: string
  location: string
  experienceYears: number
  availability: LawyerAvailability
  activeCases: number
  rating: number
}

export interface Refund {
  id: string
  paymentId: string
  invoiceId: string
  originalAmount: number
  refundAmount: number
  type: RefundType
  reason: string
  status: RefundStatus
  creditNoteNumber: string | null
  requestedBy: string
  approvedBy: string | null
  requestedAt: string
  completedAt: string | null
}
