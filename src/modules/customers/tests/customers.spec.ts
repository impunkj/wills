import 'reflect-metadata'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CustomersService, type CustomersPrismaServiceLike } from '../customers.service'

describe('CustomersService', () => {
  let prisma: CustomersPrismaServiceLike
  let service: CustomersService

  beforeEach(() => {
    const customers = [
      {
        id: 'cust-1',
        accountId: 'acc-1',
        name: 'Anjali Mehta',
        email: 'anjali@example.com',
        phone: '+919111111111',
        tags: ['premium', 'mumbai'],
        wealthManagerId: 'WM-001',
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-01T00:00:00.000Z'),
      },
      {
        id: 'cust-2',
        accountId: 'acc-2',
        name: 'Anand Mehta',
        email: 'anand@example.com',
        phone: '+919222222222',
        tags: ['delhi'],
        wealthManagerId: 'WM-002',
        createdAt: new Date('2026-05-02T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
      },
    ]

    const cases = [
      {
        id: 'case-1',
        customerId: 'cust-1',
        serviceType: 'Will Drafting',
        status: 'OPEN',
        createdAt: new Date('2026-05-05T00:00:00.000Z'),
      },
      {
        id: 'case-2',
        customerId: 'cust-2',
        serviceType: 'Trust Registration',
        status: 'OPEN',
        createdAt: new Date('2026-05-06T00:00:00.000Z'),
      },
    ]

    const documents = [
      { id: 'doc-1', customerId: 'cust-1', title: 'Will Draft.pdf' },
      { id: 'doc-2', customerId: 'cust-2', title: 'Trust Draft.pdf' },
    ]

    prisma = {
      customer: {
        findMany: vi.fn(async (args?: Record<string, unknown>) => {
          const predicate = (args?.where as { __predicate?: (customer: typeof customers[number]) => boolean } | undefined)?.__predicate
          return (predicate ? customers.filter(predicate) : customers) as never
        }),
        findUnique: vi.fn(async ({ where }: Record<string, unknown>) => {
          const id = (where as { id: string }).id
          return (customers.find((customer) => customer.id === id) as never) ?? null
        }),
        create: vi.fn(async ({ data }: Record<string, unknown>) => ({
          id: 'cust-3',
          ...(data as Record<string, unknown>),
          createdAt: new Date(),
          updatedAt: new Date(),
        }) as never),
        update: vi.fn(async ({ where, data }: Record<string, unknown>) => ({
          ...(customers.find((customer) => customer.id === (where as { id: string }).id) ?? customers[0]),
          ...(data as Record<string, unknown>),
          updatedAt: new Date(),
        }) as never),
      },
      case: {
        findMany: vi.fn(async ({ where }: Record<string, unknown>) => {
          const customerId = (where as { customerId: string }).customerId
          return cases.filter((row) => row.customerId === customerId) as never
        }),
      },
      document: {
        findMany: vi.fn(async ({ where }: Record<string, unknown>) => {
          const customerId = (where as { customerId: string }).customerId
          return documents.filter((row) => row.customerId === customerId) as never
        }),
      },
      quotation: {
        findMany: vi.fn(async () => [] as never),
      },
      invoice: {
        findMany: vi.fn(async () => [] as never),
      },
      activity: {
        findMany: vi.fn(async () => [] as never),
      },
    }

    service = new CustomersService(prisma)
  })

  it('findAll with 2 filters returns intersection only', async () => {
    const result = await service.findAll({
      search: 'mehta',
      wealthManagerId: 'WM-001',
    })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('cust-1')
  })

  it("getTab('cases') returns only cases for that customer", async () => {
    const result = await service.getTab('cust-1', 'cases')

    expect(result).toHaveLength(1)
    expect(result[0].customerId).toBe('cust-1')
  })

  it('getTab for different customers returns different data sets', async () => {
    const first = await service.getTab('cust-1', 'documents')
    const second = await service.getTab('cust-2', 'documents')

    expect(first).not.toEqual(second)
    expect(first[0]?.customerId).toBe('cust-1')
    expect(second[0]?.customerId).toBe('cust-2')
  })

  it('empty tab returns empty array not null', async () => {
    const result = await service.getTab('cust-1', 'quotations')

    expect(result).toEqual([])
  })
})
