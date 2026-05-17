import 'reflect-metadata'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LawyersService, type LawyersPrismaServiceLike } from '../lawyers.service'

describe('LawyersService', () => {
  let prisma: LawyersPrismaServiceLike
  let service: LawyersService

  beforeEach(() => {
    const lawyers = [
      {
        id: 'law-1',
        name: 'Rohit Iyer',
        email: 'rohit@example.com',
        phone: '+919111111111',
        specialization: ['Wills'],
        barNumber: 'BAR-001',
        isActive: true,
        activeCases: 2,
        teamMemberId: null,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-01T00:00:00.000Z'),
      },
      {
        id: 'law-2',
        name: 'Anita Kapoor',
        email: 'anita@example.com',
        phone: '+919222222222',
        specialization: ['Trusts'],
        barNumber: 'BAR-002',
        isActive: false,
        activeCases: 0,
        teamMemberId: null,
        createdAt: new Date('2026-05-02T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
      },
      {
        id: 'law-3',
        name: 'Rohini Sen',
        email: 'rohini@example.com',
        phone: '+919333333333',
        specialization: ['Wills', 'Trusts'],
        barNumber: 'BAR-003',
        isActive: true,
        activeCases: 1,
        teamMemberId: null,
        createdAt: new Date('2026-05-03T00:00:00.000Z'),
        updatedAt: new Date('2026-05-03T00:00:00.000Z'),
      },
    ]

    const cases = [
      {
        id: 'case-1',
        caseNo: 'W24-CASE-00001',
        title: 'Will matter',
        status: 'OPEN',
        customerId: 'cust-1',
        assignedLawyerId: 'law-1',
      },
      {
        id: 'case-2',
        caseNo: 'W24-CASE-00002',
        title: 'Closed matter',
        status: 'COMPLETED',
        customerId: 'cust-2',
        assignedLawyerId: 'law-1',
      },
      {
        id: 'case-3',
        caseNo: 'W24-CASE-00003',
        title: 'Cancelled matter',
        status: 'CANCELLED',
        customerId: 'cust-3',
        assignedLawyerId: 'law-1',
      },
    ]

    prisma = {
      lawyer: {
        findMany: vi.fn(async () => lawyers as never),
        findUnique: vi.fn(async ({ where }: Record<string, unknown>) => {
          const id = (where as { id: string }).id
          return (lawyers.find((row) => row.id === id) as never) ?? null
        }),
        create: vi.fn(async ({ data }: Record<string, unknown>) => ({
          id: 'law-4',
          ...(data as Record<string, unknown>),
          createdAt: new Date(),
          updatedAt: new Date(),
        }) as never),
        update: vi.fn(async ({ where, data }: Record<string, unknown>) => {
          const row = lawyers.find((item) => item.id === (where as { id: string }).id)
          if (!row) throw new Error('Lawyer not found')
          Object.assign(row, data, { updatedAt: new Date() })
          return row as never
        }),
      },
      case: {
        findMany: vi.fn(async ({ where }: Record<string, unknown>) => {
          const lawyerId = (where as { assignedLawyerId?: string })?.assignedLawyerId
          return cases.filter((row) => row.assignedLawyerId === lawyerId) as never
        }),
      },
    }

    service = new LawyersService(prisma)
  })

  it('findAll returns only active lawyers by default', async () => {
    const result = await service.findAll()
    expect(result.map((row) => row.id)).toEqual(['law-1', 'law-3'])
  })

  it('findAll({ isActive: false }) returns inactive lawyers', async () => {
    const result = await service.findAll({ isActive: false })
    expect(result.map((row) => row.id)).toContain('law-2')
  })

  it('findAll({ specialization: "Wills" }) returns only matching lawyers', async () => {
    const result = await service.findAll({ specialization: 'Wills' })
    expect(result.every((row) => row.specialization.includes('Wills'))).toBe(true)
  })

  it('multiple filters combine as AND (not OR)', async () => {
    const result = await service.findAll({ specialization: 'Wills', search: 'rohini' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('law-3')
  })

  it('getActiveCases excludes COMPLETED and CANCELLED status cases', async () => {
    const result = await service.getActiveCases('law-1')
    expect(result.map((row) => row.id)).toEqual(['case-1'])
  })

  it('deactivate sets isActive false, lawyer row still exists', async () => {
    const result = await service.deactivate('law-1')
    expect(result.isActive).toBe(false)
    const found = await service.findOne('law-1')
    expect(found.id).toBe('law-1')
  })

  it('search matches partial name case-insensitively', async () => {
    const result = await service.findAll({ search: 'roh' })
    expect(result.map((row) => row.id)).toEqual(['law-1', 'law-3'])
  })
})
