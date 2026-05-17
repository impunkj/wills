import { useState } from 'react'
import type {
  ReportsAnalyticsProps,
  ReportKpi,
} from '../types'
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  ArrowUpDown,
  Crown,
  Award,
  Medal,
  Gem,
  Star,
  TrendingUp,
  CircleDot,
  Target,
  GitMerge,
  BarChart3,
  FileText,
  Calendar,
} from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtCur(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`
  return `₹${v.toLocaleString('en-IN')}`
}

function fmtKpi(kpi: ReportKpi): string {
  switch (kpi.format) {
    case 'currency':
      return fmtCur(kpi.value)
    case 'percent':
      return `${kpi.value}%`
    case 'days':
      return `${kpi.value}d`
    default:
      return kpi.value.toLocaleString('en-IN')
  }
}

function fmtPrev(kpi: ReportKpi): string {
  switch (kpi.format) {
    case 'currency':
      return fmtCur(kpi.previousValue)
    case 'percent':
      return `${kpi.previousValue}%`
    case 'days':
      return `${kpi.previousValue}d`
    default:
      return kpi.previousValue.toLocaleString('en-IN')
  }
}

const INVERSE_LABELS = [
  'avg resolution',
  'outstanding',
  'avg payment',
  'avg tat',
  'pending approval',
]

function changeColor(kpi: ReportKpi): string {
  if (kpi.changeDirection === 'flat')
    return 'text-neutral-500 dark:text-neutral-400'
  const inverse = INVERSE_LABELS.some((l) =>
    kpi.label.toLowerCase().includes(l),
  )
  const positive = inverse
    ? kpi.changeDirection === 'down'
    : kpi.changeDirection === 'up'
  return positive
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400'
}

function sortBy<T>(arr: T[], key: string, dir: 'asc' | 'desc'): T[] {
  return [...arr].sort((a, b) => {
    const av = (a as Record<string, unknown>)[key]
    const bv = (b as Record<string, unknown>)[key]
    if (typeof av === 'number' && typeof bv === 'number')
      return dir === 'asc' ? av - bv : bv - av
    return dir === 'asc'
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av))
  })
}

// ─── Constants ──────────────────────────────────────────────────────────────

type TabKey = 'sales' | 'cases' | 'accounts' | 'wmPerformance' | 'documents'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'sales', label: 'Sales' },
  { key: 'cases', label: 'Cases' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'wmPerformance', label: 'WM Performance' },
  { key: 'documents', label: 'Documents' },
]

const DATE_PRESETS = ['This Month', 'This Quarter', 'This Year'] as const

const CHART_HEX: Record<string, string> = {
  blue: '#3b82f6',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  emerald: '#10b981',
  neutral: '#a3a3a3',
}

const CHART_DOT: Record<string, string> = {
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  neutral: 'bg-neutral-400',
}

const TIER_BADGE: Record<string, { icon: React.ReactNode; cls: string }> = {
  platinum: {
    icon: <Gem className="w-3 h-3" />,
    cls: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400',
  },
  gold: {
    icon: <Crown className="w-3 h-3" />,
    cls: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  },
  silver: {
    icon: <Award className="w-3 h-3" />,
    cls: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
  },
  bronze: {
    icon: <Medal className="w-3 h-3" />,
    cls: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
  },
}

const DOC_STATUS: Record<string, string> = {
  draft: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
  'under-review':
    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  approved:
    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  delivered:
    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  registered:
    'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400',
}

const RCV_STATUS: Record<string, string> = {
  current:
    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  overdue:
    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  critical: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
}

const WM_STATUS: Record<string, string> = {
  active:
    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  inactive:
    'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function KpiCard({
  kpi,
  compare,
}: {
  kpi: ReportKpi
  compare: boolean
}) {
  const ChangeIcon =
    kpi.changeDirection === 'up'
      ? ArrowUpRight
      : kpi.changeDirection === 'down'
        ? ArrowDownRight
        : Minus
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-4 hover:shadow-md transition-shadow">
      <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
        {kpi.label}
      </p>
      <p className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-50">
        {fmtKpi(kpi)}
      </p>
      {compare && (
        <div className="flex items-center gap-2 mt-2">
          <div
            className={`flex items-center gap-0.5 text-xs font-medium ${changeColor(kpi)}`}
          >
            <ChangeIcon className="w-3 h-3" />
            {kpi.changePercent}%
          </div>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
            vs {fmtPrev(kpi)}
          </span>
        </div>
      )}
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
      <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {title}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {subtitle}
          </p>
        </div>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      {children}
    </div>
  )
}

function SortTh({
  label,
  sortKey,
  active,
  onSort,
  align,
}: {
  label: string
  sortKey: string
  active: boolean
  onSort: (k: string) => void
  align?: 'right'
}) {
  return (
    <th
      className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 select-none whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => onSort(sortKey)}
    >
      <div
        className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {label}
        <ArrowUpDown
          className={`w-3 h-3 ${active ? 'text-orange-500' : 'text-neutral-300 dark:text-neutral-600'}`}
        />
      </div>
    </th>
  )
}

function TableHeader({
  title,
  onExportExcel,
  onExportPdf,
}: {
  title: string
  onExportExcel?: () => void
  onExportPdf?: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
        {title}
      </h4>
      <div className="flex items-center gap-2">
        <button
          onClick={onExportExcel}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
        >
          <Download className="w-3 h-3" />
          Excel
        </button>
        <button
          onClick={onExportPdf}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        >
          <FileText className="w-3 h-3" />
          PDF
        </button>
      </div>
    </div>
  )
}

function RatingStars({ rating }: { rating: number }) {
  if (rating === 0)
    return (
      <span className="text-xs text-neutral-400 dark:text-neutral-500">—</span>
    )
  return (
    <div className="flex items-center gap-0.5">
      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
      <span className="text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
        {rating.toFixed(1)}
      </span>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ReportsAnalytics({
  dateRange,
  sales,
  cases,
  accounts,
  wmPerformance,
  documents,
  onDateRangeChange,
  onCompareToggle,
  onExportExcel,
  onExportPdf,
  onExportAll,
}: ReportsAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('sales')
  const [preset, setPreset] = useState('This Month')
  const [compare, setCompare] = useState(true)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({
    key: '',
    dir: 'asc',
  })

  function handleSort(key: string) {
    setSort((p) => ({
      key,
      dir: p.key === key && p.dir === 'asc' ? 'desc' : 'asc',
    }))
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab)
    setSort({ key: '', dir: 'asc' })
  }

  // Current tab data
  const tabData = {
    sales,
    cases,
    accounts,
    wmPerformance,
    documents,
  }
  const currentKpis = tabData[activeTab].kpis

  // Chart computations — guarded against empty arrays / zero divisors
  const safeMax = (arr: number[]) => (arr.length === 0 ? 0 : Math.max(...arr))
  const salesFunnelMax = sales.pipelineByStage[0]?.value || 1
  const leadSourceMax = safeMax(sales.leadSourceROI.map((s) => s.value))
  const caseTotal = cases.statusBreakdown.reduce((s, c) => s + c.value, 0)
  const resTrendMax = safeMax(cases.resolutionTrend.map((r) => r.avgDays))
  const revMax = safeMax(
    accounts.revenueByMonth.map((m) => Math.max(m.revenue, m.target)),
  )
  const agingMax = safeMax(accounts.agingAnalysis.map((a) => a.amount))
  const wmSalesMax = safeMax(wmPerformance.salesByWM.map((w) => w.value))
  const wmFunnelMax = wmPerformance.conversionFunnel[0]?.value || 1
  const docMonthMax = safeMax(documents.statusOverTime.map((d) => d.created))
  const tmplMax = safeMax(documents.templateBreakdown.map((t) => t.created))

  // Donut gradient for cases — guarded against empty / zero total
  let cum = 0
  const donutGrad =
    caseTotal > 0
      ? `conic-gradient(${cases.statusBreakdown
          .map((item) => {
            const s = cum
            const p = (item.value / caseTotal) * 100
            cum += p
            return `${CHART_HEX[item.color] || '#a3a3a3'} ${s}% ${cum}%`
          })
          .join(', ')})`
      : `conic-gradient(#e5e5e5 0% 100%)`

  return (
    <div className="space-y-6 pb-8">
      {/* ─── Header: Date Range + Compare + Export All ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-neutral-200/50 dark:bg-neutral-800 rounded-lg p-1">
            {DATE_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPreset(p)
                  onDateRangeChange?.({ start: '', end: '', preset: p })
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  preset === p
                    ? 'bg-white dark:bg-neutral-700 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => {
                setPreset('Custom')
                onDateRangeChange?.({
                  start: customStart,
                  end: customEnd,
                  preset: 'Custom',
                })
              }}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                preset === 'Custom'
                  ? 'bg-white dark:bg-neutral-700 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <Calendar className="w-3 h-3" />
              Custom
            </button>
          </div>

          {preset === 'Custom' && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2 py-1">
              <input
                type="date"
                value={customStart}
                max={customEnd || undefined}
                onChange={(e) => {
                  setCustomStart(e.target.value)
                  onDateRangeChange?.({
                    start: e.target.value,
                    end: customEnd,
                    preset: 'Custom',
                  })
                }}
                className="text-xs font-mono bg-transparent text-neutral-700 dark:text-neutral-300 focus:outline-none"
              />
              <span className="text-xs text-neutral-400 dark:text-neutral-500">→</span>
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                onChange={(e) => {
                  setCustomEnd(e.target.value)
                  onDateRangeChange?.({
                    start: customStart,
                    end: e.target.value,
                    preset: 'Custom',
                  })
                }}
                className="text-xs font-mono bg-transparent text-neutral-700 dark:text-neutral-300 focus:outline-none"
              />
            </div>
          )}

          {/* Compare Toggle */}
          <button
            onClick={() => {
              setCompare(!compare)
              onCompareToggle?.(!compare)
            }}
            className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400"
          >
            <div
              className={`relative w-9 h-5 rounded-full transition-colors ${
                compare
                  ? 'bg-orange-500'
                  : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  compare ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="hidden sm:inline">Compare period</span>
          </button>
        </div>

        <button
          onClick={() => onExportAll?.('excel')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download All
        </button>
      </div>

      {/* ─── Tab Bar ─── */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── KPI Cards (shared across tabs) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {currentKpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} compare={compare} />
        ))}
      </div>

      {/* ─── Tab Content ─── */}

      {/* ── SALES ── */}
      {activeTab === 'sales' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Pipeline Funnel"
              subtitle="Lead conversion stages"
              icon={GitMerge}
              iconColor="text-orange-500"
            >
              <div className="p-5 space-y-3">
                {sales.pipelineByStage.map((stage, i) => {
                  const w = salesFunnelMax > 0 ? (stage.value / salesFunnelMax) * 100 : 0
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          {stage.label}
                        </span>
                        <span className="text-xs font-mono font-medium text-neutral-900 dark:text-neutral-100">
                          {stage.value}
                        </span>
                      </div>
                      <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-hidden">
                        <div
                          className="h-full rounded-md bg-gradient-to-r from-orange-500 to-yellow-400"
                          style={{ width: `${w}%`, opacity: 1 - i * 0.15 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </ChartCard>

            <ChartCard
              title="Lead Source ROI"
              subtitle="Revenue by acquisition channel"
              icon={BarChart3}
              iconColor="text-yellow-500"
            >
              <div className="p-5 space-y-3">
                {sales.leadSourceROI.map((src, i) => {
                  const w = leadSourceMax > 0 ? (src.value / leadSourceMax) * 100 : 0
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          {src.label}
                        </span>
                        <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                          {fmtCur(src.value)}{' '}
                          <span className="text-neutral-400 dark:text-neutral-500">
                            · {src.leads} leads
                          </span>
                        </span>
                      </div>
                      <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-hidden">
                        <div
                          className="h-full rounded-md bg-orange-500 dark:bg-orange-400"
                          style={{ width: `${w}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </ChartCard>
          </div>

        </>
      )}

      {/* ── CASES ── */}
      {activeTab === 'cases' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Case Status Breakdown"
              subtitle={`${caseTotal} total cases`}
              icon={CircleDot}
              iconColor="text-blue-500"
            >
              <div className="p-5 flex items-center gap-6">
                <div
                  className="shrink-0 w-28 h-28 rounded-full relative"
                  style={{ background: donutGrad }}
                >
                  <div className="absolute inset-3 bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-50">
                      {caseTotal}
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2.5">
                  {cases.statusBreakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${CHART_DOT[item.color] || 'bg-neutral-400'}`} />
                        <span className="text-xs text-neutral-700 dark:text-neutral-300">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-neutral-900 dark:text-neutral-100">{item.value}</span>
                        <span className="text-[10px] font-mono text-neutral-400 w-8 text-right">
                          {caseTotal > 0 ? ((item.value / caseTotal) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            <ChartCard
              title="Resolution Time Trend"
              subtitle="Average days to resolve"
              icon={TrendingUp}
              iconColor="text-emerald-500"
            >
              <div className="p-5">
                <div className="flex items-end gap-2 h-32">
                  {cases.resolutionTrend.map((pt, i) => {
                    const h = resTrendMax > 0 ? (pt.avgDays / resTrendMax) * 100 : 0
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                          {pt.avgDays}d
                        </span>
                        <div className="w-full relative" style={{ height: `${h}%` }}>
                          <div className="absolute inset-0 rounded-t-md bg-gradient-to-t from-blue-500 to-blue-300 dark:from-blue-600 dark:to-blue-400 opacity-90" />
                        </div>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                          {pt.month.split(' ')[0].slice(0, 3)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </ChartCard>
          </div>

          <div>
            <TableHeader
              title="Lawyer Performance"
              onExportExcel={() => onExportExcel?.('cases')}
              onExportPdf={() => onExportPdf?.('cases')}
            />
            <div className="overflow-x-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-100 dark:border-neutral-800">
                  <tr>
                    <SortTh label="Name" sortKey="name" active={sort.key === 'name'} onSort={handleSort} />
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Specialization</th>
                    <SortTh label="Active" sortKey="activeCases" active={sort.key === 'activeCases'} onSort={handleSort} align="right" />
                    <SortTh label="Done" sortKey="completedCases" active={sort.key === 'completedCases'} onSort={handleSort} align="right" />
                    <SortTh label="Avg Days" sortKey="avgResolutionDays" active={sort.key === 'avgResolutionDays'} onSort={handleSort} align="right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                  {(sort.key
                    ? sortBy(cases.lawyerPerformance, sort.key, sort.dir)
                    : cases.lawyerPerformance
                  ).map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-3 py-3 font-medium text-neutral-900 dark:text-neutral-100">{row.name}</td>
                      <td className="px-3 py-3 text-neutral-500 dark:text-neutral-400 text-xs">{row.specialization}</td>
                      <td className="px-3 py-3 text-right font-mono">{row.activeCases}</td>
                      <td className="px-3 py-3 text-right font-mono">{row.completedCases}</td>
                      <td className="px-3 py-3 text-right font-mono">{row.avgResolutionDays || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── ACCOUNTS ── */}
      {activeTab === 'accounts' && (
        <>
          <div>
            <TableHeader
              title="Outstanding Receivables"
              onExportExcel={() => onExportExcel?.('accounts')}
              onExportPdf={() => onExportPdf?.('accounts')}
            />
            <div className="overflow-x-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-100 dark:border-neutral-800">
                  <tr>
                    <SortTh label="Customer" sortKey="customerName" active={sort.key === 'customerName'} onSort={handleSort} />
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Invoice</th>
                    <SortTh label="Amount" sortKey="amount" active={sort.key === 'amount'} onSort={handleSort} align="right" />
                    <SortTh label="Due Date" sortKey="dueDate" active={sort.key === 'dueDate'} onSort={handleSort} />
                    <SortTh label="Days Overdue" sortKey="daysOverdue" active={sort.key === 'daysOverdue'} onSort={handleSort} align="right" />
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                  {(sort.key
                    ? sortBy(accounts.receivables, sort.key, sort.dir)
                    : accounts.receivables
                  ).map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-3 py-3 font-medium text-neutral-900 dark:text-neutral-100">{row.customerName}</td>
                      <td className="px-3 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">{row.invoiceNumber}</td>
                      <td className="px-3 py-3 text-right font-mono font-medium text-neutral-900 dark:text-neutral-100">{fmtCur(row.amount)}</td>
                      <td className="px-3 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(row.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-3 py-3 text-right font-mono">
                        {row.daysOverdue > 0 ? (
                          <span className="text-red-600 dark:text-red-400">{row.daysOverdue}d</span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide ${RCV_STATUS[row.status] || ''}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── WM PERFORMANCE ── */}
      {activeTab === 'wmPerformance' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Sales by Wealth Manager"
              subtitle="Revenue contribution"
              icon={BarChart3}
              iconColor="text-violet-500"
            >
              <div className="p-5 space-y-3">
                {wmPerformance.salesByWM.map((wm, i) => {
                  const w = wmSalesMax > 0 ? (wm.value / wmSalesMax) * 100 : 0
                  const tier = TIER_BADGE[wm.tier]
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{wm.label}</span>
                          {tier && (
                            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tier.cls}`}>
                              {tier.icon}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono font-medium text-neutral-900 dark:text-neutral-100">{fmtCur(wm.value)}</span>
                      </div>
                      <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-hidden">
                        <div className="h-full rounded-md bg-violet-500 dark:bg-violet-400" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </ChartCard>

            <ChartCard
              title="WM Conversion Funnel"
              subtitle="Partner-sourced lead journey"
              icon={GitMerge}
              iconColor="text-orange-500"
            >
              <div className="p-5 space-y-3">
                {wmPerformance.conversionFunnel.map((stage, i) => {
                  const w = wmFunnelMax > 0 ? (stage.value / wmFunnelMax) * 100 : 0
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{stage.label}</span>
                        <span className="text-xs font-mono font-medium text-neutral-900 dark:text-neutral-100">{stage.value}</span>
                      </div>
                      <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-hidden">
                        <div
                          className="h-full rounded-md bg-gradient-to-r from-orange-500 to-yellow-400"
                          style={{ width: `${w}%`, opacity: 1 - i * 0.15 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </ChartCard>
          </div>

          <div>
            <TableHeader
              title="WM Performance Table"
              onExportExcel={() => onExportExcel?.('wmPerformance')}
              onExportPdf={() => onExportPdf?.('wmPerformance')}
            />
            <div className="overflow-x-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-100 dark:border-neutral-800">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">ID</th>
                    <SortTh label="Name" sortKey="name" active={sort.key === 'name'} onSort={handleSort} />
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Tier</th>
                    <SortTh label="Leads" sortKey="leads" active={sort.key === 'leads'} onSort={handleSort} align="right" />
                    <SortTh label="Conv" sortKey="conversions" active={sort.key === 'conversions'} onSort={handleSort} align="right" />
                    <SortTh label="Sales" sortKey="sales" active={sort.key === 'sales'} onSort={handleSort} align="right" />
                    <SortTh label="Wills Left" sortKey="willsRemaining" active={sort.key === 'willsRemaining'} onSort={handleSort} align="right" />
                    <SortTh label="Pkg Spend" sortKey="totalPackageSpend" active={sort.key === 'totalPackageSpend'} onSort={handleSort} align="right" />
                    <SortTh label="Clients" sortKey="customers" active={sort.key === 'customers'} onSort={handleSort} align="right" />
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                  {(sort.key
                    ? sortBy(wmPerformance.performanceTable, sort.key, sort.dir)
                    : wmPerformance.performanceTable
                  ).map((row) => {
                    const tier = TIER_BADGE[row.tier]
                    return (
                      <tr key={row.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="px-3 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">{row.wmId}</td>
                        <td className="px-3 py-3 font-medium text-neutral-900 dark:text-neutral-100">{row.name}</td>
                        <td className="px-3 py-3">
                          {tier && (
                            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tier.cls}`}>
                              {tier.icon} {row.tier}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-mono">{row.leads}</td>
                        <td className="px-3 py-3 text-right font-mono">{row.conversions}</td>
                        <td className="px-3 py-3 text-right font-mono font-medium text-neutral-900 dark:text-neutral-100">{fmtCur(row.sales)}</td>
                        <td className="px-3 py-3 text-right font-mono">{row.willsRemaining}</td>
                        <td className="px-3 py-3 text-right font-mono">{fmtCur(row.totalPackageSpend)}</td>
                        <td className="px-3 py-3 text-right font-mono">{row.customers}</td>
                        <td className="px-3 py-3">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide ${WM_STATUS[row.status] || ''}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── DOCUMENTS ── */}
      {activeTab === 'documents' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Document Status Over Time"
              subtitle="Monthly created vs approved vs pending"
              icon={FileText}
              iconColor="text-blue-500"
            >
              <div className="p-5">
                <div className="flex items-end gap-2" style={{ height: 128 }}>
                  {documents.statusOverTime.map((pt, i) => {
                    const hCreated = docMonthMax > 0 ? (pt.created / docMonthMax) * 100 : 0
                    const hApproved = docMonthMax > 0 ? (pt.approved / docMonthMax) * 100 : 0
                    const hPending = docMonthMax > 0 ? (pt.pending / docMonthMax) * 100 : 0
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full flex items-end justify-center gap-px flex-1">
                          <div className="w-[30%] rounded-t-sm bg-blue-500" style={{ height: `${hCreated}%`, minHeight: hCreated > 0 ? 4 : 0 }} />
                          <div className="w-[30%] rounded-t-sm bg-emerald-500" style={{ height: `${hApproved}%`, minHeight: hApproved > 0 ? 4 : 0 }} />
                          <div className="w-[30%] rounded-t-sm bg-amber-400" style={{ height: `${hPending}%`, minHeight: hPending > 0 ? 4 : 0 }} />
                        </div>
                        <span className="text-[10px] text-neutral-400 shrink-0">{pt.month.split(' ')[0].slice(0, 3)}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-blue-500 inline-block" /> Created</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" /> Approved</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-amber-400 inline-block" /> Pending</span>
                </div>
              </div>
            </ChartCard>

            <ChartCard
              title="Template Breakdown"
              subtitle="Documents by template type"
              icon={BarChart3}
              iconColor="text-violet-500"
            >
              <div className="p-5 space-y-3">
                {documents.templateBreakdown.map((tmpl, i) => {
                  const total = tmpl.created
                  const approvedW = tmplMax > 0 ? (tmpl.approved / tmplMax) * 100 : 0
                  const pendingW = tmplMax > 0 ? (tmpl.pending / tmplMax) * 100 : 0
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{tmpl.label}</span>
                        <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">{total} total</span>
                      </div>
                      <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-hidden flex">
                        <div className="h-full bg-emerald-500" style={{ width: `${approvedW}%` }} />
                        <div className="h-full bg-amber-400" style={{ width: `${pendingW}%` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-center justify-center gap-4 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" /> Approved</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-amber-400 inline-block" /> Pending</span>
                </div>
              </div>
            </ChartCard>
          </div>

          <div>
            <TableHeader
              title="Document Status"
              onExportExcel={() => onExportExcel?.('documents')}
              onExportPdf={() => onExportPdf?.('documents')}
            />
            <div className="overflow-x-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-100 dark:border-neutral-800">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Doc ID</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Case</th>
                    <SortTh label="Customer" sortKey="customerName" active={sort.key === 'customerName'} onSort={handleSort} />
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Template</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Status</th>
                    <SortTh label="Created" sortKey="createdDate" active={sort.key === 'createdDate'} onSort={handleSort} />
                    <SortTh label="TAT" sortKey="tatDays" active={sort.key === 'tatDays'} onSort={handleSort} align="right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                  {(sort.key
                    ? sortBy(documents.documentTable, sort.key, sort.dir)
                    : documents.documentTable
                  ).map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-3 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">{row.docId}</td>
                      <td className="px-3 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">{row.caseId}</td>
                      <td className="px-3 py-3 font-medium text-neutral-900 dark:text-neutral-100">{row.customerName}</td>
                      <td className="px-3 py-3 text-xs text-neutral-600 dark:text-neutral-400">{row.template}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide ${DOC_STATUS[row.status] || ''}`}>
                          {row.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(row.createdDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-3 py-3 text-right font-mono">
                        <span className={row.tatDays > 5 ? 'text-red-600 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-300'}>
                          {row.tatDays}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
