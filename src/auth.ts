export const SESSION_STORAGE_KEY = 'wills24_user'
export const THEME_STORAGE_KEY = 'wills24-admin-theme'

export type SessionUser = {
  id?: string
  name: string
  email?: string
  role: string
}

export function readSession(): SessionUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function writeSession(user: SessionUser) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
  window.localStorage.removeItem('wills24_token')
}
