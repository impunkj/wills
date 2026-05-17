// =============================================================================
// Data Types
// =============================================================================

export interface ReportKpi {
  id: string
  label: string
  value: number
  previousValue: number
  changePercent: number
  changeDirection: 'up' | 'down' | 'flat'
  format: 'currency' | 'number' | 'percent' | 'days'
}

export interface DateRange {
  label: string
  start: string
  end: string
}

export interface DateRangeConfig {
  current: DateRange
  previous: DateRange
}

// ─── Chart Data ─────────────────────────────────────────────────────────────

export interface FunnelStage {
  label: string
  value: number
}

export interface LeadSourceEntry {
  label: string
  value: number
  leads: number
}

export interface StatusSegment {
  label: string
  value: number
  color: string
}

export interface TrendPoint {
  month: string
  avgDays: number
}

export interface RevenueMonth {
  month: string
  revenue: number
  target: number
}

export interface AgingBucket {
  label: string
  amount: number
  count: number
  color: string
}

export interface WMSalesEntry {
  label: string
  value: number
  tier: 'platinum' | 'gold' | 'silver' | 'bronze'
}

export interface DocumentStatusMonth {
  month: string
  created: number
  approved: number
  pending: number
}

export interface TemplateBreakdownEntry {
  label: string
  created: number
  approved: number
  pending: number
}

// ─── Table Rows ─────────────────────────────────────────────────────────────

export interface SalesTeamRow {
  id: string
  name: string
  role: string
  leadsAssigned: number
  conversions: number
  revenue: number
  conversionRate: number
  avgDealSize: number
}

export interface LawyerPerformanceRow {
  id: string
  name: string
  specialization: string
  activeCases: number
  completedCases: number
  avgResolutionDays: number
  slaCompliance: number
  rating: number
}

export interface ReceivableRow {
  id: string
  customerName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  daysOverdue: number
  status: 'current' | 'overdue' | 'critical'
}

export interface WMPerformanceRow {
  id: string
  wmId: string
  name: string
  tier: 'platinum' | 'gold' | 'silver' | 'bronze'
  currentTier: 'platinum' | 'gold' | 'silver' | 'bronze'
  leads: number
  conversions: number
  sales: number
  willsRemaining: number
  totalPackageSpend: number
  customers: number
  status: 'active' | 'inactive'
}

export interface DocumentStatusRow {
  id: string
  docId: string
  caseId: string
  customerName: string
  template: string
  status: 'draft' | 'under-review' | 'approved' | 'delivered' | 'registered'
  createdDate: string
  tatDays: number
}

// ─── Tab Data ───────────────────────────────────────────────────────────────

export interface SalesTabData {
  kpis: ReportKpi[]
  pipelineByStage: FunnelStage[]
  leadSourceROI: LeadSourceEntry[]
  teamPerformance: SalesTeamRow[]
}

export interface CasesTabData {
  kpis: ReportKpi[]
  statusBreakdown: StatusSegment[]
  resolutionTrend: TrendPoint[]
  lawyerPerformance: LawyerPerformanceRow[]
}

export interface AccountsTabData {
  kpis: ReportKpi[]
  revenueByMonth: RevenueMonth[]
  agingAnalysis: AgingBucket[]
  receivables: ReceivableRow[]
}

export interface WMPerformanceTabData {
  kpis: ReportKpi[]
  salesByWM: WMSalesEntry[]
  conversionFunnel: FunnelStage[]
  performanceTable: WMPerformanceRow[]
}

export interface DocumentsTabData {
  kpis: ReportKpi[]
  statusOverTime: DocumentStatusMonth[]
  templateBreakdown: TemplateBreakdownEntry[]
  documentTable: DocumentStatusRow[]
}

// =============================================================================
// Component Props
// =============================================================================

export interface ReportsAnalyticsProps {
  /** Current and previous date range for period comparison */
  dateRange: DateRangeConfig
  /** Sales tab data: pipeline, lead source ROI, team performance */
  sales: SalesTabData
  /** Cases tab data: status breakdown, resolution trends, lawyer performance */
  cases: CasesTabData
  /** Accounts tab data: revenue, aging, receivables */
  accounts: AccountsTabData
  /** WM Performance tab data: sales by WM, conversion funnel, performance table */
  wmPerformance: WMPerformanceTabData
  /** Documents tab data: status over time, template breakdown, document table */
  documents: DocumentsTabData
  /** Called when the date range is changed */
  onDateRangeChange?: (range: { start: string; end: string; preset?: string }) => void
  /** Called when the compare toggle is changed */
  onCompareToggle?: (enabled: boolean) => void
  /** Called when the user exports a tab as Excel */
  onExportExcel?: (tab: string) => void
  /** Called when the user exports a tab as PDF */
  onExportPdf?: (tab: string) => void
  /** Called when the user exports all tabs */
  onExportAll?: (format: 'excel' | 'pdf') => void
}
