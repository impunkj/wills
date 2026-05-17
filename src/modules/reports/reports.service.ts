import { Inject, Injectable } from '@nestjs/common'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import { PRISMA_SERVICE } from '../sales-crm/services/sales-crm.service'

type DateRange = { from: Date; to: Date }

type SaleRow = { createdAt: Date; total?: number | null; netAmount?: number | null }
type CaseRow = { createdAt: Date; status: string; resolvedAt?: Date | null; assignedLawyerId?: string | null }
type TeamMemberRow = { id: string; role?: string | null }
type LawyerRow = { id: string; name: string }

export interface ReportsPrismaServiceLike {
  quotation?: { findMany(args?: Record<string, unknown>): Promise<SaleRow[]> }
  case?: { findMany(args?: Record<string, unknown>): Promise<CaseRow[]> }
  teamMember?: { findMany(args?: Record<string, unknown>): Promise<TeamMemberRow[]> }
  lawyer?: { findMany(args?: Record<string, unknown>): Promise<LawyerRow[]> }
}

@Injectable()
export class ReportsService {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: ReportsPrismaServiceLike,
  ) {}

  async getSalesReport(dateRange: DateRange, comparePrevious = false) {
    const current = await this.buildSalesSummary(dateRange)
    if (!comparePrevious) {
      return { current }
    }

    const priorRange = this.computePriorPeriod(dateRange)
    const prior = await this.buildSalesSummary(priorRange)
    return {
      current,
      prior,
      deltas: this.computeDeltas(current, prior),
      priorPeriod: serializeRange(priorRange),
    }
  }

  async getCaseReport(dateRange: DateRange, comparePrevious = false) {
    const current = await this.buildCaseSummary(dateRange)
    if (!comparePrevious) {
      return { current }
    }

    const priorRange = this.computePriorPeriod(dateRange)
    const prior = await this.buildCaseSummary(priorRange)
    return {
      current,
      prior,
      deltas: this.computeDeltas(current, prior),
      priorPeriod: serializeRange(priorRange),
    }
  }

  async getTeamReport(dateRange: DateRange, comparePrevious = false) {
    const current = await this.buildTeamSummary(dateRange)
    if (!comparePrevious) {
      return { current }
    }

    const priorRange = this.computePriorPeriod(dateRange)
    const prior = await this.buildTeamSummary(priorRange)
    return {
      current,
      prior,
      deltas: this.computeDeltas(current, prior),
      priorPeriod: serializeRange(priorRange),
    }
  }

  async exportExcel(reportType: 'sales' | 'cases' | 'team', dateRange: DateRange): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(reportType)
    const payload = await this.getReportPayload(reportType, dateRange)

    const rows = flattenForRows(payload.current)
    const columnKeys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
    worksheet.columns = columnKeys.map((key) => ({ header: key, key, width: 24 }))
    rows.forEach((row) => worksheet.addRow(row))

    const arrayBuffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(arrayBuffer)
  }

  async exportPDF(reportType: 'sales' | 'cases' | 'team', dateRange: DateRange): Promise<Buffer> {
    const payload = await this.getReportPayload(reportType, dateRange)
    const rows = flattenForRows(payload.current)

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      doc.fontSize(18).text(`Wills24 ${capitalize(reportType)} Report`)
      doc.moveDown()

      rows.forEach((row) => {
        doc.fontSize(10).text(
          Object.entries(row)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(' | '),
        )
        doc.moveDown(0.5)
      })

      doc.end()
    })
  }

  computePriorPeriod(dateRange: DateRange): DateRange {
    const from = new Date(dateRange.from)
    const to = new Date(dateRange.to)
    const durationDays = Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1

    if (durationDays <= 31) {
      return {
        from: shiftDate(from, { years: -1 }),
        to: shiftDate(to, { years: -1 }),
      }
    }

    if (durationDays <= 92) {
      return {
        from: shiftDate(from, { months: -3 }),
        to: shiftDate(to, { months: -3 }),
      }
    }

    return {
      from: shiftDate(from, { days: -(durationDays + 1) }),
      to: shiftDate(from, { days: -1 }),
    }
  }

  private async getReportPayload(reportType: 'sales' | 'cases' | 'team', dateRange: DateRange) {
    if (reportType === 'sales') {
      return this.getSalesReport(dateRange, false)
    }
    if (reportType === 'cases') {
      return this.getCaseReport(dateRange, false)
    }
    return this.getTeamReport(dateRange, false)
  }

  private async buildSalesSummary(dateRange: DateRange) {
    const rows = (await this.prisma.quotation?.findMany()) ?? []
    const filtered = rows.filter((row) => isWithinRange(row.createdAt, dateRange))
    const totalSales = filtered.reduce(
      (sum, row) => sum + Number(row.total ?? row.netAmount ?? 0),
      0,
    )
    return {
      totalSales,
      count: filtered.length,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    }
  }

  private async buildCaseSummary(dateRange: DateRange) {
    const rows = (await this.prisma.case?.findMany()) ?? []
    const filtered = rows.filter((row) => isWithinRange(row.createdAt, dateRange))
    const byStatus = filtered.reduce<Record<string, number>>((accumulator, row) => {
      accumulator[row.status] = (accumulator[row.status] ?? 0) + 1
      return accumulator
    }, {})
    return {
      totalCases: filtered.length,
      byStatus,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    }
  }

  private async buildTeamSummary(dateRange: DateRange) {
    const [teamMembers, lawyers, cases] = await Promise.all([
      this.prisma.teamMember?.findMany?.() ?? Promise.resolve([]),
      this.prisma.lawyer?.findMany?.() ?? Promise.resolve([]),
      this.prisma.case?.findMany?.() ?? Promise.resolve([]),
    ])

    const filteredCases = cases.filter((row) => isWithinRange(row.createdAt, dateRange))
    const perLawyer = lawyers.map((lawyer) => {
      const assigned = filteredCases.filter((row) => row.assignedLawyerId === lawyer.id)
      const resolved = assigned.filter((row) => row.resolvedAt)
      const avgResolutionDays =
        resolved.length === 0
          ? 0
          : resolved.reduce((sum, row) => {
              const resolvedAt = row.resolvedAt ?? row.createdAt
              return sum + Math.max(0, Math.ceil((resolvedAt.getTime() - row.createdAt.getTime()) / 86400000))
            }, 0) / resolved.length

      return {
        lawyerId: lawyer.id,
        name: lawyer.name,
        caseCount: assigned.length,
        avgResolutionDays,
      }
    })

    return {
      totalTeamMembers: teamMembers.length,
      activeLawyers: lawyers.length,
      perLawyer,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    }
  }

  private computeDeltas(
    current: Record<string, unknown>,
    prior: Record<string, unknown>,
  ) {
    const deltas: Record<string, number> = {}
    Object.keys(current).forEach((key) => {
      if (typeof current[key] === 'number' && typeof prior[key] === 'number') {
        deltas[key] = Number(current[key]) - Number(prior[key])
      }
    })
    return deltas
  }
}

function isWithinRange(date: Date, range: DateRange) {
  return date.getTime() >= range.from.getTime() && date.getTime() <= range.to.getTime()
}

function shiftDate(date: Date, offset: { years?: number; months?: number; days?: number }) {
  const next = new Date(date)
  if (offset.years) next.setUTCFullYear(next.getUTCFullYear() + offset.years)
  if (offset.months) next.setUTCMonth(next.getUTCMonth() + offset.months)
  if (offset.days) next.setUTCDate(next.getUTCDate() + offset.days)
  return next
}

function flattenForRows(input: Record<string, unknown>) {
  return Object.entries(input).map(([key, value]) => ({
    metric: key,
    value: typeof value === 'object' ? JSON.stringify(value) : value,
  }))
}

function serializeRange(range: DateRange) {
  return {
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
