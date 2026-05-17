import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { SequenceService } from '../sales-crm/services/sequence.service'
import { CasesController } from './cases.controller'
import { CasesService } from './cases.service'

@Module({
  imports: [PrismaModule],
  controllers: [CasesController],
  providers: [CasesService, SequenceService],
  exports: [CasesService],
})
export class CasesModule {}
