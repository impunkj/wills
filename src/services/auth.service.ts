import { api } from '../lib/api'

export const authService = {
  async login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('wills24_token', res.data.token)
    localStorage.setItem('wills24_user', JSON.stringify(res.data.user))
    return res.data
  },

  logout() {
    localStorage.removeItem('wills24_token')
    localStorage.removeItem('wills24_user')
    window.location.href = '/login'
  },

  getCurrentUser() {
    const user = localStorage.getItem('wills24_user')
    return user ? JSON.parse(user) : null
  },

  getUser() {
    return this.getCurrentUser()
  },

  isLoggedIn() {
    return !!localStorage.getItem('wills24_token')
  },
}
