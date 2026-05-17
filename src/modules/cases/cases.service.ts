import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PRISMA_SERVICE } from '../sales-crm/services/sales-crm.service'
import { SequenceService } from '../sales-crm/services/sequence.service'
import { AddFollowUpDto } from './dto/add-follow-up.dto'
import { CreateCaseDto } from './dto/create-case.dto'
import { UpdateCaseDto } from './dto/update-case.dto'

type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'

type CaseRow = {
  id: string
  caseNo?: string | null
  title?: string | null
  serviceType?: string | null
  status: CaseStatus
  level?: number | null
  customerId: string
  assignedLawyerId?: string | null
  resolvedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  customer?: {
    id: string
    name: string
    email: string
  } | null
  assignedLawyer?: {
    id: string
    name: string
    email: string
  } | null
}

type FollowUpRow = {
  id: string
  caseId: string
  action: string
  serviceType: string
  scheduledAt: Date
  completedAt?: Date | null
  createdAt: Date
}

type LawyerRow = {
  id: string
  activeCases: number
}

type PrismaCaseClient = {
  findMany(args?: Record<string, unknown>): Promise<CaseRow[]>
  findUnique(args: Record<string, unknown>): Promise<CaseRow | null>
  create(args: Record<string, unknown>): Promise<CaseRow>
  update(args: Record<string, unknown>): Promise<CaseRow>
}

type PrismaLawyerClient = {
  findUnique(args: Record<string, unknown>): Promise<LawyerRow | null>
  update(args: Record<string, unknown>): Promise<LawyerRow>
}

type PrismaFollowUpClient = {
  findMany(args?: Record<string, unknown>): Promise<FollowUpRow[]>
  create(args: Record<string, unknown>): Promise<FollowUpRow>
}

export interface CasesPrismaServiceLike {
  case: PrismaCaseClient
  lawyer: PrismaLawyerClient
  followUp: PrismaFollowUpClient
  $transaction<T>(callback: (tx: {
    case: PrismaCaseClient
    lawyer: PrismaLawyerClient
    followUp: PrismaFollowUpClient
  }) => Promise<T>): Promise<T>
}

@Injectable()
export class CasesService {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: CasesPrismaServiceLike,
    private readonly sequenceService: SequenceService,
  ) {}

  async findAll(filters?: {
    status?: CaseStatus
    customerId?: string
    lawyerId?: string
    search?: string
  }) {
    const rows = (await this.prisma.case.findMany({
      where: filters
        ? {
            status: filters.status,
            customerId: filters.customerId,
            assignedLawyerId: filters.lawyerId,
          }
        : undefined,
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        assignedLawyer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })) as CaseRow[]

    return rows.map((row) => this.mapCase(row))
  }

  async findOne(id: string) {
    const caseRow = await this.prisma.case.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        assignedLawyer: { select: { id: true, name: true } },
        followUps: { orderBy: { scheduledAt: 'desc' } },
      },
    })
    if (!caseRow) {
      throw new NotFoundException(`Case ${id} was not found`)
    }

    return this.mapCase(caseRow)
  }

  async create(dto: CreateCaseDto) {
    try {
      const caseNo = await this.sequenceService.nextCaseId()
      const created = await this.prisma.case.create({
        data: {
          caseNo,
          title: dto.title,
          serviceType: dto.serviceType,
          customerId: dto.customerId,
          assignedLawyerId: dto.assignedLawyerId ?? null,
          level: dto.level ?? 1,
          status: 'OPEN',
          resolvedAt: null,
        },
      })

      return this.mapCase(created)
    } catch (error) {
      console.error('Create case error:', error)
      throw error
    }
  }

  async update(id: string, dto: UpdateCaseDto) {
    await this.findOne(id)
    const updated = await this.prisma.case.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.serviceType !== undefined ? { serviceType: dto.serviceType } : {}),
        ...(dto.customerId !== undefined ? { customerId: dto.customerId } : {}),
        ...(dto.assignedLawyerId !== undefined ? { assignedLawyerId: dto.assignedLawyerId } : {}),
        ...(dto.level !== undefined ? { level: dto.level } : {}),
      },
    })

    return this.mapCase(updated)
  }

  async updateStatus(id: string, status: CaseStatus) {
    await this.findOne(id)
    const updated = await this.prisma.case.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'COMPLETED' ? new Date() : null,
      },
    })

    return this.mapCase(updated)
  }

  async reassign(caseId: string, newLawyerId: string) {
    try {
      const existingCase = await this.prisma.case.findUnique({
        where: { id: caseId },
        select: { assignedLawyerId: true },
      })

      return await this.prisma.$transaction(async (tx) => {
        if (existingCase?.assignedLawyerId) {
          await tx.lawyer.update({
            where: { id: existingCase.assignedLawyerId },
            data: { activeCases: { decrement: 1 } as never },
          })
        }
        await tx.lawyer.update({
          where: { id: newLawyerId },
          data: { activeCases: { increment: 1 } as never },
        })
        const updated = await tx.case.update({
          where: { id: caseId },
          data: { assignedLawyerId: newLawyerId },
        })
        return this.mapCase(updated as CaseRow)
      })
    } catch (error) {
      console.error('Reassign error:', error)
      throw error
    }
  }

  async getFollowUps(caseId: string) {
    try {
      const rows = await this.prisma.followUp.findMany({
        where: { caseId },
        orderBy: { scheduledAt: 'desc' },
      })
      return rows.map((row) => this.mapFollowUp(row))
    } catch (error) {
      console.error('getFollowUps error:', error)
      return []
    }
  }

  async addFollowUp(caseId: string, dto: AddFollowUpDto) {
    await this.findOne(caseId)
    const created = await this.prisma.followUp.create({
      data: {
        caseId,
        action: dto.action,
        serviceType: dto.serviceType,
        scheduledAt: dto.scheduledAt,
      },
    })

    return this.mapFollowUp(created)
  }

  async getServiceTypesByCustomer(customerId: string) {
    const rows = await this.prisma.case.findMany({
      where: { customerId },
    })

    return Array.from(
      new Set(
        rows
          .filter((row) => row.customerId === customerId && row.serviceType)
          .map((row) => row.serviceType as string),
      ),
    )
  }

  private mapCase(row: CaseRow) {
    return {
      id: row.id,
      caseNo: row.caseNo ?? row.id,
      title: row.title ?? '',
      serviceType: row.serviceType ?? '',
      status: row.status,
      level: row.level ?? 1,
      customerId: row.customerId,
      customer: row.customer ?? null,
      assignedLawyerId: row.assignedLawyerId ?? null,
      assignedLawyer: row.assignedLawyer ?? null,
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  private mapFollowUp(row: FollowUpRow) {
    return {
      id: row.id,
      caseId: row.caseId,
      action: row.action,
      serviceType: row.serviceType,
      scheduledAt: row.scheduledAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }
  }
}
