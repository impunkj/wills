import 'dotenv/config'
import { Global, Module } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PRISMA_SERVICE } from './modules/sales-crm/services/sales-crm.service'

@Global()
@Module({
  providers: [
    {
      provide: PRISMA_SERVICE,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL
        if (!connectionString) {
          throw new Error('DATABASE_URL is not set')
        }
        const pool = new Pool({ connectionString })
        const adapter = new PrismaPg(pool)
        return new PrismaClient({ adapter })
      },
    },
  ],
  exports: [PRISMA_SERVICE],
})
export class PrismaGlobalModule {}
