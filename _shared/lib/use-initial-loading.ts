import { useEffect, useState } from 'react'

/**
 * Briefly shows a "loading" state on first mount so users see a skeleton
 * before content renders. The data here is synchronous JSON, but real
 * apps will fetch — this hook gives the UI a chance to show its loading
 * affordance and makes that pattern obvious in the prototype.
 */
export function useInitialLoading(ms = 600): boolean {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(id)
  }, [ms])
  return loading
}
