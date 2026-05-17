// =============================================================================
// Data Types
// =============================================================================

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'sales' | 'operations' | 'legal' | 'accounts' | 'hr'
  department: string
  status: 'active' | 'inactive'
  lastLogin: string
  createdAt: string
}

export interface LawyerDocument {
  type: 'Bar Council Certificate' | 'ID Proof' | 'Qualification Certificate'
  status: 'uploaded' | 'pending'
  fileName: string | null
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
  availability: 'available' | 'on-leave' | 'overloaded'
  activeCases: number
  totalCasesHandled: number
  successRate: number
  avgResolutionDays: number
  rating: number
  documents: LawyerDocument[]
}

export interface KycDocument {
  type: 'Aadhaar' | 'PAN' | 'Driving License' | 'Cancelled Cheque'
  status: 'uploaded' | 'pending'
  fileName: string | null
}

export interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  mobile: string
  gender: 'male' | 'female' | 'other'
  dob: string
  department: string
  designation: string
  dateOfJoining: string
  reportingManager: string | null
  status: 'active' | 'inactive'
  currentAddress: string
  permanentAddress: string
  kycDocuments: KycDocument[]
  bankName: string
  accountNumber: string
  ifscCode: string
}

export type PermissionLevel = 'full' | 'read' | 'none'

export interface RolePermission {
  module: string
  admin: PermissionLevel
  sales: PermissionLevel
  operations: PermissionLevel
  legal: PermissionLevel
  accounts: PermissionLevel
  hr: PermissionLevel
}

// =============================================================================
// Component Props
// =============================================================================

export interface TeamManagementProps {
  /** Internal users with role and access info */
  users: User[]
  /** Lawyer directory with case tracking and performance */
  lawyers: Lawyer[]
  /** Employee records with HRMS details */
  employees: Employee[]
  /** Role-to-module permission matrix (read-only reference) */
  rolePermissions: RolePermission[]
  /** Called when user wants to add a new internal user */
  onAddUser?: () => void
  /** Called when user wants to edit an internal user */
  onEditUser?: (id: string) => void
  /** Called when user wants to deactivate/reactivate a user */
  onToggleUserStatus?: (id: string) => void
  /** Called when user wants to add a new lawyer */
  onAddLawyer?: () => void
  /** Called when user wants to edit a lawyer */
  onEditLawyer?: (id: string) => void
  /** Called when user wants to update a lawyer's availability */
  onUpdateLawyerAvailability?: (id: string, status: Lawyer['availability']) => void
  /** Called when user wants to view a lawyer's detail panel */
  onViewLawyer?: (id: string) => void
  /** Called when user wants to add a new employee */
  onAddEmployee?: () => void
  /** Called when user wants to edit an employee */
  onEditEmployee?: (id: string) => void
  /** Called when user wants to deactivate/reactivate an employee */
  onToggleEmployeeStatus?: (id: string) => void
  /** Called when user wants to view an employee's full detail */
  onViewEmployee?: (id: string) => void
}
