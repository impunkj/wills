import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { SalesCrmRole } from '../types/sales-crm.types'

export const ROLES_KEY = 'roles'

const FULL_ACCESS_ROLES: SalesCrmRole[] = ['Admin', 'Sales']
const READ_ONLY_ROLES: SalesCrmRole[] = ['Operations', 'Legal']
const BLOCKED_ROLES: SalesCrmRole[] = ['Accounts', 'HR']

type JwtUserPayload = {
  sub?: string
  role?: string
  roles?: string[]
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ method?: string; user?: JwtUserPayload }>()
    const user = request.user

    if (!user) {
      throw new UnauthorizedException('Missing authenticated user payload')
    }

    const role = this.resolveRole(user)
    if (!role) {
      throw new UnauthorizedException('User role is missing from JWT payload')
    }

    if (BLOCKED_ROLES.includes(role)) {
      throw new ForbiddenException(`Role ${role} cannot access Sales CRM`)
    }

    const method = (request.method ?? 'GET').toUpperCase()
    if (READ_ONLY_ROLES.includes(role) && method !== 'GET') {
      throw new ForbiddenException(`Role ${role} has read-only access to Sales CRM`)
    }

    const requiredRoles =
      this.reflector.getAllAndOverride<readonly SalesCrmRole[] | undefined>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? undefined

    if (!requiredRoles || requiredRoles.length === 0) {
      return FULL_ACCESS_ROLES.includes(role) || READ_ONLY_ROLES.includes(role)
    }

    if (!requiredRoles.includes(role)) {
      throw new ForbiddenException(`Role ${role} is not permitted for this action`)
    }

    return true
  }

  private resolveRole(user: JwtUserPayload): SalesCrmRole | null {
    const candidates = [
      user.role,
      ...(Array.isArray(user.roles) ? user.roles : []),
    ]
      .filter((value): value is string => Boolean(value))
      .map(normalizeRole)

    for (const candidate of candidates) {
      if (isSalesCrmRole(candidate)) {
        return candidate
      }
    }

    return null
  }
}

function isSalesCrmRole(value: string): value is SalesCrmRole {
  return (
    value === 'Admin' ||
    value === 'Sales' ||
    value === 'Operations' ||
    value === 'Legal' ||
    value === 'Accounts' ||
    value === 'HR'
  )
}

function normalizeRole(value: string) {
  switch (value) {
    case 'ADMIN':
      return 'Admin'
    case 'WEALTH_MANAGER':
      return 'Sales'
    case 'LAWYER':
      return 'Legal'
    case 'SUPPORT':
      return 'Operations'
    default:
      return value
  }
}
