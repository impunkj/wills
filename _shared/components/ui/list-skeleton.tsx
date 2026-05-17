import { Skeleton } from './skeleton'

/**
 * Skeleton placeholder for list/table content.
 * Renders fake KPI cards, search bar, and N table rows that pulse.
 */
export function ListSkeleton({ rows = 6, kpis = 4 }: { rows?: number; kpis?: number }) {
  return (
    <div className="space-y-6 pb-8">
      {/* Header (title + buttons) */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>

      {/* KPI cards */}
      <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(kpis, 4)} gap-3`}>
        {Array.from({ length: kpis }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-4 space-y-2"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-5 py-4 ${
              i < rows - 1 ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''
            }`}
          >
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
