import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { SequenceService } from '../sales-crm/services/sequence.service'
import { AccountsController } from './accounts.controller'
import { AccountsService } from './accounts.service'

@Module({
  imports: [PrismaModule],
  controllers: [AccountsController],
  providers: [AccountsService, SequenceService],
  exports: [AccountsService],
})
export class AccountsModule {}
