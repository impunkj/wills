import { useEffect, useMemo, useState } from 'react'
import { AccountsList } from '@/features/accounts/components'
import type { AccountEntry, KpiStats, StatusCounts } from '@/features/accounts/types'
import { toast } from '@/components/ui/toaster'
import {
  convertLeadToAccount,
  getAccounts,
  updateAccount,
  type AccountRecord,
} from '@/services/accounts.service'

const EMPTY_KPI: KpiStats = {
  totalPISent: 0,
  totalPendingAmount: 0,
  receivedPayment: 0,
  totalQuotationsSent: 0,
}

const EMPTY_STATUS_COUNTS: StatusCounts = {
  all: 0,
  'pi-sent': 0,
  'payment-received': 0,
  'invoice-sent': 0,
  'subscription-enabled': 0,
}

export function AccountsPage() {
  const [accountEntries, setAccountEntries] = useState<AccountEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const records = await getAccounts()
        if (!active) {
          return
        }
        setAccountEntries(records.map(mapAccountRecord))
      } catch (error) {
        if (!active) {
          return
        }
        toast.error('Unable to load accounts', getErrorMessage(error))
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

  const kpiStats = useMemo(() => deriveKpiStats(accountEntries), [accountEntries])
  const statusCounts = useMemo(() => deriveStatusCounts(accountEntries), [accountEntries])

  async function refresh() {
    const records = await getAccounts()
    setAccountEntries(records.map(mapAccountRecord))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-96 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900" />
      </div>
    )
  }

  return (
    <AccountsList
      accountEntries={accountEntries}
      kpiStats={kpiStats}
      statusCounts={statusCounts}
      onEdit={(id) => {
        void (async () => {
          try {
            const entry = accountEntries.find((item) => item.id === id)
            if (!entry) {
              return
            }
            await updateAccount(id, { name: entry.name, email: entry.email, phone: entry.phone })
            toast.success('Account updated', `${entry.name} has been saved.`)
            await refresh()
          } catch (error) {
            toast.error('Unable to update account', getErrorMessage(error))
          }
        })()
      }}
      onFollowUp={(id) => {
        toast.info('Follow-up', `Account ${id} follow-up is ready to log.`)
      }}
      onSendPI={(id) => {
        toast.info('Proforma invoice', `Send PI for account ${id}.`)
      }}
      onSendInvoice={(id) => {
        toast.info('Tax invoice', `Send invoice for account ${id}.`)
      }}
      onConvertToCustomer={(id) => {
        void (async () => {
          try {
            const entry = accountEntries.find((item) => item.id === id)
            const leadId = entry?.leadId ?? id
            await convertLeadToAccount(leadId)
            toast.success('Customer conversion started', `Lead ${leadId} is being converted.`)
            await refresh()
          } catch (error) {
            toast.error('Unable to convert lead', getErrorMessage(error))
          }
        })()
      }}
    />
  )
}

function mapAccountRecord(record: AccountRecord): AccountEntry {
  return {
    id: record.id,
    leadId: record.convertedFromId ?? record.id,
    name: record.name,
    phone: record.phone ?? '',
    email: record.email ?? '',
    company: '',
    designation: '',
    city: '',
    state: record.state ?? '',
    wealthManagerId: record.wealthManagerId ?? '',
    wealthManagerName: '',
    quotationRef: record.accountNo,
    quotationAmount: 0,
    serviceInterest: '',
    assignedEmployee: '',
    status: 'pi-sent',
    piSentDate: record.createdAt,
    notes: '',
    assignedAt: record.createdAt,
    customerId: null,
  }
}

function deriveKpiStats(entries: AccountEntry[]): KpiStats {
  if (entries.length === 0) {
    return EMPTY_KPI
  }

  return {
    totalPISent: entries.filter((entry) => entry.status === 'pi-sent').length,
    totalPendingAmount: entries.reduce((sum, entry) => sum + entry.quotationAmount, 0),
    receivedPayment: entries.filter((entry) => entry.status === 'payment-received').length,
    totalQuotationsSent: entries.length,
  }
}

function deriveStatusCounts(entries: AccountEntry[]): StatusCounts {
  const counts: StatusCounts = { ...EMPTY_STATUS_COUNTS, all: entries.length }
  for (const entry of entries) {
    counts[entry.status] += 1
  }
  return counts
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  return 'Unexpected error'
}
