import { useLocation, useNavigate } from 'react-router-dom'

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const action = params.get('action')

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
            Milestone Scaffold
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            {title}
          </h1>
          <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            {description}
          </p>
          {action ? (
            <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200">
              Deep link action requested: <span className="font-mono">{action}</span>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard-home')}
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          'Route is mounted and protected by auth',
          'Sidebar navigation and active state are wired',
          'Section can now be replaced with milestone-specific data flows',
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            {item}
          </div>
        ))}
      </section>
    </div>
  )
}
