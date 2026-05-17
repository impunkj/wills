import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LawyersDirectory } from '@/features/lawyers-directory/components'
import type { Lawyer, TeamManagementProps } from '@/features/lawyers-directory/types'
import teamSample from '@/features/team-management/sample-data.json'
import { toast } from '@/components/ui/toaster'
import { createLawyer, getLawyerActiveCases, getLawyers, type LawyerRecord } from '@/services/lawyers.service'
import { getTeamPermissionMatrix } from '@/services/team.service'

export function LawyersDirectoryPage() {
  const navigate = useNavigate()
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [cases, setCases] = useState<
    Array<{
      id: string
      customerName: string
      serviceType: string
      serviceName: string
      status: string
      priority: string
      lastUpdated: string
      description: string
      lawyerId?: string
    }>
  >([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const lawyerRecords = await getLawyers()
        if (!active) {
          return
        }
        setLawyers(lawyerRecords.map(mapLawyerRecord))
        await getTeamPermissionMatrix()
      } catch (error) {
        if (!active) {
          return
        }
        toast.error('Unable to load lawyers directory', getErrorMessage(error))
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
    <LawyersDirectory
      users={teamSample.users as TeamManagementProps['users']}
      lawyers={lawyers}
      employees={teamSample.employees as TeamManagementProps['employees']}
      rolePermissions={teamSample.rolePermissions as TeamManagementProps['rolePermissions']}
      cases={cases}
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
      onViewLawyer={(id) => {
        void (async () => {
          try {
            const activeCases = await getLawyerActiveCases(id)
            setCases(
              activeCases.map((item) => ({
                id: item.id,
                customerName: item.customerId,
                serviceType: item.title,
                serviceName: item.title,
                status: item.status,
                priority: 'normal',
                lastUpdated: new Date().toISOString(),
                description: item.title,
                lawyerId: id,
              })),
            )
          } catch (error) {
            toast.error('Unable to load lawyer cases', getErrorMessage(error))
          }
        })()
      }}
      onViewCase={(id) => navigate(`/case-management?caseId=${encodeURIComponent(id)}`)}
      onUpdateLawyerAvailability={(id, status) => {
        toast.info('Availability', `Lawyer ${id} → ${status}`)
      }}
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  return 'Unexpected error'
}
