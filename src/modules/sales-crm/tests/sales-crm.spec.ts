import 'reflect-metadata'
import { ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SalesCrmController } from '../controllers/sales-crm.controller'
import { RolesGuard } from '../guards/roles.guard'
import {
  type PrismaServiceLike,
  SalesCrmService,
} from '../services/sales-crm.service'
import { SequenceService } from '../services/sequence.service'

describe('SalesCrmService', () => {
  let prisma: PrismaServiceLike
  let service: SalesCrmService
  let controller: SalesCrmController
  let guard: RolesGuard

  let leadRows: Array<Record<string, unknown>>
  let quotationRows: Array<Record<string, unknown>>
  let followUpRows: Array<Record<string, unknown>>
  let serviceRows: Array<Record<string, unknown>>
  let accountEntries: Array<Record<string, unknown>>

  beforeEach(() => {
    leadRows = [
      {
        id: 'W24-LEAD-00001',
        status: 'new',
        assignedAgentId: null,
        source: 'Website',
        metadata: { taxContext: { sellerState: 'Delhi', customerState: 'Delhi' } },
        name: 'Rajesh Kumar',
        phone: '+919876543210',
        email: 'rajesh@example.com',
        address: 'Sector 62',
        city: 'Noida',
        state: 'Delhi',
        pinCode: '201301',
        company: 'Kumar Enterprises',
        designation: 'Managing Director',
        serviceInterest: 'Will Drafting',
        wealthManagerId: 'WM-001',
        wealthManagerName: 'Vikram Mehta',
        assignedEmployee: 'Priya Sharma',
        leadType: 'HNI',
        notes: 'Needs fast turnaround',
        lastActivity: new Date('2026-04-15T10:30:00.000Z'),
        deletedAt: null,
        customerId: 'W24-CUST-00001',
        caseId: 'W24-CASE-00001',
        createdAt: new Date('2026-04-15T09:00:00.000Z'),
        updatedAt: new Date('2026-04-15T10:30:00.000Z'),
      },
      {
        id: 'W24-LEAD-00002',
        status: 'quotation-sent',
        assignedAgentId: null,
        source: 'Referral',
        metadata: { taxContext: { sellerState: 'Delhi', customerState: 'Maharashtra' } },
        name: 'Anita Desai',
        phone: '+919988765432',
        email: 'anita@example.com',
        address: 'Bandra',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400050',
        company: '',
        designation: '',
        serviceInterest: 'Trust Registration',
        wealthManagerId: 'WM-002',
        wealthManagerName: 'Sonal Kapoor',
        assignedEmployee: 'Amit Verma',
        leadType: 'Individual',
        notes: '',
        lastActivity: new Date('2026-04-14T15:45:00.000Z'),
        deletedAt: null,
        customerId: 'W24-CUST-00002',
        caseId: 'W24-CASE-00002',
        createdAt: new Date('2026-04-10T11:20:00.000Z'),
        updatedAt: new Date('2026-04-14T15:45:00.000Z'),
      },
    ]

    quotationRows = [
      {
        id: 'W24-QT-00001',
        leadId: 'W24-LEAD-00002',
        referenceNumber: 'W24-QT-2026-0001',
        items: [],
        subtotal: 10000,
        taxRate: 18,
        taxAmount: 1800,
        total: 11800,
        grossAmount: 10000,
        cgst: 900,
        sgst: 900,
        netAmount: 11800,
        status: 'draft',
        sentVia: null,
        sentAt: null,
        approvedBy: null,
        approvedAt: null,
        createdAt: new Date('2026-04-15T09:30:00.000Z'),
        updatedAt: new Date('2026-04-15T09:30:00.000Z'),
      },
    ]

    followUpRows = []
    serviceRows = [
      {
        id: 'SVC-001',
        category: 'Wills',
        name: 'Will Drafting (Basic)',
        description: 'Basic service',
        basePrice: 15000,
        taxRate: 18,
        estimatedTAT: '5 days',
        documentChecklist: ['Identity proof'],
        isActive: true,
        createdAt: new Date('2026-01-15T10:00:00.000Z'),
        updatedAt: new Date('2026-01-15T10:00:00.000Z'),
      },
    ]
    accountEntries = []

    const leadClient = {
      findMany: vi.fn(async (args?: Record<string, unknown>) => {
        const where = (args?.where ?? {}) as Record<string, unknown>
        return leadRows.filter((lead) => {
          if (where.deletedAt === null && lead.deletedAt !== null) {
            return false
          }
          if (where.status && lead.status !== where.status) {
            return false
          }
          return true
        }) as never
      }),
      findUnique: vi.fn(async ({ where }: Record<string, unknown>) => {
        const id = (where as { id: string }).id
        return (leadRows.find((lead) => lead.id === id) as never) ?? null
      }),
      create: vi.fn(async ({ data }: Record<string, unknown>) => {
        const now = new Date()
        const row = {
          ...(data as Record<string, unknown>),
          createdAt: now,
          updatedAt: now,
        }
        leadRows.push(row)
        return row as never
      }),
      update: vi.fn(async ({ where, data }: Record<string, unknown>) => {
        const row = leadRows.find((lead) => lead.id === (where as { id: string }).id)
        if (!row) {
          throw new Error('Lead not found')
        }
        Object.assign(row, data, { updatedAt: new Date() })
        return row as never
      }),
    }

    const quotationClient = {
      findMany: vi.fn(async (args?: Record<string, unknown>) => {
        const where = (args?.where ?? {}) as Record<string, unknown>
        return quotationRows.filter((quotation) => {
          if (where.leadId && quotation.leadId !== where.leadId) {
            return false
          }
          return true
        }) as never
      }),
      findUnique: vi.fn(async ({ where, include }: Record<string, unknown>) => {
        const row = quotationRows.find((quotation) => quotation.id === (where as { id: string }).id)
        if (!row) {
          return null
        }
        if ((include as Record<string, unknown> | undefined)?.lead) {
          return {
            ...row,
            lead: leadRows.find((lead) => lead.id === row.leadId) ?? null,
          } as never
        }
        return row as never
      }),
      create: vi.fn(async ({ data }: Record<string, unknown>) => {
        const now = new Date()
        const row = {
          ...(data as Record<string, unknown>),
          createdAt: now,
          updatedAt: now,
        }
        quotationRows.push(row)
        return row as never
      }),
      update: vi.fn(async ({ where, data }: Record<string, unknown>) => {
        const row = quotationRows.find(
          (quotation) => quotation.id === (where as { id: string }).id,
        )
        if (!row) {
          throw new Error('Quotation not found')
        }
        Object.assign(row, data, { updatedAt: new Date() })
        return row as never
      }),
    }

    const followUpClient = {
      findMany: vi.fn(async (args?: Record<string, unknown>) => {
        const where = (args?.where ?? {}) as Record<string, unknown>
        return followUpRows.filter((followUp) => {
          if (where.leadId && followUp.leadId !== where.leadId) {
            return false
          }
          return true
        }) as never
      }),
      create: vi.fn(async ({ data }: Record<string, unknown>) => {
        const row = {
          ...(data as Record<string, unknown>),
        }
        followUpRows.push(row)
        return row as never
      }),
    }

    const serviceCatalogClient = {
      findMany: vi.fn(async () => serviceRows as never),
      create: vi.fn(async ({ data }: Record<string, unknown>) => {
        const now = new Date()
        const row = {
          ...(data as Record<string, unknown>),
          createdAt: now,
          updatedAt: now,
        }
        serviceRows.push(row)
        return row as never
      }),
      update: vi.fn(async ({ where, data }: Record<string, unknown>) => {
        const row = serviceRows.find((service) => service.id === (where as { id: string }).id)
        if (!row) {
          throw new Error('Service not found')
        }
        Object.assign(row, data, { updatedAt: new Date() })
        return row as never
      }),
    }

    const customerClient = {
      create: vi.fn(async ({ data }: Record<string, unknown>) => data),
    }

    const caseClient = {
      create: vi.fn(async ({ data }: Record<string, unknown>) => data),
    }

    const accountEntryClient = {
      create: vi.fn(async ({ data }: Record<string, unknown>) => {
        const now = new Date()
        const row = {
          ...(data as Record<string, unknown>),
          createdAt: now,
          updatedAt: now,
        }
        accountEntries.push(row)
        return row
      }),
    }

    prisma = {
      lead: leadClient,
      quotation: quotationClient,
      followUp: followUpClient,
      serviceCatalog: serviceCatalogClient,
      customer: customerClient,
      case: caseClient,
      accountEntry: accountEntryClient,
      $transaction: vi.fn(async (callback) =>
        callback({
          lead: leadClient,
          quotation: quotationClient,
          followUp: followUpClient,
          serviceCatalog: serviceCatalogClient,
          customer: customerClient,
          case: caseClient,
          accountEntry: accountEntryClient,
        }),
      ),
    } as PrismaServiceLike

    const sequenceService = new SequenceService()
    sequenceService.initializeCounter('customer', 2)
    sequenceService.initializeCounter('case', 2)

    service = new SalesCrmService(prisma, sequenceService)
    controller = new SalesCrmController(service)
    guard = new RolesGuard(new Reflector())
  })

  it('filters leads by status', async () => {
    const result = await service.findAll({ status: 'quotation-sent' })

    expect(result.leads).toHaveLength(1)
    expect(result.leads[0].id).toBe('W24-LEAD-00002')
  })

  it('creates a lead and reserves customer and case ids', async () => {
    const created = await service.create({
      source: 'Website',
      name: 'Nisha Verma',
      phone: '+919000000000',
      email: 'nisha@example.com',
      address: 'MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560001',
      company: 'NV Holdings',
      designation: 'Director',
      serviceInterest: 'Will Drafting',
      wealthManager: {
        wealthManagerId: 'WM-003',
        wealthManagerName: 'Rohit Singhania',
      },
      assignedEmployee: 'Priya Sharma',
      leadType: 'Individual',
      notes: 'Created by test',
      taxContext: {
        sellerState: 'Delhi',
        customerState: 'Karnataka',
      },
    })

    expect(created.id).toBe('W24-LEAD-00003')
    expect(created.customerId).toBe('W24-CUST-00003')
    expect(created.caseId).toBe('W24-CASE-00003')
  })

  it('auto-calculates quotation totals', async () => {
    const quotation = await service.createQuotation('W24-LEAD-00001', {
      leadId: 'W24-LEAD-00001',
      items: [
        {
          serviceId: 'SVC-001',
          serviceName: 'Will Drafting (Basic)',
          quantity: 2,
          unitPrice: 15000,
        },
      ],
    })

    expect(quotation.subtotal).toBe(30000)
    expect(quotation.taxAmount).toBe(5400)
    expect(quotation.total).toBe(35400)
    expect(quotation.referenceNumber).toBe('W24-QT-2026-0002')
  })

  it('bulk-imports multiple leads and returns imported count', async () => {
    const result = await service.bulkImport({
      records: [
        {
          source: 'Website',
          name: 'Lead One',
          phone: '+919111111111',
          email: 'one@example.com',
          address: 'Delhi',
          city: 'Delhi',
          state: 'Delhi',
          pinCode: '110001',
          company: '',
          designation: '',
          serviceInterest: 'Will Drafting',
          wealthManager: { wealthManagerId: 'WM-001', wealthManagerName: 'Vikram Mehta' },
          assignedEmployee: 'Priya Sharma',
          leadType: 'Individual',
        },
        {
          source: 'Referral',
          name: 'Lead Two',
          phone: '+919222222222',
          email: 'two@example.com',
          address: 'Mumbai',
          city: 'Mumbai',
          state: 'Maharashtra',
          pinCode: '400001',
          company: '',
          designation: '',
          serviceInterest: 'Trust Registration',
          wealthManager: { wealthManagerId: 'WM-002', wealthManagerName: 'Sonal Kapoor' },
          assignedEmployee: 'Amit Verma',
          leadType: 'Individual',
        },
      ],
    })

    expect(result.importedCount).toBe(2)
    expect(result.leads).toHaveLength(2)
  })

  it('assigns a lead to accounts and creates an account entry', async () => {
    const result = await service.assignToAccount('W24-LEAD-00001', {
      leadId: 'W24-LEAD-00001',
    })

    expect(result.lead.status).toBe('invoice-sent')
    expect(accountEntries).toHaveLength(1)
    expect((accountEntries[0] as { leadId: string }).leadId).toBe('W24-LEAD-00001')
  })

  it('blocks Sales users from modifying assigned agents in the controller', () => {
    expect(() =>
      controller.updateLead(
        'W24-LEAD-00001',
        { assignedAgentId: 'AGENT-404' },
        { user: { role: 'Sales' } },
      ),
    ).toThrow(ForbiddenException)
  })

  it('blocks Sales users from the admin-only quotation approval route', () => {
    expect(() =>
      controller.approveCustomQuotation(
        'W24-QT-00001',
        { approvedBy: 'Sales User' },
        { user: { role: 'Sales' } },
      ),
    ).toThrow(ForbiddenException)
  })

  it('returns forbidden from RolesGuard for blocked and read-only writes', () => {
    expect(() =>
      guard.canActivate(
        createHttpExecutionContext({
          request: { method: 'GET', user: { role: 'HR' } },
          handler: controller.getLeads,
          controllerClass: SalesCrmController,
        }),
      ),
    ).toThrow(ForbiddenException)

    expect(() =>
      guard.canActivate(
        createHttpExecutionContext({
          request: { method: 'POST', user: { role: 'Operations' } },
          handler: controller.createLead,
          controllerClass: SalesCrmController,
        }),
      ),
    ).toThrow(ForbiddenException)
  })
})

function createHttpExecutionContext({
  request,
  handler,
  controllerClass,
}: {
  request: { method: string; user?: { role?: string; roles?: string[] } }
  handler: unknown
  controllerClass: new (...args: never[]) => unknown
}) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => handler,
    getClass: () => controllerClass,
  } as never
}
