import { useState } from 'react'
import { Shield, ArrowRight, Eye, EyeOff } from 'lucide-react'

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleLogin() {
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin()
    }, 600)
  }

  const isValid = email.trim().length > 0 && password.trim().length > 0

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        fontFamily: '"DM Sans", system-ui, sans-serif',
        background: 'linear-gradient(145deg, #fafaf9 0%, #f5f5f4 40%, #fff7ed 100%)',
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none dark:hidden">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }}
        />
      </div>
      {/* Dark mode bg */}
      <div className="absolute inset-0 hidden dark:block bg-neutral-950" />

      <div className="w-full max-w-[400px] relative z-10">
        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl shadow-neutral-900/8 dark:shadow-black/30 border border-neutral-200/50 dark:border-neutral-800 overflow-hidden">
          {/* Orange accent bar */}
          <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />

          <div className="px-10 pt-10 pb-9">
            {/* Logo */}
            <div className="flex justify-center mb-10">
              <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Wills<span className="text-orange-500">24</span></span>
            </div>

            {/* Heading */}
            <div className="text-center mb-8">
              <h1 className="text-[22px] font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                Welcome back
              </h1>
              <p className="text-[13px] text-neutral-400 dark:text-neutral-500 mt-1.5">
                Enter your credentials to continue
              </p>
            </div>

            {/* Email input */}
            <div className="space-y-1.5 mb-5">
              <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest pl-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@wills24.ai"
                className="w-full h-12 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-[15px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 dark:focus:border-orange-500 transition-all"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {/* Password input */}
            <div className="space-y-1.5 mb-7">
              <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest pl-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 px-4 pr-11 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-[15px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 dark:focus:border-orange-500 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={!isValid || loading}
              className="w-full h-12 rounded-xl font-semibold text-[14px] transition-all flex items-center justify-center gap-2.5 disabled:cursor-not-allowed bg-orange-500 hover:bg-orange-600 text-white disabled:bg-neutral-200 disabled:text-neutral-400 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500"
            >
              {loading ? (
                <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Login
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </>
              )}
            </button>

            {/* Trust signal */}
            <div className="flex items-center justify-center gap-1.5 mt-6">
              <Shield className="w-3 h-3 text-emerald-500" strokeWidth={2} />
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                Secured with end-to-end encryption
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-neutral-300 dark:text-neutral-700 mt-8 tracking-wide">
          Powered by <span className="font-bold text-neutral-400 dark:text-neutral-600">Wills24</span>
        </p>
      </div>
    </div>
  )
}
