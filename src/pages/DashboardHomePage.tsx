import { DashboardHome } from '@/features/dashboard-home'
import type { ActivityFeedItem, KpiStats, PendingItem } from '@/features/dashboard-home/types'
import { toast } from '@/components/ui/toaster'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buildDashboardProps,
  getActivityFeed,
  getPendingItems,
  getSummary,
  type DashboardPeriod,
  type DashboardSummaryResponse,
} from '@/services/dashboard.service'

const QUICK_ACTION_ROUTES: Record<string, string> = {
  'qa-1': '/sales-crm?action=new-lead',
  'qa-2': '/case-management?action=create-case',
  'qa-3': '/sales-crm?action=create-quotation',
  'qa-4': '/case-management?action=assign-lawyer',
  'qa-5': '/partners?action=add-partner',
  'qa-6': '/sales-crm/new',
  'qa-7': '/case-management/new',
  'qa-8': '/partners/new',
  'qa-9': '/customers/new',
}

const ENTITY_ROUTES: Record<string, string> = {
  lead: '/sales-crm',
  case: '/case-management',
  payment: '/accounts',
  customer: '/customers',
  document: '/case-management',
  invoice: '/accounts',
  wallet: '/partners',
  package: '/partners',
  followup: '/sales-crm',
  refund: '/accounts',
  partner: '/partners',
}

const PRESET_TO_PERIOD: Record<string, DashboardPeriod> = {
  Today: 'today',
  'This Week': 'this_week',
  'This Month': 'this_month',
  'This Quarter': 'this_quarter',
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

const EMPTY_SUMMARY: DashboardSummaryResponse = {
  kpiStats: EMPTY_KPI_STATS,
  salesTrend: [],
  caseStatusDistribution: [],
  monthlyRevenue: [],
  conversionFunnel: [],
  quickActions: [],
  user: { name: 'Wills24 Admin', role: 'Admin' },
}

export function DashboardHomePage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<DashboardPeriod>('this_month')
  const [summary, setSummary] = useState<DashboardSummaryResponse>(EMPTY_SUMMARY)
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([])
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])

  useEffect(() => {
    let active = true

    async function loadSummary() {
      const nextSummary = await getSummary(period)
      if (active) {
        setSummary(nextSummary)
      }
    }

    void loadSummary()

    return () => {
      active = false
    }
  }, [period])

  useEffect(() => {
    let active = true

    async function loadSupplementalData() {
      const [nextActivityFeed, nextPendingItems] = await Promise.all([
        getActivityFeed(),
        getPendingItems(),
      ])

      if (!active) {
        return
      }

      setActivityFeed(nextActivityFeed)
      setPendingItems(nextPendingItems)
    }

    void loadSupplementalData()

    const handleFocus = () => {
      void loadSupplementalData()
    }

    window.addEventListener('focus', handleFocus)
    const intervalId = window.setInterval(() => {
      void loadSupplementalData()
    }, 60000)

    return () => {
      active = false
      window.removeEventListener('focus', handleFocus)
      window.clearInterval(intervalId)
    }
  }, [])

  const data = useMemo(
    () => buildDashboardProps(summary, activityFeed, pendingItems),
    [summary, activityFeed, pendingItems],
  )

  return (
    <DashboardHome
      {...data}
      onDateRangeChange={(range) => {
        const nextPeriod = PRESET_TO_PERIOD[range.preset ?? 'This Month'] ?? 'this_month'
        setPeriod(nextPeriod)
      }}
      onQuickAction={(actionId) => {
        const href = QUICK_ACTION_ROUTES[actionId] ?? '/dashboard-home'
        navigate(href)
      }}
      onActivityClick={(entityType, entityId) => {
        toast.info(`Opening ${entityType}`, entityId)
        navigate(ENTITY_ROUTES[entityType] ?? '/dashboard-home')
      }}
      onPendingItemClick={(itemId) => {
        toast.info('Pending item selected', itemId)
        navigate('/case-management?action=triage-pending')
      }}
    />
  )
}
