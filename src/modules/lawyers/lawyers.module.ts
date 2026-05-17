import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { LawyersController } from './lawyers.controller'
import { LawyersService } from './lawyers.service'

@Module({
  imports: [PrismaModule],
  controllers: [LawyersController],
  providers: [LawyersService],
  exports: [LawyersService],
})
export class LawyersModule {}
