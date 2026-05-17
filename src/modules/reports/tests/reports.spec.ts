import 'reflect-metadata'
import { beforeEach, describe, expect, it } from 'vitest'
import { ReportsService, type ReportsPrismaServiceLike } from '../reports.service'

describe('ReportsService', () => {
  let service: ReportsService

  beforeEach(() => {
    const prisma: ReportsPrismaServiceLike = {
      quotation: {
        findMany: async () => [
          { createdAt: new Date('2026-01-10T00:00:00.000Z'), total: 1000 },
          { createdAt: new Date('2025-01-15T00:00:00.000Z'), total: 500 },
        ],
      },
      case: {
        findMany: async () => [
          {
            createdAt: new Date('2026-01-12T00:00:00.000Z'),
            status: 'OPEN',
            assignedLawyerId: 'law-1',
            resolvedAt: null,
          },
          {
            createdAt: new Date('2026-01-13T00:00:00.000Z'),
            status: 'COMPLETED',
            assignedLawyerId: 'law-1',
            resolvedAt: new Date('2026-01-20T00:00:00.000Z'),
          },
        ],
      },
      teamMember: {
        findMany: async () => [{ id: 'tm-1', role: 'LAWYER' }],
      },
      lawyer: {
        findMany: async () => [{ id: 'law-1', name: 'Rohit Iyer' }],
      },
    }

    service = new ReportsService(prisma)
  })

  it('monthly range (<=31d): prior period = same month last year', () => {
    const prior = service.computePriorPeriod({
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-31T00:00:00.000Z'),
    })

    expect(prior.from.toISOString()).toBe('2025-01-01T00:00:00.000Z')
    expect(prior.to.toISOString()).toBe('2025-01-31T00:00:00.000Z')
  })

  it('quarterly range (<=92d): prior period = 3 months back', () => {
    const prior = service.computePriorPeriod({
      from: new Date('2026-04-01T00:00:00.000Z'),
      to: new Date('2026-06-30T00:00:00.000Z'),
    })

    expect(prior.from.toISOString()).toBe('2026-01-01T00:00:00.000Z')
    expect(prior.to.toISOString()).toBe('2026-03-30T00:00:00.000Z')
  })

  it('custom range (>92d): prior period = same duration shifted back', () => {
    const prior = service.computePriorPeriod({
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-05-15T00:00:00.000Z'),
    })

    expect(prior.from.toISOString()).toBe('2025-08-18T00:00:00.000Z')
    expect(prior.to.toISOString()).toBe('2025-12-31T00:00:00.000Z')
  })

  it('comparePrevious: false → response has no prior or delta fields', async () => {
    const result = await service.getSalesReport(
      { from: new Date('2026-01-01T00:00:00.000Z'), to: new Date('2026-01-31T00:00:00.000Z') },
      false,
    )

    expect('prior' in result).toBe(false)
    expect('deltas' in result).toBe(false)
  })

  it('exportExcel returns Buffer with length > 0', async () => {
    const result = await service.exportExcel('sales', {
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-31T00:00:00.000Z'),
    })

    expect(Buffer.isBuffer(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('exportPDF returns Buffer with length > 0', async () => {
    const result = await service.exportPDF('team', {
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-31T00:00:00.000Z'),
    })

    expect(Buffer.isBuffer(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })
})
