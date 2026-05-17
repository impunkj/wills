import { useEffect, useState } from 'react'
import { TeamManagement } from '@/features/team-management/components'
import type { Employee, Lawyer, RolePermission, User } from '@/features/team-management/types'
import teamSample from '@/features/team-management/sample-data.json'
import { toast } from '@/components/ui/toaster'
import {
  createMember,
  getTeamMembers,
  getTeamPermissionMatrix,
  setTeamLawyerAvailability,
  softDeleteTeamMember,
  updateTeamMember,
} from '@/services/team.service'
import { createLawyer, getLawyers, type LawyerRecord } from '@/services/lawyers.service'

export function TeamManagementPage() {
  const [users, setUsers] = useState<User[]>(teamSample.users as User[])
  const [employees, setEmployees] = useState<Employee[]>(teamSample.employees as Employee[])
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(
    teamSample.rolePermissions as RolePermission[],
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const [lawyerRecords, matrix, teamMembers] = await Promise.all([
          getLawyers(),
          getTeamPermissionMatrix(),
          getTeamMembers(true),
        ])
        if (!active) {
          return
        }
        setUsers(teamMembers.map(mapTeamMemberToUser))
        setLawyers(lawyerRecords.map(mapLawyerRecord))
        setRolePermissions(mapPermissionMatrix(matrix))
      } catch (error) {
        if (!active) {
          return
        }
        toast.error('Unable to load team data', getErrorMessage(error))
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-96 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900" />
      </div>
    )
  }

  return (
    <TeamManagement
      users={users}
      lawyers={lawyers}
      employees={employees}
      rolePermissions={rolePermissions}
      onAddUser={(payload) => {
        void (async () => {
          try {
            await createMember({
              name: payload.name,
              email: payload.email,
              role:
                payload.role === 'admin'
                  ? 'ADMIN'
                  : payload.role === 'sales'
                    ? 'WEALTH_MANAGER'
                    : payload.role === 'legal'
                      ? 'LAWYER'
                      : 'SUPPORT',
            })
            setUsers((await getTeamMembers(true)).map(mapTeamMemberToUser))
            toast.success('User created', `${payload.name} has been added.`)
          } catch (error) {
            toast.error('Unable to add user', getErrorMessage(error))
          }
        })()
      }}
      onEditUser={(id) => {
        void (async () => {
          try {
            await updateTeamMember(id, { role: 'SUPPORT' })
            toast.success('User updated', `Team member ${id} saved.`)
          } catch (error) {
            toast.error('Unable to update user', getErrorMessage(error))
          }
        })()
      }}
      onToggleUserStatus={(id) => {
        void (async () => {
          try {
            await softDeleteTeamMember(id)
            toast.success('User status updated', `Team member ${id} updated.`)
          } catch (error) {
            toast.error('Unable to update user status', getErrorMessage(error))
          }
        })()
      }}
      onAddLawyer={(payload) => {
        void (async () => {
          try {
            await createLawyer(payload)
            setLawyers((await getLawyers()).map(mapLawyerRecord))
            toast.success('Lawyer created', `${payload.name} has been added.`)
          } catch (error) {
            toast.error('Unable to add lawyer', getErrorMessage(error))
          }
        })()
      }}
      onEditLawyer={(id) => toast.info('Edit lawyer', id)}
      onUpdateLawyerAvailability={(id, status) => {
        void (async () => {
          try {
            await setTeamLawyerAvailability(id, status === 'available')
            toast.success('Availability updated', `Lawyer ${id} is now ${status}.`)
          } catch (error) {
            toast.error('Unable to update availability', getErrorMessage(error))
          }
        })()
      }}
      onViewLawyer={(id) => toast.info('View lawyer', id)}
      onAddEmployee={(payload) => {
        void (async () => {
          try {
            await createMember({
              name: payload.name,
              email: payload.email,
              role: 'SUPPORT',
            })
            setUsers((await getTeamMembers(true)).map(mapTeamMemberToUser))
            toast.success('Employee created', `${payload.name} has been added.`)
          } catch (error) {
            toast.error('Unable to add employee', getErrorMessage(error))
          }
        })()
      }}
      onEditEmployee={(id) => toast.info('Edit employee', id)}
      onToggleEmployeeStatus={(id) => toast.info('Employee status', id)}
      onViewEmployee={(id) => toast.info('View employee', id)}
    />
  )
}

function mapLawyerRecord(record: LawyerRecord): Lawyer {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone ?? '',
    specialization: record.specialization.join(', '),
    barCouncilId: record.barNumber,
    location: '',
    experienceYears: 0,
    activeCases: record.activeCases,
    totalCasesHandled: 0,
    successRate: 0,
    avgResolutionDays: 0,
    rating: 0,
    availability: record.isActive ? 'available' : 'on-leave',
    documents: [],
  }
}

function mapTeamMemberToUser(member: {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  role: 'ADMIN' | 'WEALTH_MANAGER' | 'LAWYER' | 'SUPPORT'
  isActive: boolean
  createdAt: string
}): User {
  return {
    id: member.id,
    name: member.name || member.userId,
    email: member.email,
    phone: member.phone ?? '',
    role:
      member.role === 'ADMIN'
        ? 'admin'
        : member.role === 'WEALTH_MANAGER'
          ? 'sales'
          : member.role === 'LAWYER'
            ? 'legal'
            : 'operations',
    department:
      member.role === 'LAWYER'
        ? 'Legal'
        : member.role === 'WEALTH_MANAGER'
          ? 'Sales'
          : member.role === 'ADMIN'
            ? 'Administration'
            : 'Operations',
    status: member.isActive ? 'active' : 'inactive',
    lastLogin: member.createdAt,
    createdAt: member.createdAt,
  }
}

function mapPermissionMatrix(matrix: unknown): RolePermission[] {
  if (Array.isArray(matrix)) {
    return matrix as RolePermission[]
  }

  if (!matrix || typeof matrix !== 'object') {
    return teamSample.rolePermissions as RolePermission[]
  }

  const modules = new Set<string>()
  for (const values of Object.values(matrix as Record<string, string[]>)) {
    for (const value of values ?? []) {
      modules.add(value)
    }
  }

  return Array.from(modules).sort().map((module) => ({
    module,
    admin: (matrix as Record<string, string[]>).ADMIN?.includes(module) ? 'full' : 'none',
    sales: (matrix as Record<string, string[]>).WEALTH_MANAGER?.includes(module) ? 'full' : 'none',
    operations: (matrix as Record<string, string[]>).SUPPORT?.includes(module) ? 'full' : 'none',
    legal: (matrix as Record<string, string[]>).LAWYER?.includes(module) ? 'full' : 'none',
    accounts: 'none',
    hr: 'none',
  }))
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  return 'Unexpected error'
}
