import { useState, useMemo, useRef, useEffect } from 'react'
import { useInitialLoading } from '@/lib/use-initial-loading'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  DashboardHomeProps,
  KpiStats,
  ActivityFeedItem,
  PendingItem,
  CaseStatusEntry,
  SalesTrendPoint,
  MonthlyRevenueEntry,
  ConversionFunnelStage,
  QuickAction,
} from './types'
import {
  IndianRupee,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock,
  UserPlus,
  Handshake,
  Wallet,
  Users,
  ListTodo,
  Calendar,
  Scale,
  FileText,
  Upload,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  CircleDot,
  ChevronRight,
  Target,
  TrendingUp,
  GitMerge,
  Sparkles,
  X,
} from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`
  return `₹${value.toLocaleString('en-IN')}`
}

function formatCurrencyFull(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`
}

function timeAgo(timestamp: string): string {
  const now = new Date('2026-04-17T12:00:00Z')
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DATE_PRESETS = ['Today', 'This Week', 'This Month', 'This Quarter'] as const

const SEVERITY_CONFIG: Record<string, { dot: string; badge: string; pulse: boolean }> = {
  critical: {
    dot: 'bg-red-500',
    badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
    pulse: true,
  },
  high: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
    pulse: false,
  },
  medium: {
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
    pulse: false,
  },
  low: {
    dot: 'bg-neutral-400 dark:bg-neutral-500',
    badge: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
    pulse: false,
  },
}

const ROLE_DOT: Record<string, string> = {
  admin: 'bg-orange-500',
  operations: 'bg-blue-500',
  system: 'bg-neutral-400 dark:bg-neutral-500',
  partner: 'bg-violet-500',
  lawyer: 'bg-emerald-500',
}

const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  lead: UserPlus,
  case: Briefcase,
  payment: IndianRupee,
  customer: Users,
  document: FileText,
  invoice: Receipt,
  wallet: Wallet,
  package: IndianRupee,
  followup: Calendar,
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'user-plus': UserPlus,
  'briefcase': Briefcase,
  'file-text': FileText,
  'scale': Scale,
  'handshake': Handshake,
  'wallet': Wallet,
  'receipt': Receipt,
  'upload': Upload,
  'calendar': Calendar,
}

const MODULE_STYLE: Record<string, string> = {
  'sales-crm': 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30',
  'case-management': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30',
  'partners': 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30',
  'accounts': 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
}

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

// ─── Timeframe Scaling ──────────────────────────────────────────────────────

const PRESET_MULTIPLIERS: Record<string, number> = {
  'Today': 0.08,
  'This Week': 0.3,
  'This Month': 1,
  'This Quarter': 2.8,
}

function scaleKpis(base: KpiStats, preset: string): KpiStats {
  const m = PRESET_MULTIPLIERS[preset] ?? 1
  return {
    totalSales: Math.round(base.totalSales * m),
    revenueThisMonth: Math.round(base.revenueThisMonth * m),
    revenuePreviousMonth: Math.round(base.revenuePreviousMonth * m),
    activeCases: preset === 'Today' ? Math.max(2, Math.round(base.activeCases * 0.3)) : preset === 'This Week' ? Math.round(base.activeCases * 0.7) : Math.round(base.activeCases * m),
    completedCases: Math.max(preset === 'Today' ? 1 : 3, Math.round(base.completedCases * m)),
    avgResolutionDays: base.avgResolutionDays,
    newLeads: Math.max(1, Math.round(base.newLeads * m)),
    newLeadsPreviousMonth: Math.max(1, Math.round(base.newLeadsPreviousMonth * m)),
    totalCustomers: base.totalCustomers,
    activePartners: base.activePartners,
    totalPartners: base.totalPartners,
    willsRemaining: base.willsRemaining,
    activeTeamMembers: base.activeTeamMembers,
    totalTeamMembers: base.totalTeamMembers,
    tasksAssigned: Math.max(2, Math.round(base.tasksAssigned * m)),
    slaBreaches: Math.max(preset === 'Today' ? 0 : 1, Math.round(base.slaBreaches * m)),
    overdueFollowUps: Math.max(preset === 'Today' ? 1 : 2, Math.round(base.overdueFollowUps * m)),
    conversionRate: base.conversionRate,
  }
}

function scaleFunnel(base: ConversionFunnelStage[], preset: string): ConversionFunnelStage[] {
  const m = PRESET_MULTIPLIERS[preset] ?? 1
  return base.map((s) => ({ ...s, count: Math.max(1, Math.round(s.count * m)) }))
}

