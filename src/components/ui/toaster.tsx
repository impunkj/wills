import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

type Toast = {
  id: number
  message: string
  description?: string
  variant: ToastVariant
}

type Listener = (toasts: Toast[]) => void

let toastsState: Toast[] = []
const listeners: Set<Listener> = new Set()
let nextId = 1

function emit() {
  for (const l of listeners) l(toastsState)
}

function push(variant: ToastVariant, message: string, description?: string) {
  const id = nextId++
  toastsState = [...toastsState, { id, variant, message, description }]
  emit()
  setTimeout(() => {
    toastsState = toastsState.filter((t) => t.id !== id)
    emit()
  }, 3500)
}

export const toast = {
  success: (message: string, description?: string) => push('success', message, description),
  error: (message: string, description?: string) => push('error', message, description),
  info: (message: string, description?: string) => push('info', message, description),
}

const VARIANT_CFG: Record<ToastVariant, { icon: typeof CheckCircle2; color: string; ring: string }> = {
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-100 dark:ring-emerald-900/40',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    ring: 'ring-red-100 dark:ring-red-900/40',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-100 dark:ring-blue-900/40',
  },
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>(toastsState)

  useEffect(() => {
    const listener: Listener = (next) => setToasts([...next])
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  function dismiss(id: number) {
    toastsState = toastsState.filter((t) => t.id !== id)
    emit()
  }

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const cfg = VARIANT_CFG[t.variant]
        const Icon = cfg.icon
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-3 shadow-lg ring-1 ${cfg.ring} animate-in fade-in slide-in-from-bottom-2 duration-200`}
          >
            <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${cfg.color}`} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100 leading-snug">
                {t.message}
              </p>
              {t.description && (
                <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
