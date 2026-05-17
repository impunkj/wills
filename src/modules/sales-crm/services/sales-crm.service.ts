import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type {
  ApproveQuotationDto,
  AssignLeadToAccountsDto,
  CreateFollowUpDto,
  CreateLeadDto,
  CreateQuotationDto,
  CreateServiceDto,
  ExportLeadsQueryDto,
  ListLeadsQueryDto,
  SendQuotationDto,
  UpdateLeadDto,
  UpdateServiceDto,
} from '../dto'
import { calculateIndianGst } from '../utils/gst-calculator.util'
import { SequenceService } from './sequence.service'

export const PRISMA_SERVICE = Symbol('PRISMA_SERVICE')

type Decimalish = number | { toNumber(): number }

type LeadRow = {
  id: string
  status: string
  assignedAgentId: string | null
  source: string
  metadata: unknown
  name: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  pinCode: string
  company: string | null
  designation: string | null
  serviceInterest: string
  wealthManagerId: string
  wealthManagerName: string
  assignedEmployee: string
  leadType: string
  notes: string | null
  lastActivity: Date | null
  deletedAt: Date | null
  customerId: string | null
  caseId: string | null
  createdAt: Date
  updatedAt: Date
  wealthManager?: {
    id: string
    name: string
    email?: string | null
    role?: string | null
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

type QuotationItemRow = {
  serviceId: string
  serviceName: string
  quantity: number
  unitPrice: number
  amount: number
}

type QuotationRow = {
  id: string
  leadId: string
  referenceNumber: string
  items?: QuotationItemRow[] | null
  subtotal?: Decimalish | null
  taxRate?: Decimalish | null
  taxAmount?: Decimalish | null
  total?: Decimalish | null
  grossAmount: Decimalish
  cgst: Decimalish
  sgst: Decimalish
  netAmount: Decimalish
  status: string
  sentVia?: string | null
  sentAt?: Date | null
  approvedBy: string | null
  approvedAt: Date | null
  createdAt: Date
  updatedAt: Date
  lead?: LeadRow | null
}

type ServiceRow = {
  id: string
  category: string
  name: string
  description: string
  basePrice: Decimalish
  taxRate: Decimalish
  estimatedTAT: string
  documentChecklist: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

type AccountEntryRow = {
  id: string
  leadId: string
  customerId: string
  caseId: string
  status: string
  createdAt: Date
  updatedAt: Date
}

type PrismaLeadClient = {
  findMany(args?: Record<string, unknown>): Promise<LeadRow[]>
  findUnique(args: Record<string, unknown>): Promise<LeadRow | null>
  create(args: Record<string, unknown>): Promise<LeadRow>
  update(args: Record<string, unknown>): Promise<LeadRow>
}

type PrismaFollowUpClient = {
  findMany(args?: Record<string, unknown>): Promise<FollowUpRow[]>
  create(args: Record<string, unknown>): Promise<FollowUpRow>
}

type PrismaCustomerClient = {
  create(args: Record<string, unknown>): Promise<unknown>
}

type PrismaCaseClient = {
  create(args: Record<string, unknown>): Promise<unknown>
}

type PrismaQuotationClient = {
  findMany(args?: Record<string, unknown>): Promise<QuotationRow[]>
  findUnique(args: Record<string, unknown>): Promise<QuotationRow | null>
  create(args: Record<string, unknown>): Promise<QuotationRow>
  update(args: Record<string, unknown>): Promise<QuotationRow>
}

type PrismaServiceCatalogClient = {
  findMany(args?: Record<string, unknown>): Promise<ServiceRow[]>
  create(args: Record<string, unknown>): Promise<ServiceRow>
  update(args: Record<string, unknown>): Promise<ServiceRow>
}

type PrismaAccountEntryClient = {
  create(args: Record<string, unknown>): Promise<AccountEntryRow | unknown>
}

type PrismaUserClient = {
  findMany(args?: Record<string, unknown>): Promise<Array<{
    id: string
    name: string
    email: string
    role: string
  }>>
  findUnique(args: Record<string, unknown>): Promise<{
    id: string
    name: string
    email: string
    role: string
  } | null>
}

type PrismaTransactionalClient = {
  lead: PrismaLeadClient
  followUp?: PrismaFollowUpClient
  customer: PrismaCustomerClient
  case: PrismaCaseClient
  quotation: PrismaQuotationClient
  serviceCatalog?: PrismaServiceCatalogClient
  accountEntry?: PrismaAccountEntryClient
  user?: PrismaUserClient
}

export interface PrismaServiceLike extends PrismaTransactionalClient {
  $transaction<T>(callback: (tx: PrismaTransactionalClient) => Promise<T>): Promise<T>
}

const LEAD_ID_REGEX = /^W24-LEAD-(\d{5})$/
const QUOTATION_REFERENCE_REGEX = /^W24-QT-(\d{4})-(\d{4})$/
const DEFAULT_SELLER_STATE = 'Delhi'

@Injectable()
export class SalesCrmService {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: PrismaServiceLike,
    private readonly sequenceService: SequenceService,
  ) {}

  async findAll(query?: ListLeadsQueryDto) {
    return this.findAllLeads(query)
  }

  async findAllLeads(query?: ListLeadsQueryDto) {
    const where = this.buildLeadWhere(query)
    const [filteredLeads, allActiveLeads, wealthManagers] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lead.findMany({
        where: { deletedAt: null },
      }),
      this.fetchWealthManagerMap(),
    ])

    return {
      leads: filteredLeads.map((lead) => this.mapLeadToFrontend(lead, wealthManagers)),
      statusCounts: this.computeStatusCounts(allActiveLeads),
    }
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    })

    if (!lead || lead.deletedAt) {
      throw new NotFoundException(`Lead ${id} was not found`)
    }

    const [followUps, quotations] = await Promise.all([
      this.prisma.followUp?.findMany({
        where: lead.caseId ? { caseId: lead.caseId } : undefined,
        orderBy: { createdAt: 'desc' },
      }) ?? Promise.resolve([]),
      this.prisma.quotation.findMany({
        where: { leadId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return {
      lead: this.mapLeadToFrontend(lead),
      followUps: followUps.map((followUp) => this.mapFollowUpToFrontend(followUp, lead.id)),
      quotations: quotations.map((quotation) => this.mapQuotationToFrontend(quotation)),
    }
  }

  async create(dto: CreateLeadDto) {
    return this.createLead(dto)
  }

  async createLead(input: CreateLeadDto) {
    const now = new Date()
    const wealthManagerId = input.wealthManagerId ?? input.wealthManager?.wealthManagerId
    if (!wealthManagerId) {
      throw new BadRequestException('wealthManagerId is required')
    }
    const wealthManagerName =
      input.wealthManagerName ??
      input.wealthManager?.wealthManagerName ??
      (await this.prisma.user?.findUnique({ where: { id: wealthManagerId } }))?.name ??
      ''

    const createdLead = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
        },
      })

      const lead = await tx.lead.create({
        data: {
          status: input.status ?? 'new',
          assignedAgentId: input.assignedAgentId ?? null,
          source: input.source,
          metadata: {
            taxContext: input.taxContext ?? null,
          },
          name: input.name,
          phone: input.phone,
          email: input.email,
          address: input.address,
          city: input.city,
          state: input.state,
          pinCode: input.pinCode,
          company: input.company ?? '',
          designation: input.designation ?? '',
          serviceInterest: input.serviceInterest,
          wealthManagerId,
          wealthManagerName,
          assignedEmployee: input.assignedEmployee,
          leadType: input.leadType,
          notes: input.notes ?? '',
          lastActivity: now,
          deletedAt: null,
          customerId: (customer as { id: string }).id,
          caseId: null,
        },
      })

      const createdCase = await tx.case.create({
        data: {
          customerId: (customer as { id: string }).id,
          leadId: lead.id,
          title: input.name,
          serviceType: input.serviceInterest,
          status: 'OPEN',
        },
      })

      return tx.lead.update({
        where: { id: lead.id },
        data: { caseId: (createdCase as { id: string }).id },
      })
    })

    return this.mapLeadToFrontend(createdLead)
  }

  async update(id: string, dto: UpdateLeadDto) {
    return this.updateLead(id, dto)
  }

  async updateLead(id: string, input: UpdateLeadDto) {
    const existingLead = await this.prisma.lead.findUnique({
      where: { id },
    })

    if (!existingLead || existingLead.deletedAt) {
      throw new NotFoundException(`Lead ${id} was not found`)
    }

    const wealthManagerId = input.wealthManagerId ?? input.wealthManager?.wealthManagerId
    const wealthManagerName =
      input.wealthManagerName ??
      input.wealthManager?.wealthManagerName ??
      (wealthManagerId
        ? (await this.prisma.user?.findUnique({ where: { id: wealthManagerId } }))?.name
        : undefined)

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(input.source !== undefined ? { source: input.source } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.state !== undefined ? { state: input.state } : {}),
        ...(input.pinCode !== undefined ? { pinCode: input.pinCode } : {}),
        ...(input.company !== undefined ? { company: input.company } : {}),
        ...(input.designation !== undefined ? { designation: input.designation } : {}),
        ...(input.serviceInterest !== undefined ? { serviceInterest: input.serviceInterest } : {}),
        ...(input.assignedEmployee !== undefined ? { assignedEmployee: input.assignedEmployee } : {}),
        ...(input.assignedAgentId !== undefined ? { assignedAgentId: input.assignedAgentId } : {}),
        ...(input.leadType !== undefined ? { leadType: input.leadType } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(wealthManagerId
          ? {
              wealthManagerId,
              wealthManagerName: wealthManagerName ?? existingLead.wealthManagerName,
            }
          : {}),
        ...(input.taxContext !== undefined
          ? {
              metadata: {
                ...(this.readJsonObject(existingLead.metadata) ?? {}),
                taxContext: input.taxContext,
              },
            }
          : {}),
        lastActivity: new Date(),
      },
    })

    const wealthManagers = await this.fetchWealthManagerMap()
    return this.mapLeadToFrontend(updatedLead, wealthManagers)
  }

  async remove(id: string) {
    const existingLead = await this.prisma.lead.findUnique({
      where: { id },
    })

    if (!existingLead || existingLead.deletedAt) {
      throw new NotFoundException(`Lead ${id} was not found`)
    }

    const deletedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return this.mapLeadToFrontend(deletedLead)
  }

  async getStatusCounts() {
    const leads = await this.prisma.lead.findMany({
      where: { deletedAt: null },
    })

    return this.computeStatusCounts(leads)
  }

  async addFollowUp(leadId: string, dto: CreateFollowUpDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead || lead.deletedAt) {
      throw new NotFoundException(`Lead ${leadId} was not found`)
    }
    if (!lead.caseId) {
      throw new BadRequestException(`Lead ${leadId} is not linked to a case yet`)
    }

    if (!this.prisma.followUp) {
      throw new BadRequestException('Follow-up persistence is not configured')
    }

    const createdFollowUp = await this.prisma.followUp.create({
      data: {
        caseId: lead.caseId,
        action: dto.title,
        serviceType: lead.serviceInterest,
        scheduledAt: dto.nextActionDate ? new Date(dto.nextActionDate) : new Date(),
        completedAt: null,
      },
    })

    await this.prisma.lead.update({
      where: { id: leadId },
      data: { lastActivity: new Date() },
    })

    return this.mapFollowUpToFrontend(createdFollowUp, leadId)
  }

  async createQuotation(leadId: string, dto: CreateQuotationDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead || lead.deletedAt) {
      throw new NotFoundException(`Lead ${leadId} was not found`)
    }

    const items = dto.items.map((item) => ({
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: this.roundCurrency(item.quantity * item.unitPrice),
    }))
    const subtotal = this.roundCurrency(items.reduce((sum, item) => sum + item.amount, 0))
    const taxRate = dto.taxRateOverride ?? 18
    const taxContext =
      this.readJsonObject(lead.metadata)?.taxContext as
        | { sellerState?: string; customerState?: string }
        | undefined
    const gst = calculateIndianGst({
      taxableAmount: subtotal,
      sellerState: taxContext?.sellerState ?? DEFAULT_SELLER_STATE,
      customerState: taxContext?.customerState ?? lead.state,
      totalRate: taxRate,
    })

    const quotation = await this.prisma.quotation.create({
      data: {
        leadId,
        referenceNumber: await this.nextQuotationReference(),
        items,
        subtotal,
        taxRate,
        taxAmount: gst.totalTaxAmount,
        total: gst.grossAmount,
        grossAmount: subtotal,
        cgst: gst.cgstAmount,
        sgst: gst.sgstAmount,
        netAmount: gst.grossAmount,
        status: 'draft',
        sentVia: null,
        sentAt: null,
        approvedBy: null,
        approvedAt: null,
      },
    })

    return this.mapQuotationToFrontend(quotation)
  }

  async sendQuotation(id: string, via: SendQuotationDto['via']) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
    })

    if (!quotation) {
      throw new NotFoundException(`Quotation ${id} was not found`)
    }

    const updatedQuotation = await this.prisma.$transaction(async (tx) => {
      const savedQuotation = await tx.quotation.update({
        where: { id },
        data: {
          status: 'sent',
          sentVia: via,
          sentAt: new Date(),
        },
      })

      await tx.lead.update({
        where: { id: quotation.leadId },
        data: {
          status: 'quotation-sent',
          lastActivity: new Date(),
        },
      })

      return savedQuotation
    })

    return this.mapQuotationToFrontend(updatedQuotation)
  }

  async approveCustomQuotation(id: string, input: ApproveQuotationDto) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        lead: true,
      },
    })

    if (!quotation || !quotation.lead) {
      throw new NotFoundException(`Quotation ${id} was not found`)
    }

    const taxableAmount =
      quotation.subtotal !== null && quotation.subtotal !== undefined
        ? this.decimalToNumber(quotation.subtotal)
        : this.decimalToNumber(quotation.grossAmount)
    const taxRate =
      quotation.taxRate !== null && quotation.taxRate !== undefined
        ? this.decimalToNumber(quotation.taxRate)
        : 18
    const taxContext =
      this.readJsonObject(quotation.lead.metadata)?.taxContext as
        | { sellerState?: string; customerState?: string }
        | undefined

    const gst = calculateIndianGst({
      taxableAmount,
      sellerState: taxContext?.sellerState ?? DEFAULT_SELLER_STATE,
      customerState: taxContext?.customerState ?? quotation.lead.state,
      totalRate: taxRate,
    })

    const updatedQuotation = await this.prisma.quotation.update({
      where: { id },
      data: {
        subtotal: taxableAmount,
        taxRate,
        taxAmount: gst.totalTaxAmount,
        total: gst.grossAmount,
        grossAmount: taxableAmount,
        cgst: gst.cgstAmount,
        sgst: gst.sgstAmount,
        netAmount: gst.grossAmount,
        status: 'accepted',
        approvedBy: input.approvedBy,
        approvedAt: new Date(),
      },
    })

    return this.mapQuotationToFrontend(updatedQuotation)
  }

  async bulkImport(dto: { records: CreateLeadDto[] }) {
    const created = []
    for (const record of dto.records) {
      created.push(await this.createLead(record))
    }

    return {
      importedCount: created.length,
      leads: created,
    }
  }

  async bulkExport(query?: ExportLeadsQueryDto) {
    const result = await this.findAllLeads(query)
    return {
      format: query?.format ?? 'csv',
      exportedCount: result.leads.length,
      leads: result.leads,
    }
  }

  async createService(dto: CreateServiceDto) {
    if (!this.prisma.serviceCatalog) {
      throw new BadRequestException('Service catalog persistence is not configured')
    }

    const created = await this.prisma.serviceCatalog.create({
      data: {
        category: dto.category,
        name: dto.name,
        description: dto.description,
        basePrice: dto.basePrice,
        taxRate: dto.taxRate,
        estimatedTAT: dto.estimatedTAT,
        documentChecklist: dto.documentChecklist,
        isActive: dto.isActive ?? true,
      },
    })

    return this.mapServiceToFrontend(created)
  }

  async updateService(id: string, dto: UpdateServiceDto) {
    if (!this.prisma.serviceCatalog) {
      throw new BadRequestException('Service catalog persistence is not configured')
    }

    const updated = await this.prisma.serviceCatalog.update({
      where: { id },
      data: {
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.basePrice !== undefined ? { basePrice: dto.basePrice } : {}),
        ...(dto.taxRate !== undefined ? { taxRate: dto.taxRate } : {}),
        ...(dto.estimatedTAT !== undefined ? { estimatedTAT: dto.estimatedTAT } : {}),
        ...(dto.documentChecklist !== undefined
          ? { documentChecklist: dto.documentChecklist }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    })

    return this.mapServiceToFrontend(updated)
  }

  async assignToAccount(leadId: string, dto?: AssignLeadToAccountsDto) {
    const existingLead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    })

    if (!existingLead || existingLead.deletedAt) {
      throw new NotFoundException(`Lead ${leadId} was not found`)
    }

    const customerId = existingLead.customerId ?? dto?.customerId ?? (await this.sequenceService.nextCustomerId())
    const caseId = existingLead.caseId ?? dto?.caseId ?? (await this.sequenceService.nextCaseId())

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: {
          status: 'invoice-sent',
          customerId,
          caseId,
          lastActivity: new Date(),
        },
      })

      const accountEntry = tx.accountEntry
        ? await tx.accountEntry.create({
            data: {
              leadId,
              customerId,
              caseId,
              status: 'invoice-sent',
            },
          })
        : {
            id: `ACC-${leadId}`,
            leadId,
            customerId,
            caseId,
            status: 'invoice-sent',
            createdAt: new Date(),
            updatedAt: new Date(),
          }

      return {
        lead: updatedLead,
        accountEntry,
      }
    })

    return {
      lead: this.mapLeadToFrontend(result.lead),
      accountEntry: result.accountEntry,
    }
  }

  private async nextLeadId() {
    const leads = await this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const max = leads.reduce((highest, lead) => {
      const match = LEAD_ID_REGEX.exec(lead.id)
      if (!match) {
        return highest
      }

      return Math.max(highest, Number.parseInt(match[1], 10))
    }, 0)

    return `W24-LEAD-${String(max + 1).padStart(5, '0')}`
  }

  private async nextQuotationReference() {
    const quotations = await this.prisma.quotation.findMany({
      orderBy: { createdAt: 'desc' },
    })
    const year = new Date().getUTCFullYear()
    const max = quotations.reduce((highest, quotation) => {
      const match = QUOTATION_REFERENCE_REGEX.exec(quotation.referenceNumber)
      if (!match || Number.parseInt(match[1], 10) !== year) {
        return highest
      }

      return Math.max(highest, Number.parseInt(match[2], 10))
    }, 0)

    return `W24-QT-${year}-${String(max + 1).padStart(4, '0')}`
  }

  private async nextQuotationId() {
    const quotations = await this.prisma.quotation.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return `W24-QT-${String(quotations.length + 1).padStart(5, '0')}`
  }

  private async nextFollowUpId(caseId: string) {
    const followUps =
      (await this.prisma.followUp?.findMany({
        where: { caseId },
      })) ?? []
    return `FU-${String(followUps.length + 1).padStart(3, '0')}`
  }

  private async nextServiceId() {
    const services = (await this.prisma.serviceCatalog?.findMany()) ?? []
    return `SVC-${String(services.length + 1).padStart(3, '0')}`
  }

  private buildLeadWhere(query?: ListLeadsQueryDto) {
    const where: Record<string, unknown> = {
      deletedAt: null,
    }

    if (query?.status) where.status = query.status
    if (query?.source) where.source = query.source
    if (query?.wealthManagerId) where.wealthManagerId = query.wealthManagerId
    if (query?.assignedEmployee) where.assignedEmployee = query.assignedEmployee

    if (query?.startDate || query?.endDate) {
      where.createdAt = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      }
    }

    if (query?.search?.trim()) {
      const search = query.search.trim()
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { serviceInterest: { contains: search, mode: 'insensitive' } },
        { wealthManagerName: { contains: search, mode: 'insensitive' } },
      ]
    }

    return where
  }

  private computeStatusCounts(leads: LeadRow[]) {
    return {
      all: leads.length,
      new: leads.filter((lead) => lead.status === 'new').length,
      assigned: leads.filter((lead) => lead.status === 'assigned').length,
      'follow-up': leads.filter((lead) => lead.status === 'follow-up').length,
      'quotation-sent': leads.filter((lead) => lead.status === 'quotation-sent').length,
      projected: leads.filter((lead) => lead.status === 'projected').length,
      'invoice-sent': leads.filter((lead) => lead.status === 'invoice-sent').length,
      won: leads.filter((lead) => lead.status === 'won').length,
      lost: leads.filter((lead) => lead.status === 'lost').length,
    }
  }

  private async fetchWealthManagerMap() {
    if (!this.prisma.user) {
      return new Map<string, { id: string; name: string; email: string; role: string }>()
    }

    const users = await this.prisma.user.findMany({
      where: { role: 'WEALTH_MANAGER' },
      select: { id: true, name: true, email: true, role: true },
    })

    return new Map(users.map((user) => [user.id, user]))
  }

  private mapLeadToFrontend(
    lead: LeadRow,
    wealthManagers = new Map<string, { id: string; name: string; email: string; role: string }>(),
  ) {
    const wealthManager =
      lead.wealthManager ??
      wealthManagers.get(lead.wealthManagerId) ?? {
        id: lead.wealthManagerId,
        name: lead.wealthManagerName,
        email: '',
        role: 'WEALTH_MANAGER',
      }

    return {
      id: lead.id,
      source: lead.source,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      pinCode: lead.pinCode,
      company: lead.company ?? '',
      designation: lead.designation ?? '',
      serviceInterest: lead.serviceInterest,
      wealthManagerId: lead.wealthManagerId,
      wealthManagerName: lead.wealthManagerName,
      wealthManager,
      assignedEmployee: lead.assignedEmployee,
      assignedAgentId: lead.assignedAgentId,
      leadType: lead.leadType,
      status: lead.status,
      notes: lead.notes ?? '',
      lastActivity: (lead.lastActivity ?? lead.updatedAt).toISOString(),
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      deletedAt: lead.deletedAt?.toISOString() ?? null,
      customerId: lead.customerId,
      caseId: lead.caseId,
      metadata: lead.metadata ?? null,
    }
  }

  private mapFollowUpToFrontend(followUp: FollowUpRow, leadId: string) {
    return {
      id: followUp.id,
      leadId,
      type: 'call',
      title: followUp.action,
      notes: followUp.action,
      author: 'Wills24 Admin',
      priority: 'medium',
      nextActionDate: followUp.scheduledAt.toISOString(),
      meetingDate: undefined,
      meetingLocation: undefined,
      quotationRef: undefined,
      caseId: followUp.caseId,
      createdAt: followUp.createdAt.toISOString(),
    }
  }

  private mapQuotationToFrontend(quotation: QuotationRow) {
    const subtotal =
      quotation.subtotal !== null && quotation.subtotal !== undefined
        ? this.decimalToNumber(quotation.subtotal)
        : this.decimalToNumber(quotation.grossAmount)
    const taxAmount =
      quotation.taxAmount !== null && quotation.taxAmount !== undefined
        ? this.decimalToNumber(quotation.taxAmount)
        : this.roundCurrency(this.decimalToNumber(quotation.netAmount) - subtotal)
    const total =
      quotation.total !== null && quotation.total !== undefined
        ? this.decimalToNumber(quotation.total)
        : this.decimalToNumber(quotation.netAmount)
    const taxRate =
      quotation.taxRate !== null && quotation.taxRate !== undefined
        ? this.decimalToNumber(quotation.taxRate)
        : subtotal > 0
          ? this.roundCurrency((taxAmount / subtotal) * 100)
          : 0

    return {
      id: quotation.id,
      leadId: quotation.leadId,
      referenceNumber: quotation.referenceNumber,
      items: quotation.items ?? [],
      subtotal,
      taxRate,
      taxAmount,
      total,
      grossAmount: this.decimalToNumber(quotation.grossAmount),
      cgst: this.decimalToNumber(quotation.cgst),
      sgst: this.decimalToNumber(quotation.sgst),
      netAmount: this.decimalToNumber(quotation.netAmount),
      status: quotation.status,
      sentVia: quotation.sentVia ?? null,
      sentAt: quotation.sentAt?.toISOString() ?? null,
      approvedBy: quotation.approvedBy,
      approvedAt: quotation.approvedAt?.toISOString() ?? null,
      createdAt: quotation.createdAt.toISOString(),
      updatedAt: quotation.updatedAt.toISOString(),
    }
  }

  private mapServiceToFrontend(service: ServiceRow) {
    return {
      id: service.id,
      category: service.category,
      name: service.name,
      description: service.description,
      basePrice: this.decimalToNumber(service.basePrice),
      taxRate: this.decimalToNumber(service.taxRate),
      estimatedTAT: service.estimatedTAT,
      documentChecklist: service.documentChecklist,
      isActive: service.isActive,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    }
  }

  private decimalToNumber(value: Decimalish) {
    return typeof value === 'number' ? value : value.toNumber()
  }

  private readJsonObject(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null
    }

    return value as Record<string, unknown>
  }

  private roundCurrency(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
  }
}
