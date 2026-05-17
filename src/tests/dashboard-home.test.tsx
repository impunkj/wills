import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { DashboardHomePage } from '@/pages/DashboardHomePage'
import type {
  ActivityFeedItem,
  CaseStatusEntry,
  ConversionFunnelStage,
  KpiStats,
  MonthlyRevenueEntry,
  PendingItem,
  QuickAction,
  SalesTrendPoint,
} from '@/features/dashboard-home/types'

vi.mock('@/lib/use-initial-loading', () => ({
  useInitialLoading: () => false,
}))

const { getSummary, getActivityFeed, getPendingItems } = vi.hoisted(() => ({
  getSummary: vi.fn(),
  getActivityFeed: vi.fn(),
  getPendingItems: vi.fn(),
}))

vi.mock('@/services/dashboard.service', async () => {
  const actual = await vi.importActual<typeof import('@/services/dashboard.service')>(
    '@/services/dashboard.service',
  )
  return {
    ...actual,
    getSummary,
    getActivityFeed,
    getPendingItems,
  }
})

const baseKpis: KpiStats = {
  totalSales: 12450000,
  revenueThisMonth: 1875000,
  revenuePreviousMonth: 1620000,
  activeCases: 24,
  completedCases: 57,
  avgResolutionDays: 18,
  newLeads: 34,
  newLeadsPreviousMonth: 28,
  totalCustomers: 81,
  activePartners: 5,
  totalPartners: 6,
  willsRemaining: 131,
  activeTeamMembers: 12,
  totalTeamMembers: 14,
  tasksAssigned: 38,
  slaBreaches: 3,
  overdueFollowUps: 5,
  conversionRate: 68,
}

const salesTrend: SalesTrendPoint[] = [
  { month: 'Nov 2025', value: 1250000 },
  { month: 'Dec 2025', value: 980000 },
]

const caseStatusDistribution: CaseStatusEntry[] = [
  { status: 'In Progress', count: 12, color: 'blue' },
  { status: 'Completed', count: 57, color: 'emerald' },
]

const monthlyRevenue: MonthlyRevenueEntry[] = [
  { month: 'Nov 2025', revenue: 1250000, target: 1400000 },
]

const conversionFunnel: ConversionFunnelStage[] = [
  { stage: 'Total Leads', count: 210 },
  { stage: 'Converted', count: 81 },
]

const quickActions: QuickAction[] = [
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

const activityFeed: ActivityFeedItem[] = [
  {
    id: 'ACT-001',
    actor: 'Anurag Bhatia',
    actorRole: 'admin',
    action: 'created a new lead',
    entityType: 'lead',
    entityName: 'Sudhir Menon',
    entityId: 'W24-LEAD-00089',
    timestamp: '2026-04-17T10:45:00Z',
  },
]

const pendingItems: PendingItem[] = [
  {
    id: 'PEND-001',
    type: 'sla-breach',
    severity: 'critical',
    title: 'Critical issue',
    description: 'Resolve immediately',
    entityType: 'case',
    entityId: 'W24-CASE-00003',
    dueDate: '2026-04-13T00:00:00Z',
    createdAt: '2026-04-17T06:00:00Z',
  },
  {
    id: 'PEND-002',
    type: 'pending-approval',
    severity: 'medium',
    title: 'Medium issue',
    description: 'Review soon',
    entityType: 'case',
    entityId: 'W24-CASE-00004',
    dueDate: '2026-04-14T00:00:00Z',
    createdAt: '2026-04-17T06:00:00Z',
  },
]

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard-home']}>
      <Routes>
        <Route path="/dashboard-home" element={<DashboardHomePage />} />
        <Route path="/sales-crm/new" element={<LocationProbe />} />
        <Route path="/case-management/new" element={<LocationProbe />} />
        <Route path="/partners/new" element={<LocationProbe />} />
        <Route path="/customers/new" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Dashboard Home page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSummary.mockResolvedValue({
      kpiStats: baseKpis,
      salesTrend,
      caseStatusDistribution,
      monthlyRevenue,
      conversionFunnel,
      quickActions,
      user: { name: 'Anurag Bhatia', role: 'Admin' },
    })
    getActivityFeed.mockResolvedValue(activityFeed)
    getPendingItems.mockResolvedValue(pendingItems)
  })

  afterEach(() => {
    cleanup()
  })

  it('renders with real service data', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: /good .*anurag/i })).toBeInTheDocument()
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    expect(screen.getByText('Pending Items')).toBeInTheDocument()
    expect(screen.getByText('Critical issue')).toBeInTheDocument()
    expect(screen.getByText('Add Lead')).toBeInTheDocument()
  })

  it('refetches summary when the period preset changes', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findAllByText('Recent Activity')
    await user.click(screen.getByRole('button', { name: 'Today' }))

    await waitFor(() => {
      expect(getSummary).toHaveBeenLastCalledWith('today')
    })
  })

  it('renders empty states for empty activity, pending items, and charts', async () => {
    getSummary.mockResolvedValue({
      kpiStats: baseKpis,
      salesTrend: [],
      caseStatusDistribution: [],
      monthlyRevenue: [],
      conversionFunnel: [],
      quickActions,
      user: { name: 'Anurag Bhatia', role: 'Admin' },
    })
    getActivityFeed.mockResolvedValue([])
    getPendingItems.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('No recent activity yet.')).toBeInTheDocument()
    expect(screen.getByText('No pending items right now.')).toBeInTheDocument()
    expect(screen.getByText('No sales trend data for the selected period.')).toBeInTheDocument()
    expect(screen.getByText('No case status data for the selected period.')).toBeInTheDocument()
    expect(screen.getByText('No conversion data for the selected period.')).toBeInTheDocument()
  })

  it('routes quick actions to the expected create flows', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findAllByText('Quick Actions')
    const newLeadButton = screen
      .getAllByRole('button')
      .find((button) => button.textContent?.trim() === 'New Lead')

    expect(newLeadButton).toBeDefined()
    await user.click(newLeadButton!)

    expect(await screen.findByTestId('location')).toHaveTextContent('/sales-crm/new')
  })

  it('orders pending items by severity', async () => {
    getPendingItems.mockResolvedValue([pendingItems[1], pendingItems[0]])

    renderPage()

    await screen.findAllByText('Pending Items')
    const pendingButtons = screen
      .getAllByRole('button')
      .filter((button) => button.textContent?.includes('issue'))

    expect(pendingButtons[0]).toHaveTextContent('Critical issue')
    expect(pendingButtons[1]).toHaveTextContent('Medium issue')
  })
})
