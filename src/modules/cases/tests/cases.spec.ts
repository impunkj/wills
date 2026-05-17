import 'reflect-metadata'
import { NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SequenceService } from '../../sales-crm/services/sequence.service'
import { CasesService, type CasesPrismaServiceLike } from '../cases.service'

describe('CasesService', () => {
  let prisma: CasesPrismaServiceLike
  let service: CasesService
  let caseRows: Array<Record<string, unknown>>
  let lawyerRows: Array<Record<string, unknown>>
  let followUpRows: Array<Record<string, unknown>>
  let transactionSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    caseRows = [
      {
        id: 'W24-CASE-00001',
        caseNo: 'W24-CASE-00001',
        title: 'Initial Will Case',
        serviceType: 'Will Drafting',
        status: 'OPEN',
        level: 1,
        customerId: 'cust-1',
        assignedLawyerId: 'law-1',
        resolvedAt: null,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-01T00:00:00.000Z'),
      },
      {
        id: 'W24-CASE-00002',
        caseNo: 'W24-CASE-00002',
        title: 'Trust Case',
        serviceType: 'Trust Registration',
        status: 'IN_PROGRESS',
        level: 2,
        customerId: 'cust-2',
        assignedLawyerId: 'law-2',
        resolvedAt: null,
        createdAt: new Date('2026-05-02T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
      },
    ]

    lawyerRows = [
      { id: 'law-1', activeCases: 3 },
      { id: 'law-2', activeCases: 1 },
      { id: 'law-3', activeCases: 0 },
    ]

    followUpRows = [
      {
        id: 'fu-1',
        caseId: 'W24-CASE-00001',
        action: 'Drafting',
        serviceType: 'Will Drafting',
        scheduledAt: new Date('2026-05-10T10:00:00.000Z'),
        completedAt: null,
        createdAt: new Date('2026-05-09T10:00:00.000Z'),
      },
      {
        id: 'fu-2',
        caseId: 'W24-CASE-00001',
        action: 'Client Review',
        serviceType: 'Will Drafting',
        scheduledAt: new Date('2026-05-11T10:00:00.000Z'),
        completedAt: null,
        createdAt: new Date('2026-05-10T10:00:00.000Z'),
      },
      {
        id: 'fu-3',
        caseId: 'W24-CASE-00002',
        action: 'Trust Registration',
        serviceType: 'Trust Registration',
        scheduledAt: new Date('2026-05-12T10:00:00.000Z'),
        completedAt: null,
        createdAt: new Date('2026-05-11T10:00:00.000Z'),
      },
    ]

    const caseClient = {
      findMany: vi.fn(async (args?: Record<string, unknown>) => {
        const where = (args?.where ?? {}) as Record<string, unknown>
        return caseRows.filter((row) => {
          if (where.customerId && row.customerId !== where.customerId) return false
          if (where.status && row.status !== where.status) return false
          if (where.assignedLawyerId && row.assignedLawyerId !== where.assignedLawyerId) return false
          if (typeof where.search === 'string' && where.search.length > 0) {
            const haystack = `${row.id} ${row.caseNo} ${row.title} ${row.serviceType}`.toLowerCase()
            if (!haystack.includes(where.search)) return false
          }
          return true
        }) as never
      }),
      findUnique: vi.fn(async ({ where }: Record<string, unknown>) => {
        const id = (where as { id: string }).id
        return (caseRows.find((row) => row.id === id) as never) ?? null
      }),
      create: vi.fn(async ({ data }: Record<string, unknown>) => {
        const now = new Date()
        const row = {
          ...(data as Record<string, unknown>),
          createdAt: now,
          updatedAt: now,
        }
        caseRows.push(row)
        return row as never
      }),
      update: vi.fn(async ({ where, data }: Record<string, unknown>) => {
        const row = caseRows.find((item) => item.id === (where as { id: string }).id)
        if (!row) {
          throw new Error('Case not found')
        }
        Object.assign(row, data, { updatedAt: new Date() })
        return row as never
      }),
    }

    const lawyerClient = {
      findUnique: vi.fn(async ({ where }: Record<string, unknown>) => {
        const id = (where as { id: string }).id
        return (lawyerRows.find((row) => row.id === id) as never) ?? null
      }),
      update: vi.fn(async ({ where, data }: Record<string, unknown>) => {
        const row = lawyerRows.find((item) => item.id === (where as { id: string }).id)
        if (!row) {
          throw new Error('Lawyer not found')
        }
        Object.assign(row, data)
        return row as never
      }),
    }

    const followUpClient = {
      findMany: vi.fn(async (args?: Record<string, unknown>) => {
        const caseId = ((args?.where ?? {}) as { caseId?: string }).caseId
        return followUpRows.filter((row) => row.caseId === caseId) as never
      }),
      create: vi.fn(async ({ data }: Record<string, unknown>) => {
        const row = {
          id: `fu-${followUpRows.length + 1}`,
          ...(data as Record<string, unknown>),
          createdAt: new Date(),
          completedAt: null,
        }
        followUpRows.push(row)
        return row as never
      }),
    }

    transactionSpy = vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations))

    prisma = {
      case: caseClient,
      lawyer: lawyerClient,
      followUp: followUpClient,
      $transaction: transactionSpy as CasesPrismaServiceLike['$transaction'],
    }

    const sequenceService = new SequenceService()
    sequenceService.initializeCounter('case', 2)
    service = new CasesService(prisma, sequenceService)
  })

  it('create mints unique W24-CASE-XXXXX IDs', async () => {
    const first = await service.create({
      title: 'Case One',
      serviceType: 'Will Drafting',
      customerId: 'cust-3',
    })
    const second = await service.create({
      title: 'Case Two',
      serviceType: 'Trust Registration',
      customerId: 'cust-4',
    })

    expect(first.id).toBe('W24-CASE-00003')
    expect(second.id).toBe('W24-CASE-00004')
    expect(first.id).not.toBe(second.id)
  })

  it('reassign calls $transaction and updates both lawyer activeCases', async () => {
    const result = await service.reassign('W24-CASE-00001', 'law-3')

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect((lawyerRows.find((row) => row.id === 'law-1') as { activeCases: number }).activeCases).toBe(2)
    expect((lawyerRows.find((row) => row.id === 'law-3') as { activeCases: number }).activeCases).toBe(1)
    expect(result.assignedLawyerId).toBe('law-3')
  })

  it('reassign throws NotFoundException when newLawyer not found', async () => {
    await expect(service.reassign('W24-CASE-00001', 'law-404')).rejects.toThrow(NotFoundException)
  })

  it('getFollowUps returns results ordered scheduledAt DESC', async () => {
    const result = await service.getFollowUps('W24-CASE-00001')

    expect(result.map((row) => row.id)).toEqual(['fu-2', 'fu-1'])
  })

  it('getServiceTypesByCustomer returns only that customer service types', async () => {
    const result = await service.getServiceTypesByCustomer('cust-1')

    expect(result).toEqual(['Will Drafting'])
  })

  it('updateStatus to COMPLETED sets resolvedAt timestamp', async () => {
    const result = await service.updateStatus('W24-CASE-00001', 'COMPLETED')

    expect(result.status).toBe('COMPLETED')
    expect(result.resolvedAt).not.toBeNull()
  })
})
