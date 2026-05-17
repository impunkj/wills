import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PRISMA_SERVICE } from '../sales-crm/services/sales-crm.service'
import { CreateLawyerDto } from './dto/create-lawyer.dto'
import { UpdateLawyerDto } from './dto/update-lawyer.dto'

type LawyerRow = {
  id: string
  name: string
  email: string
  phone?: string | null
  specialization: string[]
  barNumber: string
  isActive: boolean
  activeCases: number
  teamMemberId?: string | null
  createdAt: Date
  updatedAt: Date
}

type CaseRow = {
  id: string
  caseNo?: string | null
  title?: string | null
  status: 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  customerId: string
  assignedLawyerId?: string | null
}

type PrismaLawyerClient = {
  findMany(args?: Record<string, unknown>): Promise<LawyerRow[]>
  findUnique(args: Record<string, unknown>): Promise<LawyerRow | null>
  create(args: Record<string, unknown>): Promise<LawyerRow>
  update(args: Record<string, unknown>): Promise<LawyerRow>
}

type PrismaCaseClient = {
  findMany(args?: Record<string, unknown>): Promise<CaseRow[]>
}

export interface LawyersPrismaServiceLike {
  lawyer: PrismaLawyerClient
  case: PrismaCaseClient
}

@Injectable()
export class LawyersService {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: LawyersPrismaServiceLike,
  ) {}

  async findAll(filters?: { specialization?: string; isActive?: boolean; search?: string }) {
    const rows = await this.prisma.lawyer.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const includeInactive = filters?.isActive === false
    return rows
      .filter((row) => (includeInactive ? true : row.isActive))
      .filter((row) =>
        filters?.specialization ? row.specialization.includes(filters.specialization) : true,
      )
      .filter((row) => {
        if (!filters?.search?.trim()) {
          return true
        }
        const search = filters.search.trim().toLowerCase()
        return (
          row.name.toLowerCase().includes(search) ||
          row.barNumber.toLowerCase().includes(search)
        )
      })
      .map((row) => this.mapLawyer(row))
  }

  async findOne(id: string) {
    const lawyer = await this.prisma.lawyer.findUnique({ where: { id } })
    if (!lawyer) {
      throw new NotFoundException(`Lawyer ${id} was not found`)
    }
    return this.mapLawyer(lawyer)
  }

  async create(dto: CreateLawyerDto) {
    try {
      const created = await this.prisma.lawyer.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone ?? null,
          specialization: dto.specialization ?? [],
          barNumber: dto.barNumber,
          isActive: true,
          activeCases: 0,
          ...(dto.teamMemberId ? { teamMemberId: dto.teamMemberId } : {}),
        },
      })
      return this.mapLawyer(created)
    } catch (error) {
      console.error('Create lawyer error:', error)
      throw error
    }
  }

  async update(id: string, dto: UpdateLawyerDto) {
    await this.findOne(id)
    const updated = await this.prisma.lawyer.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.barNumber !== undefined ? { barNumber: dto.barNumber } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.specialization !== undefined ? { specialization: dto.specialization } : {}),
      },
    })
    return this.mapLawyer(updated)
  }

  async deactivate(id: string) {
    await this.findOne(id)
    const updated = await this.prisma.lawyer.update({
      where: { id },
      data: { isActive: false },
    })
    return this.mapLawyer(updated)
  }

  async getActiveCases(lawyerId: string) {
    await this.findOne(lawyerId)
    const rows = await this.prisma.case.findMany({
      where: { assignedLawyerId: lawyerId },
    })

    return rows
      .filter(
        (row) =>
          row.assignedLawyerId === lawyerId &&
          row.status !== 'COMPLETED' &&
          row.status !== 'CANCELLED',
      )
      .map((row) => ({
        id: row.id,
        caseNo: row.caseNo ?? row.id,
        title: row.title ?? '',
        status: row.status,
        customerId: row.customerId,
      }))
  }

  private mapLawyer(row: LawyerRow) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? null,
      specialization: row.specialization,
      barNumber: row.barNumber,
      isActive: row.isActive,
      activeCases: row.activeCases,
      teamMemberId: row.teamMemberId ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }
}
