import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PRISMA_SERVICE } from '../sales-crm/services/sales-crm.service'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'

type CustomerRow = {
  id: string
  accountId?: string | null
  name: string
  email: string
  phone: string
  tags: string[]
  wealthManagerId?: string | null
  createdAt: Date
  updatedAt: Date
  account?: {
    id: string
    accountNo?: string | null
    name: string
  } | null
  wealthManager?: {
    id: string
    name: string
    email: string
  } | null
}

type CaseRow = {
  id: string
  customerId: string
  title?: string | null
  serviceType?: string | null
  status: string
  updatedAt?: Date
  createdAt: Date
  assignedLawyer?: {
    id: string
    name: string
  } | null
}

type QuotationRow = Record<string, unknown>
type InvoiceRow = Record<string, unknown>

type PrismaCustomerClient = {
  findMany(args?: Record<string, unknown>): Promise<CustomerRow[]>
  findUnique(args: Record<string, unknown>): Promise<CustomerRow | null>
  create(args: Record<string, unknown>): Promise<CustomerRow>
  update(args: Record<string, unknown>): Promise<CustomerRow>
}

type PrismaCaseClient = {
  findMany(args?: Record<string, unknown>): Promise<CaseRow[]>
}

type PrismaQuotationClient = {
  findMany(args?: Record<string, unknown>): Promise<QuotationRow[]>
}

type PrismaInvoiceClient = {
  findMany(args?: Record<string, unknown>): Promise<InvoiceRow[]>
}

export interface CustomersPrismaServiceLike {
  customer: PrismaCustomerClient
  case: PrismaCaseClient
  quotation?: PrismaQuotationClient
  invoice?: PrismaInvoiceClient
  document?: { findMany(args?: Record<string, unknown>): Promise<Record<string, unknown>[]> }
  activity?: { findMany(args?: Record<string, unknown>): Promise<Record<string, unknown>[]> }
}

@Injectable()
export class CustomersService {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: CustomersPrismaServiceLike,
  ) {}

  async findAll(filters?: Record<string, unknown>) {
    const rows = await this.prisma.customer.findMany({
      include: {
        wealthManager: {
          select: { id: true, name: true, email: true },
        },
        account: {
          select: { id: true, accountNo: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return rows.filter((row) => this.matchesFilters(row, filters)).map((row) => this.mapCustomer(row))
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } })
    if (!customer) {
      throw new NotFoundException(`Customer ${id} was not found`)
    }
    return this.mapCustomer(customer)
  }

  async create(dto: CreateCustomerDto) {
    try {
      const created = await this.prisma.customer.create({
        data: {
          name: dto.name,
          email: dto.email ?? '',
          phone: dto.phone ?? '',
          tags: dto.tags ?? [],
          accountId: dto.accountId ?? null,
          wealthManagerId: dto.wealthManagerId ?? null,
        },
      })
      return this.mapCustomer(created)
    } catch (error) {
      console.error('Create customer error:', error)
      throw error
    }
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id)
    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.accountId !== undefined ? { accountId: dto.accountId } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
        ...(dto.wealthManagerId !== undefined ? { wealthManagerId: dto.wealthManagerId } : {}),
      },
    })
    return this.mapCustomer(updated)
  }

  async getTab(
    customerId: string,
    tab: 'overview' | 'cases' | 'quotations' | 'invoices' | 'documents' | 'activity',
  ): Promise<any> {
    try {
      switch (tab) {
        case 'overview':
          return await this.prisma.customer.findUnique({
            where: { id: customerId },
            include: {
              account: true,
              wealthManager: {
                select: { id: true, name: true, email: true },
              },
            },
          })
        case 'cases':
          return await this.prisma.case.findMany({
            where: { customerId },
            include: {
              assignedLawyer: {
                select: { id: true, name: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        case 'quotations':
          return await this.prisma.quotation?.findMany({
            where: { lead: { customerId } },
            orderBy: { createdAt: 'desc' },
          }).catch(() => []) ?? []
        case 'invoices':
          return await this.prisma.invoice?.findMany({
            where: { account: { customers: { some: { id: customerId } } } },
            orderBy: { createdAt: 'desc' },
          }).catch(() => []) ?? []
        case 'documents':
          return []
        case 'activity':
          return await this.prisma.case.findMany({
            where: { customerId },
            select: { id: true, title: true, status: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 20,
          })
        default:
          return []
      }
    } catch (error) {
      console.error('getTab error:', error)
      return []
    }
  }

  private buildWhere(filters?: Record<string, unknown>) {
    const where: Record<string, unknown> = {}

    if (filters?.search && typeof filters.search === 'string' && filters.search.trim()) {
      const value = filters.search.trim()
      where.OR = [
        { name: { contains: value, mode: 'insensitive' } },
        { email: { contains: value, mode: 'insensitive' } },
        { phone: { contains: value, mode: 'insensitive' } },
      ]
    }

    if (filters?.wealthManagerId && typeof filters.wealthManagerId === 'string') {
      where.wealthManagerId = filters.wealthManagerId
    }

    if (filters?.tag && typeof filters.tag === 'string') {
      where.tags = { has: filters.tag }
    }

    return where
  }

  private matchesFilters(row: CustomerRow, filters?: Record<string, unknown>) {
    if (!filters) {
      return true
    }

    if (typeof filters.search === 'string' && filters.search.trim()) {
      const value = filters.search.trim().toLowerCase()
      const matchesSearch =
        row.name.toLowerCase().includes(value) ||
        row.email.toLowerCase().includes(value) ||
        row.phone.toLowerCase().includes(value)
      if (!matchesSearch) {
        return false
      }
    }

    if (
      typeof filters.wealthManagerId === 'string' &&
      row.wealthManagerId !== filters.wealthManagerId
    ) {
      return false
    }

    if (typeof filters.tag === 'string' && !row.tags.includes(filters.tag)) {
      return false
    }

    return true
  }

  private mapCustomer(row: CustomerRow) {
    return {
      id: row.id,
      accountId: row.accountId ?? null,
      name: row.name,
      email: row.email,
      phone: row.phone,
      tags: row.tags,
      wealthManagerId: row.wealthManagerId ?? null,
      wealthManager: row.wealthManager ?? null,
      account: row.account ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }
}
