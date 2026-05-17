import { api } from '@/lib/api'

export interface PartnerFilters {
  isActive?: boolean
  search?: string
}

export interface PartnerRecord {
  id: string
  partnerId: string
  name: string
  email: string | null
  phone: string | null
  isActive: boolean
  walletBalance: number
  createdAt: string
  updatedAt: string
}

export interface CreatePartnerDto {
  name: string
  email?: string
  phone?: string
  isActive?: boolean
}

export type UpdatePartnerDto = Partial<CreatePartnerDto>

export async function getPartners(filters: PartnerFilters = {}) {
  const { data } = await api.get<PartnerRecord[]>('/partners', { params: filters })
  return data
}

export async function getPartner(id: string) {
  const { data } = await api.get<PartnerRecord>(`/partners/${id}`)
  return data
}

export async function createPartner(dto: CreatePartnerDto) {
  const { data } = await api.post<PartnerRecord>('/partners', dto)
  return data
}

export async function updatePartner(id: string, dto: UpdatePartnerDto) {
  const { data } = await api.patch<PartnerRecord>(`/partners/${id}`, dto)
  return data
}

export async function togglePartnerActive(id: string) {
  const { data } = await api.patch<PartnerRecord>(`/partners/${id}/toggle-active`)
  return data
}

export async function consumePartnerWill(id: string) {
  const { data } = await api.post(`/partners/${id}/consume-will`)
  return data
}

export async function getPartnerWalletHistory(id: string) {
  const { data } = await api.get(`/partners/${id}/wallet-history`)
  return data
}

export async function getPartnerTab(
  id: string,
  tab: 'overview' | 'packages' | 'leads' | 'wallet' | 'activity',
) {
  const { data } = await api.get(`/partners/${id}/tabs/${tab}`)
  return data
}

export async function expirePartnerPackages() {
  const { data } = await api.post('/partners/expire-stale-packages')
  return data
}
