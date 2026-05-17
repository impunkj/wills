import { Module } from '@nestjs/common'
import { PrismaGlobalModule } from './prisma-global.module'
import { AccountsModule } from './modules/accounts/accounts.module'
import { AuthModule } from './modules/auth/auth.module'
import { CasesModule } from './modules/cases/cases.module'
import { CustomersModule } from './modules/customers/customers.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { LawyersModule } from './modules/lawyers/lawyers.module'
import { PartnersModule } from './modules/partners/partners.module'
import { PrismaModule } from './modules/prisma/prisma.module'
import { ReportsModule } from './modules/reports/reports.module'
import { SalesCrmModule } from './modules/sales-crm/sales-crm.module'
import { TeamModule } from './modules/team/team.module'

@Module({
  imports: [
    PrismaGlobalModule,
    PrismaModule,
    AccountsModule,
    AuthModule,
    CasesModule,
    CustomersModule,
    DashboardModule,
    LawyersModule,
    PartnersModule,
    ReportsModule,
    SalesCrmModule,
    TeamModule,
  ],
})
export class AppModule {}
