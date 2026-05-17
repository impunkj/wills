import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PRISMA_SERVICE } from '../sales-crm/services/sales-crm.service'
import { SequenceService } from '../sales-crm/services/sequence.service'
import { CreatePartnerDto } from './dto/create-partner.dto'
import { UpdatePartnerDto } from './dto/update-partner.dto'

type Decimalish = number | { toNumber(): number }
type PackageStatus = 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED'

type PartnerRow = {
  id: string
  partnerId: string
  name: string
  email?: string | null
  phone?: string | null
  isActive: boolean
  walletBalance: Decimalish
  createdAt: Date
  updatedAt: Date
}

type PartnerPackageRow = {
  id: string
  partnerId: string
  name: string
  totalWills: number
  usedWills: number
  status: PackageStatus
  expiresAt?: Date | null
  createdAt: Date
}

type PrismaPartnerClient = {
  findMany(args?: Record<string, unknown>): Promise<PartnerRow[]>
  findUnique(args: Record<string, unknown>): Promise<PartnerRow | null>
  create(args: Record<string, unknown>): Promise<PartnerRow>
  update(args: Record<string, unknown>): Promise<PartnerRow>
}

type PrismaPartnerPackageClient = {
  findMany(args?: Record<string, unknown>): Promise<PartnerPackageRow[]>
  findFirst(args?: Record<string, unknown>): Promise<PartnerPackageRow | null>
  update(args: Record<string, unknown>): Promise<PartnerPackageRow>
  updateMany(args: Record<string, unknown>): Promise<{ count: number }>
}

export interface PartnersPrismaServiceLike {
  partner: PrismaPartnerClient
  partnerPackage: PrismaPartnerPackageClient
  $transaction<T>(work: () => Promise<T>): Promise<T>
}

@Injectable()
export class PartnersService {
  private readonly consumeQueues = new Map<string, Promise<void>>()

  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: PartnersPrismaServiceLike,
    private readonly sequenceService: SequenceService,
  ) {}

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const rows = await this.prisma.partner.findMany({
      where: {
        isActive: filters?.isActive,
        search: filters?.search?.trim().toLowerCase(),
      },
      orderBy: { createdAt: 'desc' },
    })

    return rows.map((row) => this.mapPartner(row))
  }

  async findOne(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } })
    if (!partner) {
      throw new NotFoundException(`Partner ${id} was not found`)
    }

    return this.mapPartner(partner)
  }

  async create(dto: CreatePartnerDto) {
    try {
      const count = await this.prisma.partner.findMany().then((rows) => rows.length)
      const partnerId = `PAT-${String(count + 1).padStart(5, '0')}`
      return await this.prisma.partner.create({
        data: {
          partnerId,
          name: dto.name,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          isActive: true,
          walletBalance: 0,
        },
      })
    } catch (error) {
      console.error('Create partner error:', error)
      throw error
    }
  }

  async update(id: string, dto: UpdatePartnerDto) {
    try {
      return await this.prisma.partner.update({
        where: { id },
        data: {
          name: dto.name ?? undefined,
          email: dto.email ?? undefined,
          phone: dto.phone ?? undefined,
          isActive: dto.isActive ?? undefined,
        },
      }).then((row) => this.mapPartner(row))
    } catch (error) {
      console.error('Update partner error:', error)
      throw error
    }
  }

  async toggleActive(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } })
    if (!partner) {
      throw new NotFoundException(`Partner ${id} was not found`)
    }

    const updated = await this.prisma.partner.update({
      where: { id },
      data: { isActive: !partner.isActive },
    })

    return this.mapPartner(updated)
  }

  async consumeWill(partnerId: string) {
    return this.runExclusive(partnerId, async () =>
      this.prisma.$transaction(async () => {
        const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } })
        if (!partner) {
          throw new NotFoundException(`Partner ${partnerId} was not found`)
        }

        const pkg = (
          await this.prisma.partnerPackage.findMany({
            where: {
              partnerId,
            },
            orderBy: { createdAt: 'asc' },
          })
        )
          .filter(
            (row) =>
              row.status === 'ACTIVE' &&
              row.usedWills < row.totalWills &&
              (!row.expiresAt || row.expiresAt >= new Date()),
          )
          .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())[0]

        if (!pkg) {
          throw new BadRequestException('No active package available')
        }

        const nextUsedWills = pkg.usedWills + 1
        const nextStatus: PackageStatus =
          nextUsedWills >= pkg.totalWills ? 'EXHAUSTED' : pkg.status

        const updated = await this.prisma.partnerPackage.update({
          where: { id: pkg.id },
          data: {
            usedWills: nextUsedWills,
            status: nextStatus,
          },
        })

        return this.mapPackage(updated)
      }),
    )
  }

  async getWalletHistory(partnerId: string) {
    await this.findOne(partnerId)
    return []
  }

  async getTab(
    partnerId: string,
    tab: 'overview' | 'packages' | 'leads' | 'wallet' | 'activity',
  ) {
    await this.findOne(partnerId)

    if (tab === 'packages') {
      const packages = await this.prisma.partnerPackage.findMany({
        where: { partnerId },
        orderBy: { createdAt: 'desc' },
      })
      return packages.map((pkg) => this.mapPackage(pkg))
    }

    return []
  }

  async expireStalePackages() {
    return this.prisma.partnerPackage.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    })
  }

  private async primePartnerSequence() {
    const partners = await this.prisma.partner.findMany()
    this.sequenceService.reserveFromExisting(
      'partner',
      partners.map((partner) => partner.partnerId),
    )
  }

  private async runExclusive<T>(key: string, work: () => Promise<T>): Promise<T> {
    const current = this.consumeQueues.get(key) ?? Promise.resolve()
    let release!: () => void
    const next = new Promise<void>((resolve) => {
      release = resolve
    })
    this.consumeQueues.set(key, current.then(() => next))

    await current
    try {
      return await work()
    } finally {
      release()
      if (this.consumeQueues.get(key) === next) {
        this.consumeQueues.delete(key)
      }
    }
  }

  private mapPartner(row: PartnerRow) {
    return {
      id: row.id,
      partnerId: row.partnerId,
      name: row.name,
      email: row.email ?? null,
      phone: row.phone ?? null,
      isActive: row.isActive,
      walletBalance: this.toNumber(row.walletBalance),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  private mapPackage(row: PartnerPackageRow) {
    return {
      id: row.id,
      partnerId: row.partnerId,
      name: row.name,
      totalWills: row.totalWills,
      usedWills: row.usedWills,
      status: row.status,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }
  }

  private toNumber(value: Decimalish) {
    return typeof value === 'number' ? value : value.toNumber()
  }
}
