// =============================================================================
// Data Types
// =============================================================================

export type WMStatus = 'active' | 'inactive'

export type WMTier = 'platinum' | 'gold' | 'silver' | 'bronze'

export type WMGender = 'male' | 'female'

export type WMPermission = 'leads' | 'customers' | 'cases' | 'documents'

export type WMDashboardVisibility = 'kpis' | 'sales' | 'cases' | 'customers'

export type WMFollowUpType = 'update' | 'meeting'

export type WMAuthorRole = 'admin' | 'operations'

export type WalletTransactionType = 'package_purchase' | 'will_used'

export type TeamMemberStatus = 'active' | 'inactive'

export type WMPackageStatus = 'active' | 'expired' | 'exhausted'

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

export interface WMAddress {
  country: string
  state: string
  city: string
  area: string
  address: string
  pinCode: string
}

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

export interface WMCompany {
  name: string
  email: string
  gstNumber: string
  panNumber: string
  bankName: string
  accountNumber: string
  ifscCode: string
  branch: string
}

// ---------------------------------------------------------------------------
// Wealth Manager
// ---------------------------------------------------------------------------

export interface WealthManager {
  id: string
  name: string
  email: string
  phone: string
  gender: WMGender
  dob: string
  photoUrl: string | null
  address: WMAddress
  company: WMCompany
  tier: WMTier
  status: WMStatus
  willsRemaining: number
  willsUsed: number
  currentPackageTier: WMTier | null
  currentPackageExpiresAt: string | null
  totalSales: number
  totalCustomers: number
  totalLeads: number
  activeCases: number
  permissions: WMPermission[]
  dashboardVisibility: WMDashboardVisibility[]
  joinedAt: string
  lastActive: string
}

// ---------------------------------------------------------------------------
// WM Follow-Up
// ---------------------------------------------------------------------------

export interface WMFollowUp {
  id: string
  wmId: string
  title: string
  notes: string
  type: WMFollowUpType
  author: string
  authorRole: WMAuthorRole
  createdAt: string
}

// ---------------------------------------------------------------------------
// WM Package
// ---------------------------------------------------------------------------

export interface WMPackage {
  id: string
  wmId: string
  tier: WMTier
  willsIncluded: number
  willsUsed: number
  willsRemaining: number
  priceExclGst: number
  gstAmount: number
  totalPrice: number
  validityMonths: number
  purchasedAt: string
  expiresAt: string
  status: WMPackageStatus
}

// ---------------------------------------------------------------------------
// Wallet Transaction
// ---------------------------------------------------------------------------

export interface WMWalletTransaction {
  id: string
  wmId: string
  title: string
  customerName: string | null
  type: WalletTransactionType
  amount: number
  packageId: string | null
  willCredits: number | null
  remarks: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Team Member
// ---------------------------------------------------------------------------

export interface WMTeamMember {
  id: string
  wmId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  designation: string
  status: TeamMemberStatus
  joinedAt: string
}

// ---------------------------------------------------------------------------
// WM Customer
// ---------------------------------------------------------------------------

export interface WMCustomer {
  id: string
  wmId: string
  customerId: string
  customerName: string
  phone: string
  city: string
  serviceType: string
  totalCases: number
  activeCases: number
  salesValue: number
  convertedAt: string
}

// ---------------------------------------------------------------------------
// Summary Stats
// ---------------------------------------------------------------------------

export interface WMKpiStats {
  totalWealthManagers: number
  activeWealthManagers: number
  totalSales: number
  totalWillsRemaining: number
}

export interface WMStatusCounts {
  all: number
  active: number
  inactive: number
}

export interface WMTierCounts {
  platinum: number
  gold: number
  silver: number
  bronze: number
}

// =============================================================================
// Component Props
// =============================================================================

export interface WMListProps {
  /** All wealth managers */
  wealthManagers: WealthManager[]
  /** KPI summary stats */
  kpiStats: WMKpiStats
  /** Count badges for status filter tabs */
  statusCounts: WMStatusCounts
  /** Count badges for tier filters */
  tierCounts: WMTierCounts
  /** Called when user wants to view a WM's details */
  onView?: (id: string) => void
  /** Called when user wants to edit a WM's profile */
  onEdit?: (id: string) => void
  /** Called when user wants to toggle WM active/inactive */
  onToggleStatus?: (id: string) => void
  /** Called when user wants to view a WM's customers */
  onViewCustomers?: (id: string) => void
  /** Called when user wants to view a WM's packages */
  onViewPackages?: (id: string) => void
  /** Called when user wants to add a new WM */
  onCreate?: () => void
}

export interface WMDetailProps {
  /** The wealth manager to display */
  wealthManager: WealthManager
  /** Follow-up timeline entries for this WM */
  followUps: WMFollowUp[]
  /** Wallet transaction history */
  walletTransactions: WMWalletTransaction[]
  /** Team members under this WM */
  teamMembers: WMTeamMember[]
  /** Customers tagged under this WM */
  customers: WMCustomer[]
  /** Package purchase records */
  packages: WMPackage[]
  /** Called when user wants to edit the WM */
  onEdit?: () => void
  /** Called when user wants to toggle WM status */
  onToggleStatus?: () => void
  /** Called when user wants to add a follow-up */
  onAddFollowUp?: () => void
  /** Called when user wants to view a customer's details */
  onViewCustomer?: (customerId: string) => void
  /** Called when user wants to add a team member */
  onAddTeamMember?: () => void
  /** Called when user navigates back */
  onBack?: () => void
}

export interface AddWMFormProps {
  /** Called when the form is submitted */
  onSubmit?: (data: {
    name: string
    email: string
    phone: string
    gender: WMGender
    dob: string
    address: WMAddress
    company: WMCompany
    tier: WMTier
    permissions: WMPermission[]
    dashboardVisibility: WMDashboardVisibility[]
  }) => void
  /** Called when the form is cancelled */
  onCancel?: () => void
  /** Optional existing partner for edit mode */
  initialData?: WealthManager
  /** Form mode (defaults to 'create') */
  mode?: 'create' | 'edit'
}
