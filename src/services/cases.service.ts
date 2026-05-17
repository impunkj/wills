import { api } from '@/lib/api'

export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'

export interface CaseFilters {
  status?: CaseStatus
  customerId?: string
  lawyerId?: string
  search?: string
}

export interface CaseRecord {
  id: string
  caseNo: string
  title: string
  serviceType: string
  status: CaseStatus
  level: number
  customerId: string
  assignedLawyerId: string | null
  assignedLawyer?: {
    id: string
    name: string
    email?: string
  } | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateCaseDto {
  title: string
  serviceType: string
  customerId: string
  assignedLawyerId?: string
  level?: number
}

export type UpdateCaseDto = Partial<CreateCaseDto>

export interface CaseFollowUpRecord {
  id: string
  caseId: string
  action: string
  serviceType: string
  scheduledAt: string
  completedAt: string | null
  createdAt: string
}

export interface AddCaseFollowUpDto {
  action: string
  serviceType: string
  scheduledAt: Date
}

export async function getCases(filters: CaseFilters = {}) {
  const { data } = await api.get<CaseRecord[]>('/cases', { params: filters })
  return data
}

export async function getCase(id: string) {
  const { data } = await api.get<CaseRecord>(`/cases/${id}`)
  return data
}

export async function createCase(dto: CreateCaseDto) {
  const { data } = await api.post<CaseRecord>('/cases', dto)
  return data
}

export async function updateCase(id: string, dto: UpdateCaseDto) {
  const { data } = await api.patch<CaseRecord>(`/cases/${id}`, dto)
  return data
}

export async function updateCaseStatus(id: string, status: CaseStatus) {
  const { data } = await api.patch<CaseRecord>(`/cases/${id}/status`, { status })
  return data
}

export async function reassignCase(caseId: string, newLawyerId: string) {
  const { data } = await api.post<CaseRecord>(`/cases/${caseId}/reassign`, { newLawyerId })
  return data
}

export async function getCaseFollowUps(caseId: string) {
  const { data } = await api.get<CaseFollowUpRecord[]>(`/cases/${caseId}/follow-ups`)
  return data
}

export async function addCaseFollowUp(caseId: string, dto: AddCaseFollowUpDto) {
  const { data } = await api.post<CaseFollowUpRecord>(`/cases/${caseId}/follow-ups`, dto)
  return data
}

export async function getServiceTypesByCustomer(customerId: string) {
  const { data } = await api.get<string[]>(`/cases/customers/${customerId}/service-types`)
  return data
}
