import 'reflect-metadata'
import { BadRequestException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SequenceService } from '../../sales-crm/services/sequence.service'
import { AccountsService, type AccountsPrismaServiceLike } from '../accounts.service'

describe('AccountsService', () => {
  let prisma: AccountsPrismaServiceLike
  let service: AccountsService
  let accounts: Array<Record<string, unknown>>
  let invoices: Array<Record<string, unknown>>
  let payments: Array<Record<string, unknown>>
  let creditNotes: Array<Record<string, unknown>>
  let leads: Array<Record<string, unknown>>

  beforeEach(() => {
    accounts = [
      {
        id: 'acc-1',
        accountNo: 'W24-CUST-00001',
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        phone: '+919999999999',
        state: 'Delhi',
        gstType: 'CGST_SGST',
        wealthManagerId: 'WM-001',
        convertedFromId: 'W24-LEAD-00001',
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-01T00:00:00.000Z'),
      },
    ]

    invoices = [
      {
        id: 'inv-1',
        invoiceNo: 'INV-001',
        accountId: 'acc-1',
        amount: 1000,
        paidAmount: 0,
        status: 'UNPAID',
        dueDate: new Date('2026-05-30T00:00:00.000Z'),
        createdAt: new Date('2026-05-02T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
      },
      {
        id: 'inv-2',
        invoiceNo: 'INV-002',
        accountId: 'acc-1',
        amount: 750,
        paidAmount: 0,
        status: 'UNPAID',
        dueDate: new Date('2026-05-28T00:00:00.000Z'),
        createdAt: new Date('2026-05-03T00:00:00.000Z'),
        updatedAt: new Date('2026-05-03T00:00:00.000Z'),
      },
    ]

    payments = []
    creditNotes = []
    leads = [
      {
        id: 'W24-LEAD-00099',
        name: 'Anita Desai',
        email: 'anita@example.com',
        phone: '+919888888888',
        state: 'Maharashtra',
        wealthManagerId: 'WM-002',
      },
    ]

    const accountClient = {
      count: vi.fn(async () => accounts.length),
      findMany: vi.fn(async () => accounts as never),
      findUnique: vi.fn(async ({ where }: Record<string, unknown>) => {
        const id = (where as { id: string }).id
        return (accounts.find((account) => account.id === id) as never) ?? null
      }),
      create: vi.fn(async ({ data }: Record<string, unknown>) => {
        const now = new Date()
        const row = {
          id: `acc-${accounts.length + 1}`,
          ...(data as Record<string, unknown>),
          createdAt: now,
          updatedAt: now,
        }
        accounts.push(row)
        return row as never
      }),
      update: vi.fn(async ({ where, data }: Record<string, unknown>) => {
        const row = accounts.find((account) => account.id === (where as { id: string }).id)
        if (!row) {
          throw new Error('Account not found')
        }
        Object.assign(row, data, { updatedAt: new Date() })
        return row as never
      }),
    }

    const invoiceClient = {
      findMany: vi.fn(async () => invoices as never),
      findUnique: vi.fn(async ({ where }: Record<string, unknown>) => {
        const id = (where as { id: string }).id
        return (invoices.find((invoice) => invoice.id === id) as never) ?? null
      }),
      update: vi.fn(async ({ where, data }: Record<string, unknown>) => {
        const row = invoices.find((invoice) => invoice.id === (where as { id: string }).id)
        if (!row) {
          throw new Error('Invoice not found')
        }
        Object.assign(row, data, { updatedAt: new Date() })
        return row as never
      }),
    }

    const paymentClient = {
      findMany: vi.fn(async ({ where }: Record<string, unknown>) => {
        const invoiceId = (where as { invoiceId?: string })?.invoiceId
        return payments.filter((payment) => payment.invoiceId === invoiceId) as never
      }),
      create: vi.fn(async ({ data }: Record<string, unknown>) => {
        const row = {
          id: `pay-${payments.length + 1}`,
          ...(data as Record<string, unknown>),
        }
        payments.push(row)
        return row as never
      }),
    }

    const creditNoteClient = {
      findMany: vi.fn(async ({ where }: Record<string, unknown>) => {
        const invoiceId = (where as { invoiceId?: string })?.invoiceId
        return creditNotes.filter((creditNote) => creditNote.invoiceId === invoiceId) as never
      }),
      findUnique: vi.fn(async ({ where }: Record<string, unknown>) => {
        const id = (where as { id: string }).id
        return (creditNotes.find((creditNote) => creditNote.id === id) as never) ?? null
      }),
      create: vi.fn(async ({ data }: Record<string, unknown>) => {
        const row = {
          id: `cn-${creditNotes.length + 1}`,
          ...(data as Record<string, unknown>),
        }
        creditNotes.push(row)
        return row as never
      }),
      update: vi.fn(async ({ where, data }: Record<string, unknown>) => {
        const row = creditNotes.find((creditNote) => creditNote.id === (where as { id: string }).id)
        if (!row) {
          throw new Error('Credit note not found')
        }
        Object.assign(row, data)
        return row as never
      }),
    }

    const leadClient = {
      findUnique: vi.fn(async ({ where }: Record<string, unknown>) => {
        const id = (where as { id: string }).id
        return (leads.find((lead) => lead.id === id) as never) ?? null
      }),
    }

    prisma = {
      account: accountClient,
      invoice: invoiceClient,
      payment: paymentClient,
      creditNote: creditNoteClient,
      lead: leadClient,
      $transaction: vi.fn(async (callback) =>
        callback({
          account: accountClient,
          invoice: invoiceClient,
          payment: paymentClient,
          creditNote: creditNoteClient,
          lead: leadClient,
        }),
      ),
    } as AccountsPrismaServiceLike

    const sequenceService = new SequenceService()
    sequenceService.initializeCounter('customer', 1)

    service = new AccountsService(prisma, sequenceService)
  })

  it('recordPayment sets status PARTIAL when amount < total', async () => {
    const result = await service.recordPayment('inv-1', 400, 'Tester')

    expect(result.invoice.status).toBe('PARTIAL')
    expect(result.invoice.paidAmount).toBe(400)
  })

  it('recordPayment sets status PAID when amount >= total', async () => {
    const result = await service.recordPayment('inv-1', 1000, 'Tester')

    expect(result.invoice.status).toBe('PAID')
    expect(result.invoice.paidAmount).toBe(1000)
  })

  it('W24-CUST-XXXXX IDs are unique across concurrent creates', async () => {
    const created = await Promise.all([
      service.create({ name: 'Asha', state: 'Delhi' }),
      service.create({ name: 'Bharat', state: 'Karnataka' }),
      service.create({ name: 'Charu', state: 'Delhi' }),
    ])

    const accountNos = created.map((item) => item.accountNo)
    expect(new Set(accountNos).size).toBe(3)
    expect(accountNos.every((accountNo) => /^W24-CUST-\d{5}$/.test(accountNo))).toBe(true)
  })

  it('refund chain throws if CreditNote is attempted before payment', async () => {
    await expect(
      service.createCreditNote('inv-2', { amount: 100, reason: 'Duplicate charge' }),
    ).rejects.toThrow(BadRequestException)
  })

  it('approveRefund sets approvedAt timestamp and approvedBy', async () => {
    await service.recordPayment('inv-1', 1000, 'Tester')
    const creditNote = await service.createCreditNote('inv-1', {
      amount: 200,
      reason: 'Customer requested refund',
    })

    const approved = await service.approveRefund(creditNote.id, 'Approver User')

    expect(approved.approvedBy).toBe('Approver User')
    expect(approved.approvedAt).not.toBeNull()
  })
})
