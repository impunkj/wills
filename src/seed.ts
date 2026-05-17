import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = [
    { name: 'Anurag Bhatia', email: 'admin@wills24.com', role: 'ADMIN', password: 'admin123' },
    { name: 'Wealth Manager', email: 'wm@wills24.com', role: 'WEALTH_MANAGER', password: 'wm123' },
    { name: 'John Lawyer', email: 'lawyer@wills24.com', role: 'LAWYER', password: 'lawyer123' },
    { name: 'Support Staff', email: 'support@wills24.com', role: 'SUPPORT', password: 'support123' },
  ] as const

  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 10)
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: hashed,
        role: user.role,
      },
      create: { name: user.name, email: user.email, password: hashed, role: user.role },
    })
    console.log(`Created: ${user.email} / ${user.password}`)
  }
  console.log('Seed complete!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
