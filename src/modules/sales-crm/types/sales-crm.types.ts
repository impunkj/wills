export const W24_CUSTOMER_ID_REGEX = /^W24-CUST-\d{5}$/
export const W24_CASE_ID_REGEX = /^W24-CASE-\d{5}$/
export const W24_LEAD_ID_REGEX = /^W24-LEAD-\d{5}$/
export const W24_QUOTATION_REF_REGEX = /^W24-QUOT-\d{5}$/

export const SALES_CRM_ROLES = [
  'Admin',
  'Sales',
  'Operations',
  'Legal',
  'Accounts',
  'HR',
] as const

export type SalesCrmRole = (typeof SALES_CRM_ROLES)[number]

export const LEAD_STATUSES = [
  'new',
  'assigned',
  'follow-up',
  'quotation-sent',
  'projected',
  'invoice-sent',
  'won',
  'lost',
] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_TYPES = ['HNI', 'Individual', 'Corporate'] as const
export type LeadType = (typeof LEAD_TYPES)[number]

export const LEAD_SOURCES = [
  'Website',
  'Referral',
  'Wealth Manager',
  'Walk-in',
  'Campaign',
] as const

export type LeadSource = (typeof LEAD_SOURCES)[number]

export const FOLLOW_UP_TYPES = ['update', 'meeting', 'quotation'] as const
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number]

export const FOLLOW_UP_PRIORITIES = ['high', 'medium', 'low'] as const
export type FollowUpPriority = (typeof FOLLOW_UP_PRIORITIES)[number]

export const QUOTATION_STATUSES = [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
] as const

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number]

export const QUOTATION_SENT_VIA_OPTIONS = ['email', 'whatsapp'] as const
export type QuotationSentVia = (typeof QUOTATION_SENT_VIA_OPTIONS)[number]

export const SERVICE_CATEGORIES = [
  'Wills',
  'Trusts',
  'Succession Certificate',
] as const

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]

export interface LeadRecord {
  id: string
  source: LeadSource
  name: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  pinCode: string
  company: string
  designation: string
  serviceInterest: string
  wealthManagerId: string
  wealthManagerName: string
  assignedEmployee: string
  assignedAgentId?: string | null
  leadType: LeadType
  status: LeadStatus
  notes: string
  lastActivity: string
  createdAt: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface FollowUpRecord {
  id: string
  leadId: string
  type: FollowUpType
  title: string
  notes: string
  author: string
  priority: FollowUpPriority
  nextActionDate: string | null
  meetingDate?: string
  meetingLocation?: string
  quotationRef?: string
  createdAt: string
  caseId?: string | null
}

export interface QuotationItemRecord {
  serviceId: string
  serviceName: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface QuotationRecord {
  id: string
  leadId: string
  referenceNumber: string
  items: QuotationItemRecord[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  status: QuotationStatus
  sentVia?: QuotationSentVia | null
  sentAt?: string | null
  createdAt: string
  approvedAt?: string | null
  approvedBy?: string | null
}

export interface ServiceCatalogRecord {
  id: string
  category: ServiceCategory
  name: string
  description: string
  basePrice: number
  taxRate: number
  estimatedTAT: string
  documentChecklist: string[]
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface WealthManagerRecord {
  id: string
  name: string
  email: string
  phone: string
  company: string
  totalSales: number
  isActive: boolean
}

export interface StatusCountsRecord {
  all: number
  new: number
  assigned: number
  'follow-up': number
  'quotation-sent': number
  projected: number
  'invoice-sent': number
  won: number
  lost: number
}

export interface SalesCrmSeedState {
  leads: LeadRecord[]
  followUps: FollowUpRecord[]
  quotations: QuotationRecord[]
  services: ServiceCatalogRecord[]
  wealthManagers: WealthManagerRecord[]
  statusCounts: StatusCountsRecord
}
