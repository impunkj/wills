import { readSession } from '@/auth'
import type {
  ActivityFeedItem,
  CaseStatusEntry,
  ConversionFunnelStage,
  DashboardHomeProps,
  DashboardUser,
  KpiStats,
  MonthlyRevenueEntry,
  PendingItem,
  QuickAction,
  SalesTrendPoint,
} from '@/features/dashboard-home/types'
import { api } from '@/lib/api'

export type DashboardPeriod = 'today' | 'this_week' | 'this_month' | 'this_quarter'

export interface DashboardSummaryResponse {
  kpiStats: KpiStats
  salesTrend: SalesTrendPoint[]
  caseStatusDistribution: CaseStatusEntry[]
  monthlyRevenue: MonthlyRevenueEntry[]
  conversionFunnel: ConversionFunnelStage[]
  quickActions: QuickAction[]
  user: DashboardUser
}

const EMPTY_KPI_STATS: KpiStats = {
  totalSales: 0,
  revenueThisMonth: 0,
  revenuePreviousMonth: 0,
  activeCases: 0,
  completedCases: 0,
  avgResolutionDays: 0,
  newLeads: 0,
  newLeadsPreviousMonth: 0,
  totalCustomers: 0,
  activePartners: 0,
  totalPartners: 0,
  willsRemaining: 0,
  activeTeamMembers: 0,
  totalTeamMembers: 0,
  tasksAssigned: 0,
  slaBreaches: 0,
  overdueFollowUps: 0,
  conversionRate: 0,
}

const REQUIRED_QUICK_ACTIONS: QuickAction[] = [
  { id: 'qa-1', label: 'Add Lead', icon: 'user-plus', module: 'sales-crm' },
  { id: 'qa-2', label: 'Create Case', icon: 'briefcase', module: 'case-management' },
  { id: 'qa-3', label: 'Create Quotation', icon: 'file-text', module: 'sales-crm' },
  { id: 'qa-4', label: 'Assign Lawyer', icon: 'scale', module: 'case-management' },
  { id: 'qa-5', label: 'Add Partner', icon: 'handshake', module: 'partners' },
  { id: 'qa-6', label: 'New Lead', icon: 'user-plus', module: 'sales-crm' },
  { id: 'qa-7', label: 'New Case', icon: 'briefcase', module: 'case-management' },
  { id: 'qa-8', label: 'New Partner', icon: 'handshake', module: 'partners' },
  { id: 'qa-9', label: 'New Customer', icon: 'users', module: 'customers' },
]

function fallbackUser(): DashboardUser {
  const session = readSession()
  return {
    name: session?.name ?? 'Wills24 Admin',
    role: session?.role ?? 'Admin',
  }
}

function ensureQuickActions(actions: QuickAction[] = []): QuickAction[] {
  const seen = new Set<string>()
  return [...actions, ...REQUIRED_QUICK_ACTIONS].filter((action) => {
    if (seen.has(action.id)) {
      return false
    }
    seen.add(action.id)
    return true
  })
}

function emptySummary(): DashboardSummaryResponse {
  return {
    kpiStats: EMPTY_KPI_STATS,
    salesTrend: [],
    caseStatusDistribution: [],
    monthlyRevenue: [],
    conversionFunnel: [],
    quickActions: REQUIRED_QUICK_ACTIONS,
    user: fallbackUser(),
  }
}

function normalizeSummary(data?: Partial<DashboardSummaryResponse>): DashboardSummaryResponse {
  const fallback = emptySummary()
  return {
    kpiStats: data?.kpiStats ?? fallback.kpiStats,
    salesTrend: data?.salesTrend ?? fallback.salesTrend,
    caseStatusDistribution: data?.caseStatusDistribution ?? fallback.caseStatusDistribution,
    monthlyRevenue: data?.monthlyRevenue ?? fallback.monthlyRevenue,
    conversionFunnel: data?.conversionFunnel ?? fallback.conversionFunnel,
    quickActions: ensureQuickActions(data?.quickActions),
    user: data?.user ?? fallback.user,
  }
}

export async function getSummary(period: DashboardPeriod): Promise<DashboardSummaryResponse> {
  try {
    const { data } = await api.get<DashboardSummaryResponse>('/dashboard/summary', {
      params: { period },
    })
    return normalizeSummary(data)
  } catch {
    return emptySummary()
  }
}

export async function getActivityFeed(): Promise<ActivityFeedItem[]> {
  try {
    const { data } = await api.get<ActivityFeedItem[]>('/dashboard/activity-feed')
    return data
  } catch {
    return []
  }
}

export async function getPendingItems(): Promise<PendingItem[]> {
  try {
    const { data } = await api.get<PendingItem[]>('/dashboard/pending-items')
    return data
  } catch {
    return []
  }
}

export function buildDashboardProps(
  summary: DashboardSummaryResponse,
  activityFeed: ActivityFeedItem[],
  pendingItems: PendingItem[],
): DashboardHomeProps {
  return {
    ...summary,
    activityFeed,
    pendingItems,
  }
}
