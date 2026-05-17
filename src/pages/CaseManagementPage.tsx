import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AddCaseForm, CaseDetail, CaseList } from '@/features/case-management/components'
import type { Case, CaseKpiStats, CaseStatus, CaseStatusCounts } from '@/features/case-management/types'
import { toast } from '@/components/ui/toaster'
import {
  addCaseFollowUp,
  createCase,
  getCase,
  getCaseFollowUps,
  getCases,
  reassignCase,
  updateCase,
  type CaseRecord,
  type CaseStatus as ApiCaseStatus,
} from '@/services/cases.service'
import { getLawyersForDropdown, type LawyerRecord } from '@/services/lawyers.service'
import { getCustomerList, type CustomerRecord } from '@/services/customers.service'

const EMPTY_KPI: CaseKpiStats = {
  totalCases: 0,
  activeCases: 0,
  completedCases: 0,
  avgResolutionDays: 0,
  onHold: 0,
}

const EMPTY_STATUS_COUNTS: CaseStatusCounts = {
  all: 0,
  'in-progress': 0,
  drafting: 0,
  'under-review': 0,
  approved: 0,
  completed: 0,
  'on-hold': 0,
}

export function CaseManagementPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [cases, setCases] = useState<Case[]>([])
  const [lawyers, setLawyers] = useState<LawyerRecord[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [followUps, setFollowUps] = useState<Awaited<ReturnType<typeof getCaseFollowUps>>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const selectedCaseId = searchParams.get('caseId')
  const isNew = location.pathname.endsWith('/new')

  useEffect(() => {
    let active = true

    async function loadList() {
      setIsLoading(true)
      try {
        const [records, lawyerRecords] = await Promise.all([getCases(), getLawyersForDropdown()])
        const customerRecords = await getCustomerList()
        if (!active) {
          return
        }
        setCases(records.map(mapCaseRecord))
        setLawyers(lawyerRecords)
        setCustomers(customerRecords)
      } catch (error) {
        if (!active) {
          return
        }
        toast.error('Unable to load cases', getErrorMessage(error))
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadList()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedCaseId) {
      setSelectedCase(null)
      setFollowUps([])
      return
    }

    const caseId = selectedCaseId
    let active = true

    async function loadDetail() {
      setIsDetailLoading(true)
      try {
        const [record, caseFollowUps] = await Promise.all([getCase(caseId), getCaseFollowUps(caseId)])
        if (!active) {
          return
        }
        setSelectedCase(mapCaseRecord(record))
        setFollowUps(caseFollowUps)
      } catch (error) {
        if (!active) {
          return
        }
        toast.error('Unable to load case', getErrorMessage(error))
      } finally {
        if (active) {
          setIsDetailLoading(false)
        }
      }
    }

    void loadDetail()

    return () => {
      active = false
    }
  }, [selectedCaseId])

  const kpiStats = useMemo(() => deriveKpiStats(cases), [cases])
  const statusCounts = useMemo(() => deriveStatusCounts(cases), [cases])

  async function refreshList() {
    const records = await getCases()
    setCases(records.map(mapCaseRecord))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-96 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900" />
      </div>
    )
  }

  if (isNew) {
    return (
      <AddCaseForm
        customers={customers.map(mapCustomer)}
        lawyers={lawyers.map(mapLawyer)}
        onSubmit={(data) => {
          void (async () => {
            try {
              const created = await createCase({
                title: data.description || data.serviceType,
                serviceType: data.serviceType,
                customerId: data.customerId,
                assignedLawyerId: data.lawyerId || undefined,
              })
              toast.success('Case created', `${created.caseNo} has been opened.`)
              navigate(`/case-management?caseId=${encodeURIComponent(created.id)}`)
              await refreshList()
            } catch (error) {
              toast.error('Unable to create case', getErrorMessage(error))
            }
          })()
        }}
        onCancel={() => navigate('/case-management')}
      />
    )
  }

  if (selectedCaseId && (isDetailLoading || !selectedCase)) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-96 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900" />
      </div>
    )
  }

  if (selectedCaseId && selectedCase) {
    return (
      <CaseDetail
        caseData={selectedCase}
        followUps={followUps.map((item) => ({
          id: item.id,
          caseId: item.caseId,
          title: item.action,
          notes: item.action,
          serviceAction: 'Drafting',
          author: 'Wills24 Admin',
          authorRole: 'admin',
          priority: 'normal',
          statusChange: null,
          attachments: [],
          createdAt: item.createdAt,
        }))}
        notes={[]}
        documents={[]}
        lawyers={lawyers.map(mapLawyer)}
        onBack={() => navigate('/case-management')}
        onAssignLawyer={(lawyerId) => {
          void (async () => {
            try {
              await reassignCase(selectedCase.id, lawyerId)
              toast.success('Lawyer reassigned', `Case ${selectedCase.id} updated.`)
              const record = await getCase(selectedCase.id)
              setSelectedCase(mapCaseRecord(record))
            } catch (error) {
              toast.error('Unable to reassign lawyer', getErrorMessage(error))
            }
          })()
        }}
        onAddFollowUp={() => {
          void (async () => {
            try {
              await addCaseFollowUp(selectedCase.id, {
                action: 'Follow-up logged',
                serviceType: selectedCase.serviceType,
                scheduledAt: new Date(),
              })
              toast.success('Follow-up added', 'Timeline updated.')
              setFollowUps(await getCaseFollowUps(selectedCase.id))
            } catch (error) {
              toast.error('Unable to add follow-up', getErrorMessage(error))
            }
          })()
        }}
      />
    )
  }

  return (
    <CaseList
      cases={cases}
      kpiStats={kpiStats}
      statusCounts={statusCounts}
      onView={(id) => navigate(`/case-management?caseId=${encodeURIComponent(id)}`)}
      onEdit={(id) => {
        void (async () => {
          try {
            const item = cases.find((entry) => entry.id === id)
            if (!item) {
              return
            }
            await updateCase(id, { title: item.serviceName, serviceType: item.serviceType })
            toast.success('Case updated', `${item.serviceName} saved.`)
            await refreshList()
          } catch (error) {
            toast.error('Unable to update case', getErrorMessage(error))
          }
        })()
      }}
      onCreate={() => navigate('/case-management/new')}
    />
  )
}

