import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PRISMA_SERVICE } from '../sales-crm/services/sales-crm.service'
import { SequenceService } from '../sales-crm/services/sequence.service'
import { CreateAccountDto } from './dto/create-account.dto'
import { CreateCreditNoteDto } from './dto/create-credit-note.dto'
import { UpdateAccountDto } from './dto/update-account.dto'

type Decimalish = number | { toNumber(): number }

type AccountRow = {
  id: string
  accountNo: string
  name: string
  email?: string | null
  phone?: string | null
  state?: string | null
  gstType?: 'IGST' | 'CGST_SGST' | 'EXEMPT' | null
  wealthManagerId?: string | null
  convertedFromId?: string | null
  createdAt: Date
  updatedAt: Date
  wealthManager?: {
    id: string
    name: string
    email: string
  } | null
  invoices?: InvoiceRow[]
  customers?: Array<{
    id: string
    name: string
    email: string
  }>
  _count?: {
    invoices: number
    customers: number
  }
}

type InvoiceRow = {
  id: string
  invoiceNo: string
  accountId: string
  amount: Decimalish
  paidAmount: Decimalish
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'REFUNDED'
  dueDate: Date
  createdAt: Date
  updatedAt: Date
}

type PaymentRow = {
  id: string
  invoiceId: string
  amount: Decimalish
  paidAt: Date
  recordedBy: string
}

type CreditNoteRow = {
  id: string
  invoiceId: string
  amount: Decimalish
  reason: string
  approvedAt?: Date | null
  approvedBy?: string | null
  createdAt: Date
}

type LeadRow = {
  id: string
  name: string
  email: string
  phone: string
  state?: string | null
  wealthManagerId?: string | null
}

type PrismaAccountClient = {
  count(args?: Record<string, unknown>): Promise<number>
  findMany(args?: Record<string, unknown>): Promise<AccountRow[]>
  findUnique(args: Record<string, unknown>): Promise<AccountRow | null>
  create(args: Record<string, unknown>): Promise<AccountRow>
  update(args: Record<string, unknown>): Promise<AccountRow>
}

type PrismaInvoiceClient = {
  findMany(args?: Record<string, unknown>): Promise<InvoiceRow[]>
  findUnique(args: Record<string, unknown>): Promise<InvoiceRow | null>
  update(args: Record<string, unknown>): Promise<InvoiceRow>
}

type PrismaPaymentClient = {
  findMany(args?: Record<string, unknown>): Promise<PaymentRow[]>
  create(args: Record<string, unknown>): Promise<PaymentRow>
}

type PrismaCreditNoteClient = {
  findMany(args?: Record<string, unknown>): Promise<CreditNoteRow[]>
  findUnique(args: Record<string, unknown>): Promise<CreditNoteRow | null>
  create(args: Record<string, unknown>): Promise<CreditNoteRow>
  update(args: Record<string, unknown>): Promise<CreditNoteRow>
}

type PrismaLeadClient = {
  findUnique(args: Record<string, unknown>): Promise<LeadRow | null>
}

type PrismaUserClient = {
  findMany(args?: Record<string, unknown>): Promise<Array<{
    id: string
    name: string
    email: string
  }>>
}

type PrismaTransactionalClient = {
  account: PrismaAccountClient
  invoice: PrismaInvoiceClient
  payment: PrismaPaymentClient
  creditNote: PrismaCreditNoteClient
  lead: PrismaLeadClient
  user?: PrismaUserClient
}

export interface AccountsPrismaServiceLike extends PrismaTransactionalClient {
  $transaction<T>(callback: (tx: PrismaTransactionalClient) => Promise<T>): Promise<T>
}

