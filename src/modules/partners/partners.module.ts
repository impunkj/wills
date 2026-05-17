import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { SequenceService } from '../sales-crm/services/sequence.service'
import { PartnersController } from './partners.controller'
import { PartnersService } from './partners.service'

@Module({
  imports: [PrismaModule],
  controllers: [PartnersController],
  providers: [PartnersService, SequenceService],
  exports: [PartnersService],
})
export class PartnersModule {}