function mapCaseRecord(record: CaseRecord): Case {
  return {
    id: record.id,
    customerId: record.customerId,
    customerName: record.title,
    serviceType: record.serviceType,
    serviceName: record.title,
    assignedLawyer: record.assignedLawyer?.name ?? '',
    lawyerId: record.assignedLawyerId ?? '',
    assignedEmployee: '',
    employeeId: '',
    status: mapApiStatus(record.status),
    caseLevel: 'not-started',
    priority: 'normal',
    followUpCount: 0,
    documentCount: 0,
    lastUpdated: record.updatedAt,
    createdAt: record.createdAt,
    description: record.title,
    documentChecklist: [],
  }
}

function mapApiStatus(status: ApiCaseStatus): CaseStatus {
  switch (status) {
    case 'OPEN':
      return 'in-progress'
    case 'IN_PROGRESS':
      return 'in-progress'
    case 'ON_HOLD':
      return 'on-hold'
    case 'COMPLETED':
      return 'completed'
    case 'CANCELLED':
      return 'on-hold'
    default:
      return 'in-progress'
  }
}

function mapLawyer(record: LawyerRecord) {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone ?? '',
    specialization: record.specialization.join(', '),
    barCouncilId: record.barNumber,
    city: '',
    state: '',
    experience: 0,
    activeCases: record.activeCases,
    completedCases: 0,
    avgResolutionDays: 0,
    rating: 0,
    availability: record.isActive ? 'available' as const : 'on-leave' as const,
    photoUrl: null,
  }
}

function mapCustomer(record: CustomerRecord) {
  return {
    id: record.id,
    name: record.name,
    phone: record.phone,
    email: record.email,
    city: '',
    state: '',
    status: 'active' as const,
  }
}

function deriveKpiStats(items: Case[]): CaseKpiStats {
  return {
    totalCases: items.length,
    activeCases: items.filter((item) => item.status === 'in-progress').length,
    completedCases: items.filter((item) => item.status === 'completed').length,
    avgResolutionDays: 0,
    onHold: items.filter((item) => item.status === 'on-hold').length,
  }
}

function deriveStatusCounts(items: Case[]): CaseStatusCounts {
  const counts: CaseStatusCounts = { ...EMPTY_STATUS_COUNTS, all: items.length }
  for (const item of items) {
    counts[item.status] += 1
  }
  return counts
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  return 'Unexpected error'
}
