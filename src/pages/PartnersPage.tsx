import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AddWMForm, WMList } from '@/features/partners/components'
import type { WealthManager, WMKpiStats, WMStatusCounts, WMTierCounts } from '@/features/partners/types'
import { toast } from '@/components/ui/toaster'
import {
  createPartner,
  getPartners,
  togglePartnerActive,
  updatePartner,
  type PartnerRecord,
} from '@/services/partners.service'

const EMPTY_KPI: WMKpiStats = {
  totalWealthManagers: 0,
  activeWealthManagers: 0,
  totalSales: 0,
  totalWillsRemaining: 0,
}

const EMPTY_STATUS_COUNTS: WMStatusCounts = {
  all: 0,
  active: 0,
  inactive: 0,
}

const EMPTY_TIER_COUNTS: WMTierCounts = {
  platinum: 0,
  gold: 0,
  silver: 0,
  bronze: 0,
}

export function PartnersPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [wealthManagers, setWealthManagers] = useState<WealthManager[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isNew = location.pathname.endsWith('/new')

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const records = await getPartners()
        if (!active) {
          return
        }
        setWealthManagers(records.map(mapPartnerRecord))
      } catch (error) {
        if (!active) {
          return
        }
        toast.error('Unable to load partners', getErrorMessage(error))
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

  const kpiStats = useMemo(() => deriveKpiStats(wealthManagers), [wealthManagers])
  const statusCounts = useMemo(() => deriveStatusCounts(wealthManagers), [wealthManagers])
  const tierCounts = useMemo(() => deriveTierCounts(wealthManagers), [wealthManagers])

  async function refresh() {
    const records = await getPartners()
    setWealthManagers(records.map(mapPartnerRecord))
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
      <AddWMForm
        onCancel={() => navigate('/partners')}
        onSubmit={(payload) => {
          void (async () => {
            try {
              await createPartner({
                name: payload.name,
                email: payload.email,
                phone: payload.phone,
              })
              toast.success('Partner created', `${payload.name} has been added.`)
              await refresh()
              navigate('/partners')
            } catch (error) {
              toast.error('Unable to create partner', getErrorMessage(error))
            }
          })()
        }}
      />
    )
  }

  return (
    <WMList
      wealthManagers={wealthManagers}
      kpiStats={kpiStats}
      statusCounts={statusCounts}
      tierCounts={tierCounts}
      onView={(id) => navigate(`/partners?partnerId=${encodeURIComponent(id)}`)}
      onEdit={(id, payload) => {
        void (async () => {
          try {
            const name = payload?.name ?? wealthManagers.find((item) => item.id === id)?.name ?? 'Partner'
            await updatePartner(id, {
              name,
              email: payload?.email,
              phone: payload?.phone,
            })
            toast.success('Partner updated', `${name} has been saved.`)
            await refresh()
          } catch (error) {
            toast.error('Unable to update partner', getErrorMessage(error))
          }
        })()
      }}
      onToggleStatus={(id) => {
        void (async () => {
          try {
            await togglePartnerActive(id)
            toast.success('Partner status updated', `Partner ${id} toggled.`)
            await refresh()
          } catch (error) {
            toast.error('Unable to toggle partner', getErrorMessage(error))
          }
        })()
      }}
      onViewCustomers={(id) => navigate(`/customers?wealthManagerId=${encodeURIComponent(id)}`)}
      onViewPackages={(id) => navigate(`/partners?partnerId=${encodeURIComponent(id)}&tab=packages`)}
      onCreate={() => navigate('/partners/new')}
    />
  )
}

function mapPartnerRecord(record: PartnerRecord): WealthManager {
  return {
    id: record.id,
    name: record.name,
    email: record.email ?? '',
    phone: record.phone ?? '',
    gender: 'male',
    dob: '',
    photoUrl: null,
    address: {
      country: 'India',
      state: '',
      city: '',
      area: '',
      address: '',
      pinCode: '',
    },
    company: {
      name: record.partnerId,
      email: record.email ?? '',
      gstNumber: '',
      panNumber: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branch: '',
    },
    tier: 'silver',
    status: record.isActive ? 'active' : 'inactive',
    willsRemaining: Math.max(0, Math.floor(record.walletBalance)),
    willsUsed: 0,
    currentPackageTier: null,
    currentPackageExpiresAt: null,
    totalSales: 0,
    totalCustomers: 0,
    totalLeads: 0,
    activeCases: 0,
    permissions: ['leads', 'customers'],
    dashboardVisibility: ['kpis', 'sales'],
    joinedAt: record.createdAt,
    lastActive: record.updatedAt,
  }
}

function deriveKpiStats(items: WealthManager[]): WMKpiStats {
  return {
    totalWealthManagers: items.length,
    activeWealthManagers: items.filter((item) => item.status === 'active').length,
    totalSales: items.reduce((sum, item) => sum + item.totalSales, 0),
    totalWillsRemaining: items.reduce((sum, item) => sum + item.willsRemaining, 0),
  }
}

function deriveStatusCounts(items: WealthManager[]): WMStatusCounts {
  const counts: WMStatusCounts = { ...EMPTY_STATUS_COUNTS, all: items.length }
  for (const item of items) {
    counts[item.status] += 1
  }
  return counts
}

function deriveTierCounts(items: WealthManager[]): WMTierCounts {
  const counts: WMTierCounts = { ...EMPTY_TIER_COUNTS }
  for (const item of items) {
    counts[item.tier] += 1
  }
  return counts
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  return 'Unexpected error'
}
