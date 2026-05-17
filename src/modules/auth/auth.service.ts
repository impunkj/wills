import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { PRISMA_SERVICE } from '../sales-crm/services/sales-crm.service'

type TeamRole = 'ADMIN' | 'WEALTH_MANAGER' | 'LAWYER' | 'SUPPORT'

type AuthUserRow = {
  id: string
  name: string
  email: string
  password: string
  role: TeamRole
}

type PrismaUserClient = {
  findUnique(args: Record<string, unknown>): Promise<AuthUserRow | null>
}

interface AuthPrismaServiceLike {
  user: PrismaUserClient
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: AuthPrismaServiceLike,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const valid = await bcrypt.compare(password, user.password ?? '')
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }
  }
}
