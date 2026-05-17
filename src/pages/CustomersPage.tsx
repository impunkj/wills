import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CustomerDetail, CustomerList } from '@/features/customers/components'
import type { Customer, KpiStats, StatusCounts } from '@/features/customers/types'
import { toast } from '@/components/ui/toaster'
import {
  createCustomer,
  getCustomer,
  getCustomers,
  getCustomerTab,
  updateCustomer,
  type CustomerRecord,
} from '@/services/customers.service'
import { getWealthManagers, type TeamUserOption } from '@/services/team.service'

const EMPTY_KPI: KpiStats = {
  totalCustomers: 0,
  activeCases: 0,
  servicesAvailed: 0,
  revenueGenerated: 0,
}

const EMPTY_STATUS_COUNTS: StatusCounts = {
  all: 0,
  active: 0,
  inactive: 0,
}

export function CustomersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const customerId = searchParams.get('customerId')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [wealthManagers, setWealthManagers] = useState<TeamUserOption[]>([])
  const [tabData, setTabData] = useState<Record<string, unknown>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadList() {
      setIsLoading(true)
      try {
        const [records, managerRecords] = await Promise.all([getCustomers(), getWealthManagers()])
        if (!active) {
          return
        }
        setCustomers(records.map(mapCustomerRecord))
        setWealthManagers(managerRecords)
      } catch (error) {
        if (!active) {
          return
        }
        toast.error('Unable to load customers', getErrorMessage(error))
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
    if (!customerId) {
      setSelectedCustomer(null)
      setTabData({})
      return
    }

    const id = customerId
    let active = true

    async function loadDetail() {
      setIsDetailLoading(true)
      try {
        const record = await getCustomer(id)
        const [services, cases, documents, payments, followUps] = await Promise.all([
          getCustomerTab(id, 'overview'),
          getCustomerTab(id, 'cases'),
          getCustomerTab(id, 'documents'),
          getCustomerTab(id, 'invoices'),
          getCustomerTab(id, 'activity'),
        ])
        if (!active) {
          return
        }
        setSelectedCustomer(mapCustomerRecord(record))
        setTabData({ services, cases, documents, payments, followUps })
      } catch (error) {
        if (!active) {
          return
        }
        toast.error('Unable to load customer', getErrorMessage(error))
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
  }, [customerId])

  const kpiStats = useMemo(() => deriveKpiStats(customers), [customers])
  const statusCounts = useMemo(() => deriveStatusCounts(customers), [customers])

  async function refreshList() {
    const records = await getCustomers()
    setCustomers(records.map(mapCustomerRecord))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-96 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900" />
      </div>
    )
  }

  if (customerId && (isDetailLoading || !selectedCustomer)) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-96 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900" />
      </div>
    )
  }

  if (customerId && selectedCustomer) {
    return (
      <CustomerDetail
        customer={selectedCustomer}
        services={(tabData.services as never[]) ?? []}
        cases={(tabData.cases as never[]) ?? []}
        documents={(tabData.documents as never[]) ?? []}
        payments={(tabData.payments as never[]) ?? []}
        followUps={(tabData.followUps as never[]) ?? []}
        wealthManager={{
          id: selectedCustomer.wealthManagerId || 'wm-unknown',
          name: selectedCustomer.wealthManagerName || 'Unassigned',
          email: '',
          phone: '',
          company: '',
          city: selectedCustomer.city,
          state: selectedCustomer.state,
          totalCustomers: 0,
          activeLeads: 0,
          photoUrl: null,
        }}
        onBack={() => navigate('/customers')}
        onEdit={() => {
          toast.info('Edit customer', selectedCustomer.id)
        }}
      />
    )
  }

  return (
    <CustomerList
      customers={customers}
      kpiStats={kpiStats}
      statusCounts={statusCounts}
      onView={(id) => navigate(`/customers?customerId=${encodeURIComponent(id)}`)}
      onEdit={(id) => {
        void (async () => {
          try {
            const customer = customers.find((item) => item.id === id)
            if (!customer) {
              return
            }
            await updateCustomer(id, { name: customer.name, email: customer.email, phone: customer.phone })
            toast.success('Customer updated', `${customer.name} has been saved.`)
            await refreshList()
          } catch (error) {
            toast.error('Unable to update customer', getErrorMessage(error))
          }
        })()
      }}
      onSendQuotation={(id) => {
        navigate(`/sales-crm?action=create-quotation&leadId=${encodeURIComponent(id)}`)
      }}
      onViewCases={(id) => navigate(`/case-management?customerId=${encodeURIComponent(id)}`)}
      onViewDocuments={(id) => navigate(`/customers?customerId=${encodeURIComponent(id)}`)}
      onCreate={(customer) => {
        void (async () => {
          try {
            await createCustomer({
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              tags: customer.servicesAvailed,
              wealthManagerId:
                wealthManagers.find((item) => item.name === customer.wealthManagerName)?.id ?? undefined,
            })
            toast.success('Customer created', `${customer.name} has been added.`)
            await refreshList()
          } catch (error) {
            toast.error('Unable to create customer', getErrorMessage(error))
          }
        })()
      }}
    />
  )
}

function mapCustomerRecord(record: CustomerRecord): Customer {
  return {
    id: record.id,
    leadId: '',
    accountEntryId: record.accountId ?? '',
    name: record.name,
    phone: record.phone,
    email: record.email,
    company: '',
    designation: '',
    city: '',
    state: '',
    address: '',
    dateOfBirth: '',
    pan: '',
    wealthManagerId: record.wealthManagerId ?? '',
    wealthManagerName: record.wealthManager?.name ?? '',
    servicesAvailed: record.tags,
    activeCases: 0,
    totalCases: 0,
    totalPayments: 0,
    pendingAmount: 0,
    status: 'active',
    convertedAt: record.createdAt,
    notes: '',
  }
}

function deriveKpiStats(items: Customer[]): KpiStats {
  return {
    totalCustomers: items.length,
    activeCases: items.reduce((sum, item) => sum + item.activeCases, 0),
    servicesAvailed: items.reduce((sum, item) => sum + item.servicesAvailed.length, 0),
    revenueGenerated: items.reduce((sum, item) => sum + item.totalPayments, 0),
  }
}

function deriveStatusCounts(items: Customer[]): StatusCounts {
  const counts: StatusCounts = { ...EMPTY_STATUS_COUNTS, all: items.length }
  for (const item of items) {
    if (item.status === 'pending') {
      continue
    }
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
