import { api } from '@/lib/api'

export interface TeamMemberRecord {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  role: 'ADMIN' | 'WEALTH_MANAGER' | 'LAWYER' | 'SUPPORT'
  isActive: boolean
  kycStatus: 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED'
  kycDocuments: unknown
  deletedAt: string | null
  createdAt: string
}

export interface TeamUserOption {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'WEALTH_MANAGER' | 'LAWYER' | 'SUPPORT'
}

export interface CreateTeamMemberDto {
  userId?: string
  role: TeamMemberRecord['role']
  name?: string
  email?: string
}

export type UpdateTeamMemberDto = Partial<CreateTeamMemberDto>

export async function getTeamMembers(includeInactive = false) {
  const { data } = await api.get<TeamMemberRecord[]>('/team', {
    params: { includeInactive },
  })
  return data
}

export async function getTeamMember(id: string) {
  const { data } = await api.get<TeamMemberRecord>(`/team/${id}`)
  return data
}

export async function createTeamMember(dto: CreateTeamMemberDto) {
  const { data } = await api.post<TeamMemberRecord>('/team', dto)
  return data
}

export async function createMember(dto: CreateTeamMemberDto) {
  const { data } = await api.post<TeamMemberRecord>('/team', dto)
  return data
}

export async function updateTeamMember(id: string, dto: UpdateTeamMemberDto) {
  const { data } = await api.patch<TeamMemberRecord>(`/team/${id}`, dto)
  return data
}

export async function updateMember(id: string, dto: UpdateTeamMemberDto) {
  const { data } = await api.patch<TeamMemberRecord>(`/team/${id}`, dto)
  return data
}

export async function softDeleteTeamMember(id: string) {
  const { data } = await api.post<TeamMemberRecord>(`/team/${id}/soft-delete`, {})
  return data
}

export async function updateTeamMemberKyc(
  id: string,
  status: TeamMemberRecord['kycStatus'],
  documents?: unknown,
) {
  const { data } = await api.patch<TeamMemberRecord>(`/team/${id}/kyc`, {
    status,
    documents,
  })
  return data
}

export async function getTeamPermissionMatrix() {
  const { data } = await api.get('/team/permission-matrix/all')
  return data
}

export async function getWealthManagers() {
  const { data } = await api.get<TeamUserOption[]>('/team/wealth-managers')
  return data
}

export async function getEmployees() {
  const { data } = await api.get<TeamUserOption[]>('/team/employees')
  return data
}

export async function setTeamLawyerAvailability(lawyerId: string, isAvailable: boolean) {
  const { data } = await api.patch(`/team/lawyers/${lawyerId}/availability`, {
    isAvailable,
  })
  return data
}
