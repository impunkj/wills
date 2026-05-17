import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ReportQueryDto } from './dto/report-query.dto'
import { ReportsService } from './reports.service'

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  getSales(@Query() query: ReportQueryDto) {
    return this.reportsService.getSalesReport(
      { from: query.from, to: query.to },
      query.comparePrevious ?? false,
    )
  }

  @Get('cases')
  getCases(@Query() query: ReportQueryDto) {
    return this.reportsService.getCaseReport(
      { from: query.from, to: query.to },
      query.comparePrevious ?? false,
    )
  }

  @Get('team')
  getTeam(@Query() query: ReportQueryDto) {
    return this.reportsService.getTeamReport(
      { from: query.from, to: query.to },
      query.comparePrevious ?? false,
    )
  }

  @Get('export/excel')
  exportExcel(
    @Query() query: ReportQueryDto & { reportType: 'sales' | 'cases' | 'team' },
  ) {
    return this.reportsService.exportExcel(query.reportType, {
      from: query.from,
      to: query.to,
    })
  }

  @Get('export/pdf')
  exportPdf(
    @Query() query: ReportQueryDto & { reportType: 'sales' | 'cases' | 'team' },
  ) {
    return this.reportsService.exportPDF(query.reportType, {
      from: query.from,
      to: query.to,
    })
  }
}
