import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PRISMA_SERVICE } from '../sales-crm/services/sales-crm.service'
import { CreateTeamMemberDto } from './dto/create-team-member.dto'
import { UpdateTeamMemberDto } from './dto/update-team-member.dto'

type TeamRole = 'ADMIN' | 'WEALTH_MANAGER' | 'LAWYER' | 'SUPPORT'
type KYCStatus = 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED'

type TeamMemberRow = {
  id: string
  userId: string
  role: TeamRole
  isActive: boolean
  kycStatus: KYCStatus
  kycDocuments?: unknown
  deletedAt?: Date | null
  createdAt: Date
  user?: {
    id: string
    name: string
    email: string
    phone?: string | null
  } | null
}

type LawyerRow = {
  id: string
  isActive: boolean
  teamMemberId?: string | null
}

type PrismaTeamMemberClient = {
  findMany(args?: Record<string, unknown>): Promise<TeamMemberRow[]>
  findUnique(args: Record<string, unknown>): Promise<TeamMemberRow | null>
  create(args: Record<string, unknown>): Promise<TeamMemberRow>
  update(args: Record<string, unknown>): Promise<TeamMemberRow>
}

type PrismaLawyerClient = {
  findUnique(args: Record<string, unknown>): Promise<LawyerRow | null>
  update(args: Record<string, unknown>): Promise<LawyerRow>
}

type UserRow = {
  id: string
  name: string
  email: string
  phone?: string | null
  role: TeamRole
  createdAt: Date
}

type PrismaUserClient = {
  findMany(args?: Record<string, unknown>): Promise<UserRow[]>
  findUnique(args: Record<string, unknown>): Promise<UserRow | null>
  create(args: Record<string, unknown>): Promise<UserRow>
}

export interface TeamPrismaServiceLike {
  teamMember: PrismaTeamMemberClient
  lawyer: PrismaLawyerClient
  user?: PrismaUserClient
}

@Injectable()
export class TeamService {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: TeamPrismaServiceLike,
  ) {}

  async findAll(includeInactive = false) {
    const rows = await this.prisma.teamMember.findMany({
      include: { user: true },
    })

    if (rows.length === 0 && this.prisma.user) {
      const users = await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      })
      return users.map((user) => ({
        id: user.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        role: user.role,
        isActive: true,
        kycStatus: 'PENDING' as const,
        kycDocuments: null,
        deletedAt: null,
        createdAt: user.createdAt.toISOString(),
      }))
    }

    return rows
      .filter((row) => (includeInactive ? true : row.deletedAt == null && row.isActive))
      .map((row) => this.mapTeamMember(row))
  }

  async findOne(id: string) {
    const row = await this.prisma.teamMember.findUnique({
      where: { id },
      include: { user: true },
    })
    if (!row) {
      throw new NotFoundException(`Team member ${id} was not found`)
    }
    return this.mapTeamMember(row)
  }

  async create(dto: CreateTeamMemberDto) {
    try {
      let userId = dto.userId
      if (userId) {
        const user = await this.prisma.user?.findUnique({ where: { id: userId } })
        if (!user) {
          userId = undefined
        }
      }

      if (!userId) {
        const bcrypt = await import('bcryptjs')
        const hashed = await bcrypt.hash('Welcome@123', 10)
        const newUser = await this.prisma.user?.create({
          data: {
            name: dto.name ?? 'Team Member',
            email: dto.email ?? `member_${Date.now()}@wills24.com`,
            password: hashed,
            role: dto.role ?? 'SUPPORT',
          },
        })
        userId = newUser?.id
      }

      const created = await this.prisma.teamMember.create({
        data: {
          userId,
          role: dto.role as TeamRole,
          isActive: true,
          kycStatus: 'PENDING',
          deletedAt: null,
        },
      })
      return this.mapTeamMember(created)
    } catch (error) {
      console.error('Create team member error:', error)
      throw error
    }
  }

  async update(id: string, dto: UpdateTeamMemberDto) {
    await this.findOne(id)
    const updated = await this.prisma.teamMember.update({
      where: { id },
      data: {
        ...(dto.userId !== undefined ? { userId: dto.userId } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
      },
    })
    return this.mapTeamMember(updated)
  }

  async softDelete(id: string, hardDelete = false) {
    if (hardDelete) {
      throw new ForbiddenException('Hard delete is not permitted')
    }

    await this.findOne(id)
    const updated = await this.prisma.teamMember.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })
    return this.mapTeamMember(updated)
  }

  async updateKYC(id: string, status: KYCStatus, documents?: unknown) {
    await this.findOne(id)
    const updated = await this.prisma.teamMember.update({
      where: { id },
      data: {
        kycStatus: status,
        ...(documents !== undefined ? { kycDocuments: documents } : {}),
      },
    })
    return this.mapTeamMember(updated)
  }

  getPermissionMatrix() {
    return {
      ADMIN: ['dashboard', 'sales-crm', 'accounts', 'customers', 'cases', 'partners', 'team', 'lawyers', 'reports'],
      WEALTH_MANAGER: ['dashboard', 'sales-crm', 'accounts', 'customers', 'cases', 'partners'],
      LAWYER: ['dashboard', 'cases'],
      SUPPORT: ['dashboard', 'customers'],
    } as const
  }

  async setAvailability(lawyerId: string, isAvailable: boolean) {
    const lawyer = await this.prisma.lawyer.findUnique({ where: { id: lawyerId } })
    if (!lawyer) {
      throw new NotFoundException(`Lawyer ${lawyerId} was not found`)
    }
    if (!lawyer.teamMemberId) {
      throw new NotFoundException(`Team member for lawyer ${lawyerId} was not found`)
    }

    const teamMember = await this.prisma.teamMember.findUnique({
      where: { id: lawyer.teamMemberId },
    })
    if (!teamMember) {
      throw new NotFoundException(`Team member ${lawyer.teamMemberId} was not found`)
    }

    const updatedMember = await this.prisma.teamMember.update({
      where: { id: teamMember.id },
      data: { isActive: isAvailable },
    })
    const updatedLawyer = await this.prisma.lawyer.update({
      where: { id: lawyerId },
      data: { isActive: isAvailable },
    })

    return {
      teamMember: this.mapTeamMember(updatedMember),
      lawyer: {
        id: updatedLawyer.id,
        isActive: updatedLawyer.isActive,
        teamMemberId: updatedLawyer.teamMemberId ?? null,
      },
    }
  }

  async getWealthManagers() {
    if (!this.prisma.user) {
      return []
    }

    return this.prisma.user.findMany({
      where: { role: 'WEALTH_MANAGER' },
      select: { id: true, name: true, email: true },
    })
  }

  async getEmployees() {
    if (!this.prisma.user) {
      return []
    }

    return this.prisma.user.findMany({
      where: {
        role: { in: ['WEALTH_MANAGER', 'LAWYER', 'SUPPORT'] },
      },
      select: { id: true, name: true, email: true, role: true },
    })
  }

  private mapTeamMember(row: TeamMemberRow) {
    return {
      id: row.id,
      userId: row.userId,
      name: row.user?.name ?? row.userId,
      email: row.user?.email ?? '',
      phone: row.user?.phone ?? null,
      role: row.role,
      isActive: row.isActive,
      kycStatus: row.kycStatus,
      kycDocuments: row.kycDocuments ?? null,
      deletedAt: row.deletedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }
  }
}
