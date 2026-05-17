import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { DashboardService } from './dashboard.service'

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  getSummary(@Query('period') period = 'this_month') {
    return this.service.getSummary(period)
  }

  @Get('activity-feed')
  getActivityFeed() {
    return this.service.getActivityFeed()
  }

  @Get('pending-items')
  getPendingItems() {
    return this.service.getPendingItems()
  }

  @Get('sales-trend')
  getSalesTrend() {
    return this.service.getSalesTrend()
  }

  @Get('case-status')
  getCaseStatus() {
    return this.service.getCaseStatusBreakdown()
  }
}
