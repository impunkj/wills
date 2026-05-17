// =============================================================================
// Data Types
// =============================================================================

export interface KpiStats {
  totalSales: number
  revenueThisMonth: number
  revenuePreviousMonth: number
  activeCases: number
  completedCases: number
  avgResolutionDays: number
  newLeads: number
  newLeadsPreviousMonth: number
  totalCustomers: number
  activePartners: number
  totalPartners: number
  willsRemaining: number
  activeTeamMembers: number
  totalTeamMembers: number
  tasksAssigned: number
  slaBreaches: number
  overdueFollowUps: number
  conversionRate: number
}

export interface ActivityFeedItem {
  id: string
  actor: string
  actorRole: 'admin' | 'operations' | 'system' | 'partner' | 'lawyer'
  action: string
  entityType: 'lead' | 'case' | 'payment' | 'customer' | 'document' | 'invoice' | 'wallet' | 'package' | 'followup'
  entityName: string
  entityId: string
  timestamp: string
}

export interface PendingItem {
  id: string
  type: 'sla-breach' | 'overdue-followup' | 'expiring-package' | 'upcoming-deadline' | 'pending-approval'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  entityType: string
  entityId: string
  dueDate: string
  createdAt: string
}

export interface SalesTrendPoint {
  month: string
  value: number
}

export interface CaseStatusEntry {
  status: string
  count: number
  color: string
}

export interface MonthlyRevenueEntry {
  month: string
  revenue: number
  target: number
}

export interface ConversionFunnelStage {
  stage: string
  count: number
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  module: string
}

export interface DashboardUser {
  name: string
  role: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface DashboardHomeProps {
  /** Aggregated KPI metrics for the current or selected period */
  kpiStats: KpiStats
  /** Recent actions taken across the platform shown as a timeline */
  activityFeed: ActivityFeedItem[]
  /** Urgent items and SLA alerts requiring admin attention */
  pendingItems: PendingItem[]
  /** Monthly sales revenue data points for the trend line chart */
  salesTrend: SalesTrendPoint[]
  /** Breakdown of cases by current status for the donut/pie chart */
  caseStatusDistribution: CaseStatusEntry[]
  /** Monthly revenue totals with targets for the bar chart */
  monthlyRevenue: MonthlyRevenueEntry[]
  /** Lead-to-customer conversion funnel stages */
  conversionFunnel: ConversionFunnelStage[]
  /** Shortcut buttons for frequently used admin actions */
  quickActions: QuickAction[]
  /** Current logged-in user info for the greeting header */
  user: DashboardUser
  /** Called when the date range is changed */
  onDateRangeChange?: (range: { start: string; end: string; preset?: string }) => void
  /** Called when user clicks a quick action button */
  onQuickAction?: (actionId: string) => void
  /** Called when user clicks on an activity feed item */
  onActivityClick?: (entityType: string, entityId: string) => void
  /** Called when user clicks on a pending item to resolve or view it */
  onPendingItemClick?: (itemId: string) => void
}