@Injectable()
export class AccountsService {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: AccountsPrismaServiceLike,
    private readonly sequenceService: SequenceService,
  ) {}

  async findAll(filters?: Record<string, unknown>) {
    const rows = (await this.prisma.account.findMany({
      where: this.buildAccountWhere(filters),
      include: {
        invoices: {
          select: {
            id: true,
            invoiceNo: true,
            amount: true,
            paidAmount: true,
            status: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        customers: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { invoices: true, customers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })) as AccountRow[]

    const wealthManagers = await this.fetchWealthManagerMap(
      rows.map((row) => row.wealthManagerId).filter((value): value is string => Boolean(value)),
    )

    return rows.map((row) => this.mapAccount(row, wealthManagers))
  }

  async findOne(id: string) {
    const account = (await this.prisma.account.findUnique({
      where: { id },
      include: {
        invoices: {
          include: {
            payments: true,
            creditNotes: true,
          },
        },
        customers: true,
      },
    })) as AccountRow | null
    if (!account) {
      throw new NotFoundException(`Account ${id} was not found`)
    }

    const wealthManagers = await this.fetchWealthManagerMap(
      account.wealthManagerId ? [account.wealthManagerId] : [],
    )

    return this.mapAccount(account, wealthManagers)
  }

  async create(dto: CreateAccountDto) {
    try {
      await this.primeAccountSequence()
      const accountNo = await this.sequenceService.nextCustomerId()

      const created = await this.prisma.account.create({
        data: {
          accountNo,
          name: dto.name,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          state: dto.state ?? null,
          gstType:
            (dto.gstType as 'IGST' | 'CGST_SGST' | 'EXEMPT' | undefined) ??
            this.autoSetGSTType(dto),
          wealthManagerId: dto.wealthManagerId ?? null,
          convertedFromId: dto.convertedFromId ?? null,
        },
      })

      return this.mapAccount(created as AccountRow)
    } catch (error) {
      console.error('Create account error:', error)
      throw error
    }
  }

  async update(id: string, dto: UpdateAccountDto) {
    try {
      return await this.prisma.account.update({
        where: { id },
        data: {
          name: dto.name,
          email: dto.email ?? undefined,
          phone: dto.phone ?? undefined,
          gstType: (dto.gstType as 'IGST' | 'CGST_SGST' | 'EXEMPT' | undefined) ?? undefined,
          wealthManagerId: dto.wealthManagerId ?? undefined,
        },
      }).then((row) => this.mapAccount(row as AccountRow))
    } catch (error) {
      console.error('Update account error:', error)
      throw error
    }
  }

  async recordPayment(invoiceId: string, amount: number, recordedBy = 'system') {
    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero')
    }

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } })
      if (!invoice) {
        throw new NotFoundException(`Invoice ${invoiceId} was not found`)
      }

      const totalAmount = this.toNumber(invoice.amount)
      const paidAmount = this.toNumber(invoice.paidAmount)
      const remaining = this.roundCurrency(totalAmount - paidAmount)

      if (amount > remaining) {
        throw new BadRequestException('Payment amount cannot exceed the outstanding balance')
      }

      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount,
          recordedBy,
          paidAt: new Date(),
        },
      })

      const nextPaidAmount = this.roundCurrency(paidAmount + amount)
      const nextStatus = nextPaidAmount < totalAmount ? 'PARTIAL' : 'PAID'
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: nextPaidAmount,
          status: nextStatus,
        },
      })

      return {
        payment: this.mapPayment(payment),
        invoice: this.mapInvoice(updatedInvoice),
      }
    })
  }

  autoSetGSTType(accountData: { state?: string | null; gstType?: string | null; isGstExempt?: boolean }) {
    if (accountData.gstType === 'EXEMPT' || accountData.isGstExempt) {
      return 'EXEMPT' as const
    }

    if (!accountData.state) {
      return 'EXEMPT' as const
    }

    return normalizeState(accountData.state) === normalizeState('Delhi') ? 'CGST_SGST' : 'IGST'
  }

  async convertFromLead(leadId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } })
    if (!lead) {
      throw new NotFoundException(`Lead ${leadId} was not found`)
    }

    return this.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      state: lead.state ?? undefined,
      wealthManagerId: lead.wealthManagerId ?? undefined,
      convertedFromId: leadId,
    })
  }

  async createCreditNote(invoiceId: string, dto: CreateCreditNoteDto) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} was not found`)
    }

    const payments = await this.prisma.payment.findMany({ where: { invoiceId } })
    if (payments.length === 0) {
      throw new BadRequestException('Payment must be recorded before a credit note can be created')
    }

    const created = await this.prisma.creditNote.create({
      data: {
        invoiceId,
        amount: dto.amount,
        reason: dto.reason,
        createdAt: new Date(),
      },
    })

    return this.mapCreditNote(created)
  }

  async approveRefund(creditNoteId: string, approvedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const creditNote = await tx.creditNote.findUnique({ where: { id: creditNoteId } })
      if (!creditNote) {
        throw new NotFoundException(`Credit note ${creditNoteId} was not found`)
      }

      const payments = await tx.payment.findMany({ where: { invoiceId: creditNote.invoiceId } })
      if (payments.length === 0) {
        throw new BadRequestException('Payment must exist before the refund can be approved')
      }

      const updatedCreditNote = await tx.creditNote.update({
        where: { id: creditNoteId },
        data: {
          approvedAt: new Date(),
          approvedBy,
        },
      })

      await tx.invoice.update({
        where: { id: creditNote.invoiceId },
        data: {
          status: 'REFUNDED',
        },
      })

      return this.mapCreditNote(updatedCreditNote)
    })
  }

  getAgingBucket(invoice: { dueDate: Date | string }) {
    const dueDate = invoice.dueDate instanceof Date ? invoice.dueDate : new Date(invoice.dueDate)
    const now = new Date()
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / 86400000)

    if (diffDays < 0) {
      return 'overdue' as const
    }
    if (diffDays <= 7) {
      return 'due-soon' as const
    }
    return 'current' as const
  }

  private async primeAccountSequence() {
    const accounts = await this.prisma.account.findMany()
    this.sequenceService.reserveFromExisting(
      'customer',
      accounts.map((account) => account.accountNo),
    )
  }

  private buildAccountWhere(filters?: Record<string, unknown>) {
    const where: Record<string, unknown> = {}
    if (!filters) {
      return where
    }

    if (typeof filters.accountNo === 'string') {
      where.accountNo = filters.accountNo
    }
    if (typeof filters.wealthManagerId === 'string') {
      where.wealthManagerId = filters.wealthManagerId
    }
    if (typeof filters.gstType === 'string') {
      where.gstType = filters.gstType
    }
    if (typeof filters.search === 'string' && filters.search.trim()) {
      const search = filters.search.trim().toLowerCase()
      where.OR = [
        { accountNo: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    return where
  }

  private async fetchWealthManagerMap(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids))
    if (uniqueIds.length === 0 || !this.prisma.user) {
      return new Map<string, { id: string; name: string; email: string }>()
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, name: true, email: true },
    })

    return new Map(users.map((user) => [user.id, user]))
  }

  private mapAccount(
    row: AccountRow,
    wealthManagers = new Map<string, { id: string; name: string; email: string }>(),
  ) {
    const wealthManager =
      row.wealthManager ??
      (row.wealthManagerId ? wealthManagers.get(row.wealthManagerId) ?? null : null)

    return {
      id: row.id,
      accountNo: row.accountNo,
      name: row.name,
      email: row.email ?? null,
      phone: row.phone ?? null,
      state: row.state ?? null,
      gstType: row.gstType ?? null,
      wealthManagerId: row.wealthManagerId ?? null,
      wealthManager,
      convertedFromId: row.convertedFromId ?? null,
      invoices: (row.invoices ?? []).map((invoice) => this.mapInvoice(invoice)),
      customers: row.customers ?? [],
      _count: row._count ?? {
        invoices: row.invoices?.length ?? 0,
        customers: row.customers?.length ?? 0,
      },
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  private mapInvoice(row: InvoiceRow) {
    return {
      id: row.id,
      invoiceNo: row.invoiceNo,
      accountId: row.accountId,
      amount: this.toNumber(row.amount),
      paidAmount: this.toNumber(row.paidAmount),
      status: row.status,
      dueDate: row.dueDate.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      agingBucket: this.getAgingBucket(row),
    }
  }

  private mapPayment(row: PaymentRow) {
    return {
      id: row.id,
      invoiceId: row.invoiceId,
      amount: this.toNumber(row.amount),
      paidAt: row.paidAt.toISOString(),
      recordedBy: row.recordedBy,
    }
  }

  private mapCreditNote(row: CreditNoteRow) {
    return {
      id: row.id,
      invoiceId: row.invoiceId,
      amount: this.toNumber(row.amount),
      reason: row.reason,
      approvedAt: row.approvedAt?.toISOString() ?? null,
      approvedBy: row.approvedBy ?? null,
      createdAt: row.createdAt.toISOString(),
    }
  }

  private toNumber(value: Decimalish) {
    return typeof value === 'number' ? value : value.toNumber()
  }

  private roundCurrency(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
  }
}

function normalizeState(value: string) {
  return value.trim().toLowerCase()
}
