import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  itemLabel?: string
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  itemLabel = 'items',
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIdx = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endIdx = Math.min(safePage * pageSize, totalItems)

  if (totalItems === 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-2 text-[12px] text-neutral-500 dark:text-neutral-400">
        <span>
          Showing <span className="font-medium text-neutral-700 dark:text-neutral-200">{startIdx}</span>–
          <span className="font-medium text-neutral-700 dark:text-neutral-200">{endIdx}</span> of{' '}
          <span className="font-medium text-neutral-700 dark:text-neutral-200">{totalItems}</span> {itemLabel}
        </span>
        {onPageSizeChange && (
          <>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <label className="flex items-center gap-1.5 text-[12px]">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-[26px] rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[12px] text-neutral-700 dark:text-neutral-300 px-1.5 outline-none focus:border-orange-400 cursor-pointer"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft size={14} />
          Prev
        </button>
        <span className="px-2.5 py-1.5 text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
          Page <span className="text-neutral-900 dark:text-neutral-100">{safePage}</span> of{' '}
          <span className="text-neutral-900 dark:text-neutral-100">{totalPages}</span>
        </span>
        <button
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
