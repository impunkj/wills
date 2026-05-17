import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AppShellLayout } from '@/app-shell-layout'
import { clearSession, readSession, THEME_STORAGE_KEY, type SessionUser } from '@/auth'
import { DashboardHomePage } from '@/pages/DashboardHomePage'
import { LoginRoute } from '@/pages/LoginRoute'
import { AccountsPage } from '@/pages/AccountsPage'
import { CaseManagementPage } from '@/pages/CaseManagementPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { LawyersDirectoryPage } from '@/pages/LawyersDirectoryPage'
import { PartnersPage } from '@/pages/PartnersPage'
import { ReportsAnalyticsPage } from '@/pages/ReportsAnalyticsPage'
import { SalesCrmPage } from '@/pages/SalesCrmPage'
import { TeamManagementPage } from '@/pages/TeamManagementPage'
import { Toaster, toast } from '@/components/ui/toaster'
import { authService } from './services/auth.service'

type ThemeMode = 'light' | 'dark'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('wills24_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(() => readSession())
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard-home" replace />
            ) : (
              <LoginRoute
                onLogin={async (email: string, password: string) => {
                  const result = await authService.login(email, password)
                  if (result?.token) {
                    setUser(result.user)
                    window.location.href = '/dashboard-home'
                  }
                }}
              />
            )
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <ProtectedLayout
                user={user}
                theme={theme}
                onLogout={() => {
                  clearSession()
                  setUser(null)
                }}
                onToggleTheme={() => {
                  setTheme((current) => (current === 'light' ? 'dark' : 'light'))
                }}
              />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard-home" replace /></ProtectedRoute>} />
          <Route path="/dashboard-home" element={<ProtectedRoute><DashboardHomePage /></ProtectedRoute>} />
          <Route path="/sales-crm/*" element={<ProtectedRoute><SalesCrmPage /></ProtectedRoute>} />
          <Route path="/accounts/*" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
          <Route path="/customers/*" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
          <Route path="/case-management/*" element={<ProtectedRoute><CaseManagementPage /></ProtectedRoute>} />
          <Route path="/partners/*" element={<ProtectedRoute><PartnersPage /></ProtectedRoute>} />
          <Route path="/team-management/*" element={<ProtectedRoute><TeamManagementPage /></ProtectedRoute>} />
          <Route path="/lawyers-directory/*" element={<ProtectedRoute><LawyersDirectoryPage /></ProtectedRoute>} />
          <Route path="/reports-analytics/*" element={<ProtectedRoute><ReportsAnalyticsPage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to={authService.isLoggedIn() ? '/dashboard-home' : '/login'} replace />} />
      </Routes>
      <Toaster />
    </>
  )
}

interface ProtectedLayoutProps {
  user: SessionUser | null
  theme: ThemeMode
  onLogout: () => void
  onToggleTheme: () => void
}

function ProtectedLayout({
  user,
  theme,
  onLogout,
  onToggleTheme,
}: ProtectedLayoutProps) {
  const currentUser = authService.getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <AppShellLayout
      user={{
        name: currentUser?.name ?? 'User',
        role: currentUser?.role ?? 'ADMIN',
      }}
      theme={theme}
      onLogout={() => {
        toast.info('Signed out', 'Your admin session has been cleared.')
        onLogout()
      }}
      onToggleTheme={onToggleTheme}
    />
  )
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
