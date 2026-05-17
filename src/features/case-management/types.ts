// =============================================================================
// Data Types
// =============================================================================

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

export type CasePriority = 'low' | 'normal' | 'high'

export type ServiceType =
  | 'Will Drafting (Basic)'
  | 'Will Drafting (Advanced)'
  | 'Trust Drafting'
  | 'Trust Registration'
  | 'Trust Advisory'
  | 'Succession Certificate'

export type WillAction = 'Drafting' | 'Client Review' | 'Revision' | 'Registration' | 'Advisory'

export type TrustAction = 'Trust Drafting' | 'Client Review' | 'Trust Registration' | 'Advisory'

export type SuccessionAction = 'Application Filing' | 'Court Hearing' | 'Certificate Obtained'

export type ServiceAction = WillAction | TrustAction | SuccessionAction

export type AuthorRole = 'lawyer' | 'operations' | 'admin' | 'legal'

export type DocumentType = 'will' | 'trust' | 'succession-certificate'

export type DocumentStatus =
  | 'draft'
  | 'under-review'
  | 'approved'
  | 'delivered'
  | 'registered'

export type LawyerAvailability = 'available' | 'busy' | 'on-leave'

// ---------------------------------------------------------------------------
// Case
// ---------------------------------------------------------------------------

export interface Case {
  id: string
  customerId: string
  customerName: string
  serviceType: string
  serviceName: string
  assignedLawyer: string
  lawyerId: string
  assignedEmployee: string
  employeeId: string
  status: CaseStatus
  caseLevel: CaseLevel
  priority: CasePriority
  followUpCount: number
  documentCount: number
  lastUpdated: string
  createdAt: string
  description: string
  documentChecklist: string[]
}

// ---------------------------------------------------------------------------
// Case Follow-Up
// ---------------------------------------------------------------------------

export interface CaseFollowUp {
  id: string
  caseId: string
  title: string
  notes: string
  serviceAction: ServiceAction
  author: string
  authorRole: AuthorRole
  priority: CasePriority
  statusChange: { from: string; to: string } | null
  attachments: string[]
  createdAt: string
}

// ---------------------------------------------------------------------------
// Case Note (Internal)
// ---------------------------------------------------------------------------

export interface CaseNote {
  id: string
  caseId: string
  content: string
  author: string
  authorRole: AuthorRole
  createdAt: string
}

// ---------------------------------------------------------------------------
// Case Document
// ---------------------------------------------------------------------------

export interface CaseDocument {
  id: string
  caseId: string
  title: string
  type: DocumentType
  templateId: string | null
  version: number
  status: DocumentStatus
  format: 'pdf' | 'docx'
  createdAt: string
  updatedAt: string
  fileSize: string
}

// ---------------------------------------------------------------------------
// Lawyer
// ---------------------------------------------------------------------------

export interface Lawyer {
  id: string
  name: string
  email: string
  phone: string
  specialization: string
  barCouncilId: string
  city: string
  state: string
  experience: number
  activeCases: number
  completedCases: number
  avgResolutionDays: number
  rating: number
  availability: LawyerAvailability
  photoUrl: string | null
}

// ---------------------------------------------------------------------------
// Customer (Reference)
// ---------------------------------------------------------------------------

export interface CustomerRef {
  id: string
  name: string
  phone: string
  email: string
  city: string
}

// ---------------------------------------------------------------------------
// Summary Stats
// ---------------------------------------------------------------------------

export interface CaseKpiStats {
  totalCases: number
  activeCases: number
  completedCases: number
  avgResolutionDays: number
  onHold: number
}

export interface CaseStatusCounts {
  all: number
  'in-progress': number
  drafting: number
  'under-review': number
  approved: number
  completed: number
  'on-hold': number
}

// =============================================================================
// Component Props
// =============================================================================

export interface CaseListProps {
  /** All cases */
  cases: Case[]
  /** KPI summary stats */
  kpiStats: CaseKpiStats
  /** Count badges for status filter tabs */
  statusCounts: CaseStatusCounts
  /** Called when user wants to view a case's details */
  onView?: (id: string) => void
  /** Called when user wants to edit a case */
  onEdit?: (id: string) => void
  /** Called when user wants to create a new case */
  onCreate?: () => void
}

export interface CaseDetailProps {
  /** The case to display */
  caseData: Case
  /** Follow-up timeline entries for this case */
  followUps: CaseFollowUp[]
  /** Internal notes for this case */
  notes: CaseNote[]
  /** Documents generated for this case */
  documents: CaseDocument[]
  /** Available lawyers for assignment */
  lawyers: Lawyer[]
  /** Called when user wants to edit the case */
  onEdit?: () => void
  /** Called when user wants to add a follow-up */
  onAddFollowUp?: () => void
  /** Called when user wants to add a note */
  onAddNote?: () => void
  /** Called when user wants to assign/reassign a lawyer */
  onAssignLawyer?: (lawyerId: string) => void
  /** Called when user wants to download a document */
  onDownloadDocument?: (docId: string) => void
  /** Called when user navigates back */
  onBack?: () => void
}

export interface AddCaseFormProps {
  /** Available customers to select from */
  customers: CustomerRef[]
  /** Available lawyers to assign */
  lawyers: Lawyer[]
  /** Called when the form is submitted */
  onSubmit?: (data: {
    customerId: string
    serviceType: string
    lawyerId: string
    description: string
    notes: string
  }) => void
  /** Called when the form is cancelled */
  onCancel?: () => void
}
