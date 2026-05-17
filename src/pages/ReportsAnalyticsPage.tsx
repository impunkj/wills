import { useMemo, useState } from 'react'
import { ReportsAnalytics } from '@/features/reports-analytics/components'
import type { ReportsAnalyticsProps } from '@/features/reports-analytics/types'
import reportsSample from '@/features/reports-analytics/sample-data.json'
import { toast } from '@/components/ui/toaster'
import {
  exportExcel,
  exportPDF,
  getCaseReport,
  getSalesReport,
  getTeamReport,
} from '@/services/reports.service'

type ReportTab = 'sales' | 'cases' | 'team'

export function ReportsAnalyticsPage() {
  const [compareEnabled, setCompareEnabled] = useState(false)
  const sample = reportsSample as ReportsAnalyticsProps

  const data = useMemo<ReportsAnalyticsProps>(
    () => ({
      dateRange: sample.dateRange,
      sales: sample.sales,
      cases: sample.cases,
      accounts: sample.accounts,
      wmPerformance: sample.wmPerformance,
      documents: sample.documents,
    }),
    [sample],
  )

  return (
    <ReportsAnalytics
      {...data}
      onDateRangeChange={(range) => {
        void (async () => {
          const from = new Date(range.start)
          const to = new Date(range.end)
          try {
            await Promise.all([
              getSalesReport(from, to, compareEnabled),
              getCaseReport(from, to, compareEnabled),
              getTeamReport(from, to, compareEnabled),
            ])
            toast.success('Reports refreshed', `${range.preset ?? 'Custom'} range loaded.`)
          } catch (error) {
            toast.error('Unable to refresh reports', getErrorMessage(error))
          }
        })()
      }}
      onCompareToggle={(enabled) => {
        setCompareEnabled(enabled)
      }}
      onExportExcel={(tab) => {
        void exportReport(tab as ReportTab, 'excel')
      }}
      onExportPdf={(tab) => {
        void exportReport(tab as ReportTab, 'pdf')
      }}
      onExportAll={(format) => {
        void (async () => {
          for (const tab of ['sales', 'cases', 'team'] as const) {
            await exportReport(tab, format === 'excel' ? 'excel' : 'pdf')
          }
        })()
      }}
    />
  )
}

async function exportReport(tab: ReportTab, format: 'excel' | 'pdf') {
  const from = new Date()
  from.setDate(1)
  const to = new Date()

  try {
    if (format === 'excel') {
      await exportExcel(tab, from, to)
    } else {
      await exportPDF(tab, from, to)
    }
    toast.success('Export complete', `${tab} report downloaded.`)
  } catch (error) {
    toast.error('Unable to export report', getErrorMessage(error))
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  return 'Unexpected error'
}
