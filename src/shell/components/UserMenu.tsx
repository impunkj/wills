import { useState, useRef, useEffect } from 'react'
import { ChevronDown, LogOut } from 'lucide-react'

interface UserMenuProps {
  user?: {
    name: string
    role?: string
    avatarUrl?: string
  }
  onLogout?: () => void
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-orange-500/20"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-[11px] font-bold text-white shadow-sm">
            {initials}
          </div>
        )}
        <div className="text-left">
          <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
            {user?.name || 'User'}
          </p>
        </div>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/5 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-700">
            <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
              {user?.name}
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {user?.role || 'Product Manager'}
            </p>
          </div>
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false)
                onLogout?.()
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut size={15} strokeWidth={1.5} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
