import 'reflect-metadata'
import { ForbiddenException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeamService, type TeamPrismaServiceLike } from '../team.service'

describe('TeamService', () => {
  let prisma: TeamPrismaServiceLike
  let service: TeamService
  let teamMembers: Array<Record<string, unknown>>
  let lawyers: Array<Record<string, unknown>>

  beforeEach(() => {
    teamMembers = [
      {
        id: 'tm-1',
        userId: 'user-1',
        role: 'LAWYER',
        isActive: true,
        kycStatus: 'PENDING',
        kycDocuments: null,
        deletedAt: null,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
      },
      {
        id: 'tm-2',
        userId: 'user-2',
        role: 'SUPPORT',
        isActive: false,
        kycStatus: 'UPLOADED',
        kycDocuments: { pan: 'uploaded' },
        deletedAt: new Date('2026-05-02T00:00:00.000Z'),
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
      },
    ]

    lawyers = [
      {
        id: 'law-1',
        isActive: true,
        teamMemberId: 'tm-1',
      },
    ]

    prisma = {
      teamMember: {
        findMany: vi.fn(async () => teamMembers as never),
        findUnique: vi.fn(async ({ where }: Record<string, unknown>) => {
          const id = (where as { id: string }).id
          return (teamMembers.find((row) => row.id === id) as never) ?? null
        }),
        create: vi.fn(async ({ data }: Record<string, unknown>) => ({
          id: 'tm-3',
          ...(data as Record<string, unknown>),
          createdAt: new Date(),
        }) as never),
        update: vi.fn(async ({ where, data }: Record<string, unknown>) => {
          const row = teamMembers.find((item) => item.id === (where as { id: string }).id)
          if (!row) throw new Error('Team member not found')
          Object.assign(row, data)
          return row as never
        }),
      },
      lawyer: {
        findUnique: vi.fn(async ({ where }: Record<string, unknown>) => {
          const id = (where as { id: string }).id
          return (lawyers.find((row) => row.id === id) as never) ?? null
        }),
        update: vi.fn(async ({ where, data }: Record<string, unknown>) => {
          const row = lawyers.find((item) => item.id === (where as { id: string }).id)
          if (!row) throw new Error('Lawyer not found')
          Object.assign(row, data)
          return row as never
        }),
      },
    }

    service = new TeamService(prisma)
  })

  it('softDelete sets deletedAt, row still exists (findOne still returns it)', async () => {
    await service.softDelete('tm-1')
    const result = await service.findOne('tm-1')

    expect(result.deletedAt).not.toBeNull()
  })

  it('findAll excludes soft-deleted members by default', async () => {
    const result = await service.findAll()

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('tm-1')
  })

  it('findAll(true) includes soft-deleted', async () => {
    const result = await service.findAll(true)

    expect(result).toHaveLength(2)
  })

  it('hardDelete attempt throws ForbiddenException', async () => {
    await expect(service.softDelete('tm-1', true)).rejects.toThrow(ForbiddenException)
  })

  it('updateKYC transitions: PENDING → UPLOADED → VERIFIED valid', async () => {
    const uploaded = await service.updateKYC('tm-1', 'UPLOADED', { aadhaar: 'uploaded' })
    const verified = await service.updateKYC('tm-1', 'VERIFIED')

    expect(uploaded.kycStatus).toBe('UPLOADED')
    expect(verified.kycStatus).toBe('VERIFIED')
  })

  it('setAvailability updates both TeamMember.isActive and Lawyer.isActive', async () => {
    const result = await service.setAvailability('law-1', false)

    expect(result.teamMember.isActive).toBe(false)
    expect(result.lawyer.isActive).toBe(false)
  })

  it('getPermissionMatrix returns correct role mappings', () => {
    const matrix = service.getPermissionMatrix()

    expect(matrix.ADMIN).toContain('reports')
    expect(matrix.LAWYER).toEqual(['dashboard', 'cases'])
  })
})
