import LoginPage from '@/features/dashboard-home/LoginPage'
import type { SessionUser } from '@/auth'

interface LoginRouteProps {
  onLogin: (email: string, password: string) => Promise<void>
}

export function LoginRoute({ onLogin }: LoginRouteProps) {
  return (
    <LoginPage
      onLogin={onLogin}
    />
  )
}
