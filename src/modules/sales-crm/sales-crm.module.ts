import { Module } from '@nestjs/common'
import { SalesCrmController } from './controllers/sales-crm.controller'
import { SalesCrmService } from './services/sales-crm.service'
import { SequenceService } from './services/sequence.service'

@Module({
  controllers: [SalesCrmController],
  providers: [SalesCrmService, SequenceService],
  exports: [SalesCrmService, SequenceService],
})
export class SalesCrmModule {}