function scaleCaseStatus(base: CaseStatusEntry[], preset: string): CaseStatusEntry[] {
  const m = PRESET_MULTIPLIERS[preset] ?? 1
  return base.map((s) => ({ ...s, count: Math.max(1, Math.round(s.count * m)) }))
}

// ─── Interactive Line Chart ─────────────────────────────────────────────────

function SalesTrendChart({ data, formatValue }: { data: { month: string; value: number }[]; formatValue: (v: number) => string }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  const maxVal = Math.max(...data.map((d) => d.value))
  const minVal = Math.min(...data.map((d) => d.value)) * 0.85
  const range = maxVal - minVal || 1

  const points = data.map((pt, i) => {
    const xPct = data.length > 1 ? (i / (data.length - 1)) * 100 : 50
    const yPct = ((pt.value - minVal) / range) * 100
    return { xPct, yPct, ...pt }
  })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!chartRef.current) return
    const rect = chartRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    const idx = Math.round(pct * (data.length - 1))
    setHoverIndex(Math.max(0, Math.min(data.length - 1, idx)))
  }

  return (
    <div
      ref={chartRef}
      className="relative h-44 cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIndex(null)}
    >
      {/* SVG chart */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line key={pct} x1="0" y1={100 - pct * 100} x2="100" y2={100 - pct * 100} stroke="currentColor" className="text-neutral-100 dark:text-neutral-800" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        ))}
        {/* Area */}
        <path
          d={`${points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.xPct} ${100 - p.yPct}`).join(' ')} L ${points[points.length - 1].xPct} 100 L ${points[0].xPct} 100 Z`}
          fill="url(#salesAreaGrad)"
        />
        {/* Line */}
        <path
          d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.xPct} ${100 - p.yPct}`).join(' ')}
          fill="none" stroke="#f97316" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>

      {/* Hover overlay — vertical line, dot, tooltip */}
      {hoverIndex !== null && (
        <>
          {/* Vertical line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-orange-400/50 pointer-events-none"
            style={{ left: `${points[hoverIndex].xPct}%` }}
          />
          {/* Dot */}
          <div
            className="absolute w-3 h-3 rounded-full bg-white border-2 border-orange-500 shadow-sm pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${points[hoverIndex].xPct}%`,
              top: `${100 - points[hoverIndex].yPct}%`,
            }}
          />
          {/* Tooltip */}
          <div
            className="absolute pointer-events-none -translate-x-1/2 z-10"
            style={{
              left: `${points[hoverIndex].xPct}%`,
              top: `${100 - points[hoverIndex].yPct - 12}%`,
            }}
          >
            <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[11px] font-mono font-medium px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap">
              {formatValue(points[hoverIndex].value)}
              <span className="text-neutral-400 dark:text-neutral-500 ml-1.5">
                {points[hoverIndex].month}
              </span>
            </div>
          </div>
        </>
      )}

      {/* X-axis labels */}
      <div className="absolute -bottom-10 left-0 right-0 flex justify-between">
        {data.map((pt, i) => (
          <div key={i} className="flex flex-col items-center" style={{ width: `${100 / data.length}%` }}>
            <span className={`text-[10px] font-mono transition-colors ${hoverIndex === i ? 'text-orange-600 dark:text-orange-400 font-semibold' : 'text-neutral-500 dark:text-neutral-400'}`}>
              {formatValue(pt.value)}
            </span>
            <span className={`text-[10px] transition-colors ${hoverIndex === i ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500 dark:text-neutral-400'}`}>
              {pt.month.split(' ')[0].slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Case Status Donut ──────────────────────────────────────────────────────

function CaseStatusDonut({ data, total }: { data: { status: string; count: number; color: string }[]; total: number }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  // SVG donut parameters
  const cx = 60, cy = 60, r = 48, strokeW = 14
  const circumference = 2 * Math.PI * r

  // Build arc segments
  let cumOffset = 0
  const segments = data.map((item, i) => {
    const pct = total > 0 ? item.count / total : 0
    const dashLen = pct * circumference
    const gap = circumference - dashLen
    const offset = -cumOffset + circumference * 0.25 // start from top
    cumOffset += dashLen
    return { ...item, dashLen, gap, offset, index: i }
  })

  const hovered = hoverIndex !== null ? data[hoverIndex] : null

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Case Status</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{total} total cases</p>
          </div>
          <CircleDot className="w-4 h-4 text-blue-500" />
        </div>
      </div>
      <div className="p-5 flex items-center gap-6">
        {/* Donut SVG */}
        <div className="shrink-0 relative" style={{ width: 120, height: 120 }}>
          <svg viewBox="0 0 120 120" width="120" height="120">
            {segments.map((seg) => (
              <circle
                key={seg.index}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={CHART_HEX[seg.color] || '#a3a3a3'}
                strokeWidth={hoverIndex === seg.index ? strokeW + 4 : strokeW}
                strokeDasharray={`${seg.dashLen} ${seg.gap}`}
                strokeDashoffset={seg.offset}
                opacity={hoverIndex !== null && hoverIndex !== seg.index ? 0.35 : 1}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoverIndex(seg.index)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            ))}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {hovered ? (
              <>
                <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-50 leading-none">
                  {hovered.count}
                </span>
                <span className="text-[10px] text-neutral-600 dark:text-neutral-400 mt-0.5 leading-none">
                  {hovered.status}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-50">
                {total}
              </span>
            )}
          </div>
        </div>
        {/* Legend */}
        <div className="flex-1 space-y-2.5">
          {data.map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-between text-sm rounded-md px-2 py-1 -mx-2 cursor-pointer transition-colors duration-150 ${
                hoverIndex === i
                  ? 'bg-neutral-100 dark:bg-neutral-800'
                  : hoverIndex !== null
                    ? 'opacity-40'
                    : ''
              }`}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${CHART_DOT[item.color] || 'bg-neutral-400'}`}
                />
                <span className="text-neutral-700 dark:text-neutral-300 text-xs">{item.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-neutral-900 dark:text-neutral-100 font-medium text-xs">
                  {item.count}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono w-8 text-right">
                  {total > 0 ? ((item.count / total) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  iconColor,
  trend,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  trend?: { value: string; up: boolean }
}) {
  return (
    <div
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider leading-tight">
          {label}
        </p>
        <Icon className={`w-4 h-4 ${iconColor} shrink-0`} />
      </div>
      <p className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-50">
        {value}
      </p>
      {trend && (
        <div
          className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${
            trend.up
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {trend.up ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {trend.value} vs last month
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
      <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {title}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              {subtitle}
            </p>
          </div>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      {children}
    </div>
  )
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="px-5 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
      {message}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function DashboardHome({
  kpiStats,
  activityFeed,
  pendingItems,
  salesTrend,
  caseStatusDistribution,
  monthlyRevenue,
  conversionFunnel,
  quickActions,
  user,
  onDateRangeChange,
  onQuickAction,
  onActivityClick,
  onPendingItemClick,
}: DashboardHomeProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('This Month')
  const isLoading = useInitialLoading()

  const firstName = user.name.split(' ')[0]

  // ─── Since-last-visit banner ─────────────────────────────────────────
  const STORAGE_KEY = 'wills24:lastVisitedAt'
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [lastVisitedAt, setLastVisitedAt] = useState<string | null>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    setLastVisitedAt(stored)
  }, [])

  const sinceLastVisit = useMemo(() => {
    // Use the most recent activity as the "now" anchor (data uses 2026-04 dates)
    if (!activityFeed.length) return { total: 0, byType: {} as Record<string, number> }
    const anchor = Math.max(...activityFeed.map((a) => new Date(a.timestamp).getTime()))
    // Default cutoff: 24h before the most recent activity, so first-time users see "new" items
    const cutoff = lastVisitedAt
      ? new Date(lastVisitedAt).getTime()
      : anchor - 24 * 60 * 60 * 1000
    const recent = activityFeed.filter((a) => new Date(a.timestamp).getTime() > cutoff)
    const byType: Record<string, number> = {}
    recent.forEach((a) => {
      byType[a.entityType] = (byType[a.entityType] ?? 0) + 1
    })
    return { total: recent.length, byType }
  }, [activityFeed, lastVisitedAt])

  function dismissBanner() {
    setBannerDismissed(true)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    }
  }

  const showSinceBanner = !bannerDismissed && sinceLastVisit.total > 0

  // Scale data based on selected timeframe
  const scaledKpiStats = useMemo(() => scaleKpis(kpiStats, selectedPreset), [kpiStats, selectedPreset])
  const scaledFunnel = useMemo(() => scaleFunnel(conversionFunnel, selectedPreset), [conversionFunnel, selectedPreset])
  const scaledCaseStatus = useMemo(() => scaleCaseStatus(caseStatusDistribution, selectedPreset), [caseStatusDistribution, selectedPreset])

  // Derived metrics
  const revenueChange =
    scaledKpiStats.revenuePreviousMonth > 0
      ? (
          ((scaledKpiStats.revenueThisMonth - scaledKpiStats.revenuePreviousMonth) /
            scaledKpiStats.revenuePreviousMonth) *
          100
        ).toFixed(1)
      : '0'
  const revenueUp = scaledKpiStats.revenueThisMonth >= scaledKpiStats.revenuePreviousMonth

  const leadsChange =
    scaledKpiStats.newLeadsPreviousMonth > 0
      ? (
          ((scaledKpiStats.newLeads - scaledKpiStats.newLeadsPreviousMonth) /
            scaledKpiStats.newLeadsPreviousMonth) *
          100
        ).toFixed(1)
      : '0'
  const leadsUp = scaledKpiStats.newLeads >= scaledKpiStats.newLeadsPreviousMonth

  // Sort pending items by severity
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }
  const sortedPending = [...pendingItems].sort(
    (a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9),
  )

  // Chart data
  const salesMax = Math.max(...salesTrend.map((s) => s.value))
  const revenueBarMax = Math.max(
    ...monthlyRevenue.map((m) => Math.max(m.revenue, m.target)),
  )
  const funnelMax = scaledFunnel[0]?.count || 1
  const caseTotal = scaledCaseStatus.reduce((sum, c) => sum + c.count, 0)

  // Donut gradient
  let cum = 0
  const conicParts = scaledCaseStatus.map((item) => {
    const start = cum
    const pct = (item.count / caseTotal) * 100
    cum += pct
    return `${CHART_HEX[item.color] || '#a3a3a3'} ${start}% ${cum}%`
  })
  const donutGradient = `conic-gradient(${conicParts.join(', ')})`

  // KPI definitions
  const kpis = [
    {
      label: 'Total Sales',
      value: formatCurrency(scaledKpiStats.totalSales),
      icon: IndianRupee,

      iconColor: 'text-orange-500',
    },
    {
      label: 'Active Cases',
      value: scaledKpiStats.activeCases.toString(),
      icon: Briefcase,

      iconColor: 'text-blue-500',
    },
    {
      label: 'Completed Cases',
      value: scaledKpiStats.completedCases.toString(),
      icon: CheckCircle2,

      iconColor: 'text-emerald-500',
    },
    {
      label: 'Avg Resolution',
      value: `${scaledKpiStats.avgResolutionDays}d`,
      icon: Clock,

      iconColor: 'text-blue-400',
    },
    {
      label: 'New Leads',
      value: scaledKpiStats.newLeads.toString(),
      icon: UserPlus,

      iconColor: 'text-yellow-500',
    },
    {
      label: 'Active Partners',
      value: `${scaledKpiStats.activePartners}/${scaledKpiStats.totalPartners}`,
      icon: Handshake,

      iconColor: 'text-violet-500',
    },
    {
      label: 'Cases Remaining',
      value: scaledKpiStats.willsRemaining.toString(),
      icon: FileText,

      iconColor: 'text-violet-500',
    },
    {
      label: 'Team Active',
      value: `${scaledKpiStats.activeTeamMembers}/${scaledKpiStats.totalTeamMembers}`,
      icon: Users,
      iconColor: 'text-violet-400',
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        {/* Greeting */}
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-9 w-64" />
        </div>
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-4 space-y-2"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-5 space-y-3"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-44 w-full" />
            </div>
          ))}
        </div>
        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-5 space-y-3"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-44 w-full" />
            </div>
          ))}
        </div>
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ─── Greeting + Date Selector ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
            {getGreeting()},{' '}
            <span className="text-orange-500">{firstName}</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 font-mono">
            {new Date('2026-04-17').toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-neutral-200/50 dark:bg-neutral-800 rounded-lg p-1">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setSelectedPreset(preset)
                onDateRangeChange?.({ start: '', end: '', preset })
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                selectedPreset === preset
                  ? 'bg-white dark:bg-neutral-700 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      {/* ─── Charts 2×2 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Trend */}
        <ChartCard
          title="Sales Trend"
          subtitle="Last 6 months"
          icon={TrendingUp}
          iconColor="text-orange-500"
        >
          {salesTrend.length > 0 ? (
            <div className="px-5 pt-5 pb-12">
              <SalesTrendChart data={salesTrend} formatValue={formatCurrency} />
            </div>
          ) : (
            <EmptyPanel message="No sales trend data for the selected period." />
          )}
        </ChartCard>

        {/* Case Status Donut */}
        {scaledCaseStatus.length > 0 ? (
          <CaseStatusDonut
            data={scaledCaseStatus}
            total={caseTotal}
          />
        ) : (
          <ChartCard
            title="Case Status"
            subtitle="0 total cases"
            icon={CircleDot}
            iconColor="text-blue-500"
          >
            <EmptyPanel message="No case status data for the selected period." />
          </ChartCard>
        )}

        {/* Recent Activity */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  Recent Activity
                </h3>
              </div>
              <Clock className="w-4 h-4 text-neutral-500" />
            </div>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[280px] overflow-y-auto">
            {activityFeed.length > 0 ? activityFeed.slice(0, 8).map((item) => {
              const dotColor = ROLE_DOT[item.actorRole] || 'bg-neutral-400'
              const EntityIcon = ENTITY_ICONS[item.entityType] || CircleDot
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onActivityClick?.(item.entityType, item.entityId)}
                  className="group w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                  aria-label={`${item.actor} ${item.action} — open ${item.entityType}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full ${dotColor} flex items-center justify-center shrink-0`}
                  >
                    <EntityIcon className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-700 dark:text-neutral-300">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {item.actor}
                      </span>{' '}
                      {item.action}
                    </p>
                  </div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono whitespace-nowrap shrink-0">
                    {timeAgo(item.timestamp)}
                  </span>
                  <ChevronRight
                    className="w-3.5 h-3.5 shrink-0 text-neutral-300 dark:text-neutral-600 opacity-0 group-hover:opacity-100 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-opacity"
                  />
                </button>
              )
            }) : <EmptyPanel message="No recent activity yet." />}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  Pending Items
                </h3>
              </div>
              <ListTodo className="w-4 h-4 text-neutral-500" />
            </div>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[280px] overflow-y-auto">
            {sortedPending.length > 0 ? sortedPending.map((item) => {
              const severity = SEVERITY_CONFIG[item.severity] ?? SEVERITY_CONFIG.low
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPendingItemClick?.(item.id)}
                  className="group w-full px-5 py-3 flex items-start gap-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                >
                  <div className="mt-1 shrink-0">
                    <span
                      className={`block w-2.5 h-2.5 rounded-full ${severity.dot} ${
                        severity.pulse ? 'animate-pulse' : ''
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {item.title}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${severity.badge}`}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight
                    className="mt-0.5 w-3.5 h-3.5 shrink-0 text-neutral-300 dark:text-neutral-600 opacity-0 group-hover:opacity-100 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-opacity"
                  />
                </button>
              )
            }) : <EmptyPanel message="No pending items right now." />}
          </div>
        </div>

        {/* Conversion Funnel */}
        <ChartCard
          title="Conversion Funnel"
          subtitle="Lead to customer journey"
          icon={GitMerge}
          iconColor="text-yellow-500"
        >
          {scaledFunnel.length > 0 ? (
            <div className="p-5 space-y-3">
              {scaledFunnel.map((stage, i) => {
                const w = funnelMax > 0 ? (stage.count / funnelMax) * 100 : 0
                const opacity = 1 - i * 0.15
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {stage.stage}
                      </span>
                      <span className="text-xs font-mono font-medium text-neutral-900 dark:text-neutral-100">
                        {stage.count}
                      </span>
                    </div>
                    <div className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md bg-gradient-to-r from-orange-500 to-yellow-400"
                        style={{ width: `${w}%`, opacity }}
                      />
                    </div>
                  </div>
                )
              })}
              <p className="pt-2 text-xs text-neutral-600 dark:text-neutral-400 text-center font-mono">
                Overall conversion:{' '}
                <strong className="text-orange-600 dark:text-orange-400">
                  {scaledKpiStats.conversionRate}%
                </strong>
              </p>
            </div>
          ) : (
            <EmptyPanel message="No conversion data for the selected period." />
          )}
        </ChartCard>
      </div>

      {/* ─── Quick Actions ─── */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {quickActions.map((action) => {
            const Icon = ACTION_ICONS[action.icon] || CircleDot
            const modStyle =
              MODULE_STYLE[action.module] ||
              'text-neutral-500 bg-neutral-50 dark:bg-neutral-800'
            return (
              <button
                key={action.id}
                onClick={() => onQuickAction?.(action.id)}
                className="flex items-center gap-3 p-3 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-md transition-all group text-left cursor-pointer"
              >
                <div
                  className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${modStyle} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 leading-tight">
                  {action.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
