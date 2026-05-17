import { Inject, Injectable } from '@nestjs/common'
import { PRISMA_SERVICE } from '../sales-crm/services/sales-crm.service'

type TeamRole = 'ADMIN' | 'WEALTH_MANAGER' | 'LAWYER' | 'SUPPORT'
type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'

type CaseRow = {
  id: string
  title: string | null
  status: CaseStatus
  createdAt: Date
}

type LeadRow = {
  id: string
  name: string
  status: string
  createdAt: Date
}

type PartnerRow = {
  isActive: boolean
}

type TeamMemberRow = {
  id: string
  role: TeamRole
  isActive: boolean
  deletedAt: Date | null
}

type UserRow = {
  name: string
  role: TeamRole
}

type PrismaCaseClient = {
  count(args?: Record<string, unknown>): Promise<number>
  findMany(args?: Record<string, unknown>): Promise<CaseRow[]>
}

type PrismaLeadClient = {
  count(args?: Record<string, unknown>): Promise<number>
  findMany(args?: Record<string, unknown>): Promise<LeadRow[]>
}

type PrismaPartnerClient = {
  count(args?: Record<string, unknown>): Promise<number>
  findMany(args?: Record<string, unknown>): Promise<PartnerRow[]>
}

type PrismaTeamMemberClient = {
  findMany(args?: Record<string, unknown>): Promise<TeamMemberRow[]>
}

type PrismaCustomerClient = {
  count(args?: Record<string, unknown>): Promise<number>
}

type PrismaUserClient = {
  findFirst(args?: Record<string, unknown>): Promise<UserRow | null>
}

interface DashboardPrismaServiceLike {
  case: PrismaCaseClient
  lead: PrismaLeadClient
  partner: PrismaPartnerClient
  teamMember: PrismaTeamMemberClient
  customer: PrismaCustomerClient
  user: PrismaUserClient
}

@Injectable()
export class DashboardService {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: DashboardPrismaServiceLike,
  ) {}

  async getSummary(period = 'this_month') {
    const now = new Date()
    const from = new Date()
    if (period === 'today') from.setHours(0, 0, 0, 0)
    else if (period === 'this_week') from.setDate(now.getDate() - 7)
    else if (period === 'this_month') from.setDate(now.getDate() - 30)
    else if (period === 'this_quarter') from.setDate(now.getDate() - 90)

    const [activeCases, completedCases, newLeads, activePartners, totalPartners, allTeam, totalCustomers, user] =
      await Promise.all([
        this.prisma.case.count({ where: { status: { not: 'COMPLETED' } } }),
        this.prisma.case.count({ where: { status: 'COMPLETED' } }),
        this.prisma.lead.count({ where: { createdAt: { gte: from } } }),
        this.prisma.partner.count({ where: { isActive: true } }),
        this.prisma.partner.count(),
        this.prisma.teamMember.findMany({ where: { deletedAt: null } }),
        this.prisma.customer.count(),
        this.prisma.user.findFirst({ orderBy: { createdAt: 'asc' } }),
      ])

    const salesTrend = await this.getSalesTrend()
    const caseStatusDistribution = await this.getCaseStatusBreakdown()

    return {
      kpiStats: {
        totalSales: 0,
        revenueThisMonth: 0,
        revenuePreviousMonth: 0,
        activeCases,
        completedCases,
        avgResolutionDays: 18,
        newLeads,
        newLeadsPreviousMonth: 0,
        totalCustomers,
        activePartners,
        totalPartners,
        willsRemaining: activeCases,
        activeTeamMembers: allTeam.filter((member) => member.isActive).length,
        totalTeamMembers: allTeam.length,
        tasksAssigned: 0,
        slaBreaches: 0,
        overdueFollowUps: 0,
        conversionRate: 0,
      },
      salesTrend,
      caseStatusDistribution,
      monthlyRevenue: salesTrend.map((entry) => ({
        month: entry.month,
        revenue: entry.value,
        target: entry.value,
      })),
      conversionFunnel: [
        { stage: 'New Leads', count: newLeads },
        { stage: 'Active Cases', count: activeCases },
        { stage: 'Completed Cases', count: completedCases },
      ],
      quickActions: [
        { id: 'qa-1', label: 'Add Lead', icon: 'user-plus', module: 'sales-crm' },
        { id: 'qa-2', label: 'Create Case', icon: 'briefcase', module: 'case-management' },
        { id: 'qa-3', label: 'Create Quotation', icon: 'file-text', module: 'sales-crm' },
        { id: 'qa-4', label: 'Assign Lawyer', icon: 'scale', module: 'case-management' },
        { id: 'qa-5', label: 'Add Partner', icon: 'handshake', module: 'partners' },
        { id: 'qa-6', label: 'New Lead', icon: 'user-plus', module: 'sales-crm' },
        { id: 'qa-7', label: 'New Case', icon: 'briefcase', module: 'case-management' },
        { id: 'qa-8', label: 'New Partner', icon: 'handshake', module: 'partners' },
        { id: 'qa-9', label: 'New Customer', icon: 'users', module: 'customers' },
      ],
      user: {
        name: user?.name ?? 'Wills24 Admin',
        role: user?.role ?? 'ADMIN',
      },
    }
  }

  async getActivityFeed() {
    const [cases, leads] = await Promise.all([
      this.prisma.case.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, status: true, createdAt: true },
      }),
      this.prisma.lead.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, status: true, createdAt: true },
      }),
    ])

    return [
      ...cases.map((item) => ({
        id: item.id,
        actor: 'System',
        actorRole: 'system',
        action: `Case ${item.status.toLowerCase().replaceAll('_', ' ')}`,
        entityType: 'case',
        entityName: item.title ?? `Case ${item.id}`,
        entityId: item.id,
        timestamp: item.createdAt.toISOString(),
      })),
      ...leads.map((item) => ({
        id: item.id,
        actor: 'System',
        actorRole: 'system',
        action: `Lead ${item.status.toLowerCase().replaceAll('_', ' ')}`,
        entityType: 'lead',
        entityName: item.name,
        entityId: item.id,
        timestamp: item.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
  }

  async getPendingItems() {
    const now = new Date()
    const cases = await this.prisma.case.findMany({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      select: { id: true, title: true, status: true, createdAt: true },
    })

    return cases
      .map((item) => {
        const ageDays = Math.floor(
          (now.getTime() - new Date(item.createdAt).getTime()) / 86400000,
        )

        return {
          id: item.id,
          type: 'upcoming-deadline',
          severity: ageDays > 14 ? 'high' : ageDays > 7 ? 'medium' : 'low',
          title: item.title ?? `Case ${item.id}`,
          description: `${item.status.replaceAll('_', ' ')} for ${ageDays} day(s)`,
          entityType: 'case',
          entityId: item.id,
          dueDate: item.createdAt.toISOString(),
          createdAt: item.createdAt.toISOString(),
        }
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  }

  async getSalesTrend() {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      months.push({
        month: date.toLocaleString('default', { month: 'short' }),
        value: 0,
      })
    }
    return months
  }

  async getCaseStatusBreakdown() {
    const statuses: CaseStatus[] = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']
    const colors: Record<CaseStatus, string> = {
      OPEN: '#2563eb',
      IN_PROGRESS: '#f59e0b',
      ON_HOLD: '#6b7280',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
    }
    const counts = await Promise.all(
      statuses.map((status) => this.prisma.case.count({ where: { status } })),
    )
    return statuses.map((status, index) => ({
      status,
      count: counts[index],
      color: colors[status],
    }))
  }
}
