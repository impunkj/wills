import 'reflect-metadata'
import { BadRequestException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SequenceService } from '../../sales-crm/services/sequence.service'
import { PartnersService, type PartnersPrismaServiceLike } from '../partners.service'

describe('PartnersService', () => {
  let prisma: PartnersPrismaServiceLike
  let service: PartnersService
  let partners: Array<Record<string, unknown>>
  let packages: Array<Record<string, unknown>>

  beforeEach(() => {
    partners = [
      {
        id: 'partner-1',
        partnerId: 'PAT-00001',
        name: 'Rohit Verma',
        email: 'rohit@example.com',
        phone: '+919999999999',
        isActive: true,
        walletBalance: 0,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-01T00:00:00.000Z'),
      },
    ]

    packages = [
      {
        id: 'pkg-1',
        partnerId: 'partner-1',
        name: 'Silver Package',
        totalWills: 2,
        usedWills: 0,
        status: 'ACTIVE',
        expiresAt: new Date('2027-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
      },
      {
        id: 'pkg-expired',
        partnerId: 'partner-1',
        name: 'Old Package',
        totalWills: 5,
        usedWills: 1,
        status: 'ACTIVE',
        expiresAt: new Date('2025-01-01T00:00:00.000Z'),
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    ]

    const partnerClient = {
      findMany: vi.fn(async () => partners as never),
      findUnique: vi.fn(async ({ where }: Record<string, unknown>) => {
        const id = (where as { id: string }).id
        return (partners.find((row) => row.id === id) as never) ?? null
      }),
      create: vi.fn(async ({ data }: Record<string, unknown>) => {
        const now = new Date()
        const row = {
          id: `partner-${partners.length + 1}`,
          ...(data as Record<string, unknown>),
          createdAt: now,
          updatedAt: now,
        }
        partners.push(row)
        return row as never
      }),
      update: vi.fn(async ({ where, data }: Record<string, unknown>) => {
        const row = partners.find((item) => item.id === (where as { id: string }).id)
        if (!row) throw new Error('Partner not found')
        Object.assign(row, data, { updatedAt: new Date() })
        return row as never
      }),
    }

    const partnerPackageClient = {
      findMany: vi.fn(async ({ where }: Record<string, unknown>) => {
        const partnerId = (where as { partnerId?: string })?.partnerId
        return packages.filter((row) => !partnerId || row.partnerId === partnerId) as never
      }),
      findFirst: vi.fn(async ({ where, orderBy }: Record<string, unknown>) => {
        const partnerId = (where as { partnerId?: string })?.partnerId
        const status = (where as { status?: string })?.status
        const matches = packages
          .filter((row) => (!partnerId || row.partnerId === partnerId) && (!status || row.status === status))
          .sort((a, b) => {
            if ((orderBy as { createdAt?: string })?.createdAt === 'asc') {
              return (a.createdAt as Date).getTime() - (b.createdAt as Date).getTime()
            }
            return (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime()
          })
        return (matches[0] as never) ?? null
      }),
      update: vi.fn(async ({ where, data }: Record<string, unknown>) => {
        const row = packages.find((item) => item.id === (where as { id: string }).id)
        if (!row) throw new Error('Package not found')
        Object.assign(row, data)
        return row as never
      }),
      updateMany: vi.fn(async ({ where, data }: Record<string, unknown>) => {
        const before = packages.filter((row) => {
          const statusMatch = (where as { status?: string })?.status ? row.status === (where as { status: string }).status : true
          const expiryDate = ((where as { expiresAt?: { lt?: Date } })?.expiresAt?.lt) ?? null
          const expiryMatch = expiryDate ? (row.expiresAt as Date | null) !== null && (row.expiresAt as Date) < expiryDate : true
          return statusMatch && expiryMatch
        })
        before.forEach((row) => Object.assign(row, data))
        return { count: before.length }
      }),
    }

    const transaction = async <T>(work: () => Promise<T>): Promise<T> => work()

    prisma = {
      partner: partnerClient,
      partnerPackage: partnerPackageClient,
      $transaction: transaction,
    }

    const sequenceService = new SequenceService()
    sequenceService.initializeCounter('partner', 1)
    service = new PartnersService(prisma, sequenceService)
  })

  it('create mints unique PAT-XXXXX IDs', async () => {
    const first = await service.create({ name: 'A' })
    const second = await service.create({ name: 'B' })

    expect(first.partnerId).toBe('PAT-00002')
    expect(second.partnerId).toBe('PAT-00003')
  })

  it('consumeWill decrements usedWills correctly', async () => {
    const updated = await service.consumeWill('partner-1')

    expect(updated.usedWills).toBe(1)
  })

  it('consumeWill sets package status EXHAUSTED when usedWills reaches totalWills', async () => {
    await service.consumeWill('partner-1')
    const updated = await service.consumeWill('partner-1')

    expect(updated.usedWills).toBe(2)
    expect(updated.status).toBe('EXHAUSTED')
  })

  it('consumeWill throws BadRequestException when no active package', async () => {
    packages.forEach((row) => {
      row.status = 'EXHAUSTED'
    })

    await expect(service.consumeWill('partner-1')).rejects.toThrow(BadRequestException)
  })

  it('Promise.all of 2 concurrent consumeWill calls does not oversell', async () => {
    packages[0].totalWills = 1
    packages[0].usedWills = 0
    packages[0].status = 'ACTIVE'

    const results = await Promise.allSettled([
      service.consumeWill('partner-1'),
      service.consumeWill('partner-1'),
    ])

    const packageRow = packages.find((row) => row.id === 'pkg-1') as { usedWills: number }
    expect(packageRow.usedWills).toBeLessThanOrEqual(1)
    expect(results.filter((row) => row.status === 'fulfilled')).toHaveLength(1)
  })

  it('expireStalePackages sets EXPIRED on packages with past expiresAt', async () => {
    const result = await service.expireStalePackages()

    expect(result.count).toBeGreaterThanOrEqual(1)
    expect((packages.find((row) => row.id === 'pkg-expired') as { status: string }).status).toBe('EXPIRED')
  })

  it('toggleActive flips isActive correctly', async () => {
    const updated = await service.toggleActive('partner-1')

    expect(updated.isActive).toBe(false)
  })
})
