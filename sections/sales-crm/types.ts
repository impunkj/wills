// =============================================================================
// Data Types
// =============================================================================

export type LeadStatus =
  | 'new'
  | 'assigned'
  | 'follow-up'
  | 'quotation-sent'
  | 'projected'
  | 'invoice-sent'
  | 'won'
  | 'lost'

export type LeadType = 'HNI' | 'Individual' | 'Corporate'

export type LeadSource =
  | 'Website'
  | 'Referral'
  | 'Wealth Manager'
  | 'Walk-in'
  | 'Campaign'

export type FollowUpType = 'update' | 'meeting' | 'quotation'

export type FollowUpPriority = 'high' | 'medium' | 'low'

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export type QuotationSentVia = 'email' | 'whatsapp'

export type ServiceCategory = 'Wills' | 'Trusts' | 'Succession Certificate'

export interface Lead {
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
  leadType: LeadType
  status: LeadStatus
  notes: string
  lastActivity: string
  createdAt: string
}

export interface FollowUp {
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
}

export interface QuotationItem {
  serviceId: string
  serviceName: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface Quotation {
  id: string
  leadId: string
  referenceNumber: string
  items: QuotationItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  status: QuotationStatus
  sentVia: QuotationSentVia
  sentAt: string
  createdAt: string
}

export interface Service {
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
}

export interface WealthManager {
  id: string
  name: string
  email: string
  phone: string
  company: string
  totalSales: number
  isActive: boolean
}

export interface StatusCounts {
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

// =============================================================================
// Component Props
// =============================================================================

export interface SalesCRMProps {
  /** List of leads to display in the list view */
  leads: Lead[]
  /** Follow-up entries for lead timelines */
  followUps: FollowUp[]
  /** Quotations linked to leads */
  quotations: Quotation[]
  /** Services catalog for quotation generation */
  services: Service[]
  /** Wealth Managers for lead assignment dropdown */
  wealthManagers: WealthManager[]
  /** Count badges for status tabs */
  statusCounts: StatusCounts
  /** Called when user wants to view a lead's details */
  onViewLead?: (id: string) => void
  /** Called when user wants to edit a lead */
  onEditLead?: (id: string) => void
  /** Called when user wants to delete a lead */
  onDeleteLead?: (id: string) => void
  /** Called when user wants to create a new lead */
  onCreateLead?: () => void
  /** Called when user wants to import leads from CSV/Excel */
  onImportLeads?: () => void
  /** Called when user wants to export the filtered leads list */
  onExportLeads?: () => void
  /** Called when user adds a follow-up entry on a lead */
  onAddFollowUp?: (leadId: string) => void
  /** Called when user assigns a lead to Accounts for payment confirmation */
  onAssignToAccounts?: (leadId: string) => void
  /** Called when user wants to create a new quotation for a lead */
  onCreateQuotation?: (leadId: string) => void
  /** Called when user sends a quotation via email or WhatsApp */
  onSendQuotation?: (quotationId: string, via: QuotationSentVia) => void
  /** Called when user wants to add a new service to the catalog */
  onCreateService?: () => void
  /** Called when user wants to edit a service in the catalog */
  onEditService?: (id: string) => void
  /** Called when user toggles a service's active/inactive status */
  onToggleService?: (id: string) => void
}
