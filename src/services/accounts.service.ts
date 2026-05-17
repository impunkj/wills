import { api } from '@/lib/api'

export interface AccountFilters {
  accountNo?: string
  wealthManagerId?: string
  gstType?: 'IGST' | 'CGST_SGST' | 'EXEMPT'
  search?: string
}

export interface AccountRecord {
  id: string
  accountNo: string
  name: string
  email: string | null
  phone: string | null
  state: string | null
  gstType: 'IGST' | 'CGST_SGST' | 'EXEMPT' | null
  wealthManagerId: string | null
  wealthManager?: {
    id: string
    name: string
    email: string
  } | null
  convertedFromId: string | null
  invoices?: Array<{
    id: string
    invoiceNo: string
    amount: number
    paidAmount: number
    status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'REFUNDED'
    dueDate: string
    createdAt: string
    updatedAt: string
    agingBucket?: 'current' | 'due-soon' | 'overdue'
  }>
  customers?: Array<{
    id: string
    name: string
    email: string
  }>
  _count?: {
    invoices: number
    customers: number
  }
  createdAt: string
  updatedAt: string
}

export interface CreateAccountDto {
  name: string
  email?: string
  phone?: string
  state?: string
  wealthManagerId?: string
  convertedFromId?: string
}

export type UpdateAccountDto = Partial<CreateAccountDto>

export interface RecordPaymentResult {
  payment: {
    id: string
    invoiceId: string
    amount: number
    paidAt: string
    recordedBy: string
  }
  invoice: {
    id: string
    invoiceNo: string
    accountId: string
    amount: number
    paidAmount: number
    status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'REFUNDED'
    dueDate: string
    createdAt: string
    updatedAt: string
    agingBucket: 'current' | 'due-soon' | 'overdue'
  }
}

export interface CreateCreditNoteDto {
  amount: number
  reason: string
}

export async function getAccounts(filters: AccountFilters = {}) {
  const { data } = await api.get<AccountRecord[]>('/accounts', { params: filters })
  return data
}

export async function getAccountList() {
  const { data } = await api.get<AccountRecord[]>('/accounts/list')
  return data
}

export async function getAccount(id: string) {
  const { data } = await api.get<AccountRecord>(`/accounts/${id}`)
  return data
}

export async function createAccount(dto: CreateAccountDto) {
  const { data } = await api.post<AccountRecord>('/accounts', dto)
  return data
}

export async function updateAccount(id: string, dto: UpdateAccountDto) {
  const { data } = await api.patch<AccountRecord>(`/accounts/${id}`, dto)
  return data
}

export async function recordPayment(invoiceId: string, amount: number, recordedBy: string) {
  const { data } = await api.post<RecordPaymentResult>(`/accounts/invoices/${invoiceId}/payments`, {
    amount,
    recordedBy,
  })
  return data
}

export async function convertLeadToAccount(leadId: string) {
  const { data } = await api.post<AccountRecord>(`/accounts/leads/${leadId}/convert`)
  return data
}

export async function createCreditNote(invoiceId: string, dto: CreateCreditNoteDto) {
  const { data } = await api.post(`/accounts/invoices/${invoiceId}/credit-notes`, dto)
  return data
}

export async function approveRefund(creditNoteId: string, approvedBy: string) {
  const { data } = await api.post(`/accounts/credit-notes/${creditNoteId}/approve-refund`, {
    approvedBy,
  })
  return data
}
