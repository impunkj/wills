import { api } from '@/lib/api'

export interface CustomerRecord {
  id: string
  accountId: string | null
  name: string
  email: string
  phone: string
  tags: string[]
  wealthManagerId: string | null
  wealthManager?: {
    id: string
    name: string
    email: string
  } | null
  account?: {
    id: string
    accountNo?: string | null
    name: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface CustomerFilters {
  search?: string
  wealthManagerId?: string
  tag?: string
}

export interface CreateCustomerDto {
  accountId?: string
  name: string
  email?: string
  phone?: string
  tags?: string[]
  wealthManagerId?: string
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>

export async function getCustomers(filters: CustomerFilters = {}) {
  const { data } = await api.get<CustomerRecord[]>('/customers', { params: filters })
  return data
}

export async function getCustomerList() {
  const { data } = await api.get<CustomerRecord[]>('/customers/list')
  return data
}

export async function getCustomer(id: string) {
  const { data } = await api.get<CustomerRecord>(`/customers/${id}`)
  return data
}

export async function createCustomer(dto: CreateCustomerDto) {
  const { data } = await api.post<CustomerRecord>('/customers', dto)
  return data
}

export async function updateCustomer(id: string, dto: UpdateCustomerDto) {
  const { data } = await api.patch<CustomerRecord>(`/customers/${id}`, dto)
  return data
}

export async function getCustomerTab(
  customerId: string,
  tab: 'overview' | 'cases' | 'quotations' | 'invoices' | 'documents' | 'activity',
) {
  const { data } = await api.get(`/customers/${customerId}/tabs/${tab}`)
  return data
}
