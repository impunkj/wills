import { api } from '@/lib/api'

export interface LawyerRecord {
  id: string
  name: string
  email: string
  phone: string | null
  specialization: string[]
  barNumber: string
  isActive: boolean
  activeCases: number
  teamMemberId: string | null
  createdAt: string
  updatedAt: string
}

export interface LawyerFilters {
  specialization?: string
  isActive?: boolean
  search?: string
}

export interface CreateLawyerDto {
  name: string
  email: string
  barNumber: string
  phone?: string
  specialization?: string[]
}

export type UpdateLawyerDto = Partial<CreateLawyerDto>

export async function getLawyers(filters: LawyerFilters = {}) {
  const { data } = await api.get<LawyerRecord[]>('/lawyers', { params: filters })
  return data
}

export async function getActiveLawyers() {
  const { data } = await api.get<LawyerRecord[]>('/lawyers/active')
  return data
}

export async function getLawyersForDropdown() {
  const { data } = await api.get<LawyerRecord[]>('/lawyers/dropdown')
  return data
}

export async function getLawyer(id: string) {
  const { data } = await api.get<LawyerRecord>(`/lawyers/${id}`)
  return data
}

export async function createLawyer(dto: CreateLawyerDto) {
  const { data } = await api.post<LawyerRecord>('/lawyers', dto)
  return data
}

export async function updateLawyer(id: string, dto: UpdateLawyerDto) {
  const { data } = await api.patch<LawyerRecord>(`/lawyers/${id}`, dto)
  return data
}

export async function deactivateLawyer(id: string) {
  const { data } = await api.patch<LawyerRecord>(`/lawyers/${id}/deactivate`)
  return data
}

export async function getLawyerActiveCases(id: string) {
  const { data } = await api.get<Array<{
    id: string
    caseNo: string
    title: string
    status: string
    customerId: string
  }>>(`/lawyers/${id}/active-cases`)
  return data
}
