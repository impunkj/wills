import { useState } from 'react'
import type {
  TeamManagementProps,
  User,
  Lawyer,
  Employee,
  PermissionLevel,
} from '../types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Users,
  Scale,
  Briefcase,
  Plus,
  Search,
  Pencil,
  Power,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  Shield,
  FileCheck,
  FileClock,
  Eye,
  Calendar,
  Clock,
  ArrowUpDown,
  Check,
  BookOpen,
  X,
  Upload,
} from 'lucide-react'

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS = [
  { key: 'employees', label: 'Employees (HRMS)', icon: Briefcase },
  { key: 'users', label: 'Permissions', icon: Shield },
] as const

type TabKey = 'lawyers' | 'employees' | 'users'

const ROLE_LABEL: Record<User['role'], string> = {
  admin: 'Admin',
  sales: 'Sales',
  operations: 'Operations',
  legal: 'Legal',
  accounts: 'Accounts',
  hr: 'HR',
}

const ROLE_COLOR: Record<User['role'], string> = {
  admin: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  sales: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  operations: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  legal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  accounts: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  hr: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
}

const STATUS_BADGE: Record<'active' | 'inactive', string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  inactive: 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400',
}

const AVAIL_BADGE: Record<Lawyer['availability'], { cls: string; label: string }> = {
  available: { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'Available' },
  'on-leave': { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', label: 'On Leave' },
  overloaded: { cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: 'Overloaded' },
}

const PERM_CELL: Record<PermissionLevel, { cls: string; label: string }> = {
  full: { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', label: 'Full' },
  read: { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', label: 'Read' },
  none: { cls: 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500', label: '—' },
}

const PERM_ROLES = ['admin', 'sales', 'operations', 'legal', 'accounts', 'hr'] as const

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function sortBy<T>(arr: T[], key: string, dir: 'asc' | 'desc'): T[] {
  return [...arr].sort((a, b) => {
    const av = (a as Record<string, unknown>)[key]
    const bv = (b as Record<string, unknown>)[key]
    if (typeof av === 'string' && typeof bv === 'string')
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    if (typeof av === 'number' && typeof bv === 'number')
      return dir === 'asc' ? av - bv : bv - av
    return 0
  })
}

function initials(name: string): string {
  return name
    .replace(/^Adv\.\s*/, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SortTh({
  label,
  sortKey,
  current,
  onSort,
}: {
  label: string
  sortKey: string
  current: { key: string; dir: 'asc' | 'desc' }
  onSort: (key: string) => void
}) {
  const active = current.key === sortKey
  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer select-none hover:text-orange-600 dark:hover:text-orange-400 transition-colors whitespace-nowrap"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          current.dir === 'asc' ? (
            <ChevronUp size={13} className="text-orange-500" />
          ) : (
            <ChevronDown size={13} className="text-orange-500" />
          )
        ) : (
          <ArrowUpDown size={12} className="opacity-30" />
        )}
      </span>
    </th>
  )
}


function DocBadge({ status }: { status: 'uploaded' | 'pending' }) {
  return status === 'uploaded' ? (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
      <FileCheck size={11} /> Uploaded
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
      <FileClock size={11} /> Pending
    </span>
  )
}

function KycSummary({ docs }: { docs: { status: 'uploaded' | 'pending' }[] }) {
  const uploaded = docs.filter((d) => d.status === 'uploaded').length
  const total = docs.length
  const allDone = uploaded === total
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        allDone
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      }`}
    >
      {allDone ? <Check size={11} /> : <FileClock size={11} />}
      {uploaded}/{total}
    </span>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function TeamManagement({
  users,
  lawyers,
  employees,
  rolePermissions,
  onAddUser,
  onEditUser,
  onToggleUserStatus,
  onAddLawyer,
  onEditLawyer,
  onUpdateLawyerAvailability,
  onViewLawyer,
  onAddEmployee,
  onEditEmployee,
  onToggleEmployeeStatus,
  onViewEmployee,
  view = 'team',
}: TeamManagementProps & { view?: 'team' | 'lawyers-only' }) {
  const [activeTab, setActiveTab] = useState<TabKey>(view === 'lawyers-only' ? 'lawyers' : 'employees')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({
    key: 'name',
    dir: 'asc',
  })
  const [expandedLawyer, setExpandedLawyer] = useState<string | null>(null)
  const [showPermissions, setShowPermissions] = useState(false)

  // filters
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [specFilter, setSpecFilter] = useState<string>('all')
  const [availFilter, setAvailFilter] = useState<string>('all')
  const [deptFilter, setDeptFilter] = useState<string>('all')

  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [editUserTarget, setEditUserTarget] = useState<User | null>(null)
  const [toggleUserStatusTarget, setToggleUserStatusTarget] = useState<User | null>(null)

  const [showAddLawyerModal, setShowAddLawyerModal] = useState(false)
  const [editLawyerTarget, setEditLawyerTarget] = useState<Lawyer | null>(null)
  const [lawyerFormStep, setLawyerFormStep] = useState(1)

  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false)
  const [editEmployeeTarget, setEditEmployeeTarget] = useState<Employee | null>(null)
  const [toggleEmployeeStatusTarget, setToggleEmployeeStatusTarget] = useState<Employee | null>(null)

  // Form states
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'sales' as User['role'], status: 'active' as 'active' | 'inactive' })
  const [lawyerForm, setLawyerForm] = useState({ name: '', email: '', phone: '', specialization: '', barCouncilId: '', location: '', experienceYears: '', availability: 'available' as Lawyer['availability'] })
  const [employeeForm, setEmployeeForm] = useState({ name: '', email: '', phone: '', department: '', designation: '', status: 'active' as 'active' | 'inactive' })

  // Modal handlers
  function openAddUser() {
    setUserForm({ name: '', email: '', role: 'sales', status: 'active' })
    setShowAddUserModal(true)
  }

  function openEditUser(user: User) {
    setUserForm({ name: user.name, email: user.email, role: user.role, status: user.status })
    setEditUserTarget(user)
  }

  function handleSaveUser() {
    if (editUserTarget) {
      onEditUser?.(editUserTarget.id)
      setEditUserTarget(null)
    } else {
      onAddUser?.()
      setShowAddUserModal(false)
    }
  }

  function handleToggleUserStatusConfirm() {
    if (toggleUserStatusTarget) {
      onToggleUserStatus?.(toggleUserStatusTarget.id)
      setToggleUserStatusTarget(null)
    }
  }

  function openAddLawyer() {
    setLawyerForm({ name: '', email: '', phone: '', specialization: '', barCouncilId: '', location: '', experienceYears: '', availability: 'available' })
    setShowAddLawyerModal(true)
  }

  function openEditLawyer(lawyer: Lawyer) {
    setLawyerForm({ name: lawyer.name, email: lawyer.email, phone: lawyer.phone, specialization: lawyer.specialization, barCouncilId: lawyer.barCouncilId, location: lawyer.location, experienceYears: String(lawyer.experienceYears), availability: lawyer.availability })
    setEditLawyerTarget(lawyer)
  }

  function handleSaveLawyer() {
    if (editLawyerTarget) {
      onEditLawyer?.(editLawyerTarget.id)
      setEditLawyerTarget(null)
    } else {
      onAddLawyer?.()
      setShowAddLawyerModal(false)
    }
  }

  function openAddEmployee() {
    setEmployeeForm({ name: '', email: '', phone: '', department: '', designation: '', status: 'active' })
    setShowAddEmployeeModal(true)
  }

  function openEditEmployee(emp: Employee) {
    setEmployeeForm({ name: `${emp.firstName} ${emp.lastName}`, email: emp.email, phone: emp.phone, department: emp.department, designation: emp.designation, status: emp.status })
    setEditEmployeeTarget(emp)
  }

  function handleSaveEmployee() {
    if (editEmployeeTarget) {
      onEditEmployee?.(editEmployeeTarget.id)
      setEditEmployeeTarget(null)
    } else {
      onAddEmployee?.()
      setShowAddEmployeeModal(false)
    }
  }

  function handleToggleEmployeeStatusConfirm() {
    if (toggleEmployeeStatusTarget) {
      onToggleEmployeeStatus?.(toggleEmployeeStatusTarget.id)
      setToggleEmployeeStatusTarget(null)
    }
  }

  const handleSort = (key: string) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    )
  }

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    setSearch('')
    setSort({ key: 'name', dir: 'asc' })
    setExpandedLawyer(null)
    setShowPermissions(false)
    setRoleFilter('all')
    setStatusFilter('all')
    setSpecFilter('all')
    setAvailFilter('all')
    setDeptFilter('all')
  }

  // ─── Filtered/sorted data ──────────────────────────────────────────────

  const q = search.toLowerCase()

  const filteredUsers = sortBy(
    users.filter((u) => {
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      return true
    }),
    sort.key,
    sort.dir,
  )

  const specializations = [...new Set(lawyers.map((l) => l.specialization))]
  const filteredLawyers = sortBy(
    lawyers.filter((l) => {
      if (q && !l.name.toLowerCase().includes(q) && !l.specialization.toLowerCase().includes(q))
        return false
      if (specFilter !== 'all' && l.specialization !== specFilter) return false
      return true
    }),
    sort.key,
    sort.dir,
  )

  const departments = [...new Set(employees.map((e) => e.department))]
  const filteredEmployees = sortBy(
    employees.filter((e) => {
      const fullName = `${e.firstName} ${e.lastName}`.toLowerCase()
      if (q && !fullName.includes(q) && !e.email.toLowerCase().includes(q) && !e.employeeId.toLowerCase().includes(q))
        return false
      if (deptFilter !== 'all' && e.department !== deptFilter) return false
      if (statusFilter !== 'all' && e.status !== statusFilter) return false
      return true
    }),
    sort.key === 'name' ? 'firstName' : sort.key,
    sort.dir,
  )

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            {view === 'lawyers-only' ? 'Lawyers Directory' : 'Team Management'}
          </h1>
        </div>
      </div>

      {/* Tabs */}
      {view !== 'lawyers-only' && (
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map((tab) => {
          const active = activeTab === tab.key
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t" />
              )}
            </button>
          )
        })}
      </div>
      )}

      {/* Content */}
      {activeTab === 'users' && (
        <UsersTab
          users={filteredUsers}
          rolePermissions={rolePermissions}
          search={search}
          sort={sort}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          showPermissions={showPermissions}
          onSearch={setSearch}
          onSort={handleSort}
          onRoleFilter={setRoleFilter}
          onStatusFilter={setStatusFilter}
          onTogglePermissions={() => setShowPermissions((p) => !p)}
          onAdd={openAddUser}
          onEdit={(id) => { const u = users.find((x) => x.id === id); if (u) openEditUser(u) }}
          onToggleStatus={(id) => { const u = users.find((x) => x.id === id); if (u) setToggleUserStatusTarget(u) }}
        />
      )}
      {activeTab === 'lawyers' && (
        <LawyersTab
          lawyers={filteredLawyers}
          specializations={specializations}
          search={search}
          sort={sort}
          specFilter={specFilter}
          availFilter={availFilter}
          expandedLawyer={expandedLawyer}
          onSearch={setSearch}
          onSort={handleSort}
          onSpecFilter={setSpecFilter}
          onAvailFilter={setAvailFilter}
          onExpand={(id) => setExpandedLawyer((prev) => (prev === id ? null : id))}
          onAdd={openAddLawyer}
          onEdit={(id) => { const l = lawyers.find((x) => x.id === id); if (l) openEditLawyer(l) }}
          onUpdateAvailability={onUpdateLawyerAvailability}
          onView={onViewLawyer}
          rowAction={view === 'lawyers-only' ? 'view' : 'expand'}
        />
      )}
      {activeTab === 'employees' && (
        <EmployeesTab
          employees={filteredEmployees}
          departments={departments}
          search={search}
          sort={sort}
          deptFilter={deptFilter}
          statusFilter={statusFilter}
          onSearch={setSearch}
          onSort={handleSort}
          onDeptFilter={setDeptFilter}
          onStatusFilter={setStatusFilter}
          onAdd={openAddEmployee}
          onEdit={(id) => { const e = employees.find((x) => x.id === id); if (e) openEditEmployee(e) }}
          onToggleStatus={(id) => { const e = employees.find((x) => x.id === id); if (e) setToggleEmployeeStatusTarget(e) }}
          onView={onViewEmployee}
        />
      )}

      {/* ── Add/Edit User Modal ───────────────────────────────────────── */}
      <Dialog open={showAddUserModal || !!editUserTarget} onOpenChange={(open) => { if (!open) { setShowAddUserModal(false); setEditUserTarget(null) } }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">
              {editUserTarget ? 'Edit User' : 'Add User'}
            </DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              {editUserTarget ? 'Update user details and role.' : 'Create a new user account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Name</label>
              <input
                type="text"
                value={userForm.name}
                onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Role</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value as User['role'] }))}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="admin">Admin</option>
                <option value="sales">Sales</option>
                <option value="operations">Operations</option>
                <option value="legal">Legal</option>
                <option value="accounts">Accounts</option>
                <option value="hr">HR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Status</label>
              <select
                value={userForm.status}
                onChange={(e) => setUserForm((f) => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => { setShowAddUserModal(false); setEditUserTarget(null) }}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              {editUserTarget ? 'Save Changes' : 'Add User'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Toggle User Status Confirmation ───────────────────────────── */}
      <Dialog open={!!toggleUserStatusTarget} onOpenChange={(open) => { if (!open) setToggleUserStatusTarget(null) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">
              {toggleUserStatusTarget?.status === 'active' ? 'Deactivate' : 'Activate'} User
            </DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Are you sure you want to {toggleUserStatusTarget?.status === 'active' ? 'deactivate' : 'activate'} {toggleUserStatusTarget?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setToggleUserStatusTarget(null)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleToggleUserStatusConfirm}
              className={toggleUserStatusTarget?.status === 'active'
                ? "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                : "rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
              }
            >
              {toggleUserStatusTarget?.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add/Edit Lawyer Modal ─────────────────────────────────────── */}
      <Dialog open={showAddLawyerModal || !!editLawyerTarget} onOpenChange={(open) => { if (!open) { setShowAddLawyerModal(false); setEditLawyerTarget(null); setLawyerFormStep(1) } }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">
              {editLawyerTarget ? 'Edit Lawyer' : 'Add Lawyer'}
            </DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Step {lawyerFormStep} of 2 — {lawyerFormStep === 1 ? 'Lawyer Details' : 'Documents'}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 py-1">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${lawyerFormStep >= 1 ? 'bg-orange-500 text-white' : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'}`}>1</div>
            <div className={`h-px flex-1 ${lawyerFormStep >= 2 ? 'bg-orange-500' : 'bg-neutral-200 dark:bg-neutral-700'}`} />
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${lawyerFormStep >= 2 ? 'bg-orange-500 text-white' : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'}`}>2</div>
          </div>

          {/* Step 1: Lawyer Details */}
          {lawyerFormStep === 1 && (
            <div className="space-y-4 py-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Name</label>
                <input type="text" value={lawyerForm.name} onChange={(e) => setLawyerForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
                  <input type="email" value={lawyerForm.email} onChange={(e) => setLawyerForm((f) => ({ ...f, email: e.target.value }))} placeholder="lawyer@example.com" className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Phone</label>
                  <input type="tel" value={lawyerForm.phone} onChange={(e) => setLawyerForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Specialization</label>
                <input type="text" value={lawyerForm.specialization} onChange={(e) => setLawyerForm((f) => ({ ...f, specialization: e.target.value }))} placeholder="e.g. Property Law, Family Law" className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Bar Council ID</label>
                  <input type="text" value={lawyerForm.barCouncilId} onChange={(e) => setLawyerForm((f) => ({ ...f, barCouncilId: e.target.value }))} placeholder="BAR/XXXX/XXXX" className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Location</label>
                  <input type="text" value={lawyerForm.location} onChange={(e) => setLawyerForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Mumbai" className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Years of Experience</label>
                <input type="number" value={lawyerForm.experienceYears} onChange={(e) => setLawyerForm((f) => ({ ...f, experienceYears: e.target.value }))} placeholder="e.g. 10" min="0" className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500" />
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {lawyerFormStep === 2 && (
            <div className="space-y-5 py-2">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Upload required documents for verification.</p>
              {/* Bar Council Certificate */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Bar Council Certificate</label>
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600 px-4 py-6 text-center hover:border-orange-400 dark:hover:border-orange-600 transition-colors cursor-pointer">
                  <div className="flex flex-col items-center gap-1.5">
                    <Upload size={20} className="text-neutral-400" />
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Click to upload or drag & drop</span>
                    <span className="text-[11px] text-neutral-400">PDF, JPG, PNG (max 5MB)</span>
                  </div>
                </div>
              </div>
              {/* ID Proof */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">ID Proof (Aadhaar / PAN)</label>
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600 px-4 py-6 text-center hover:border-orange-400 dark:hover:border-orange-600 transition-colors cursor-pointer">
                  <div className="flex flex-col items-center gap-1.5">
                    <Upload size={20} className="text-neutral-400" />
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Click to upload or drag & drop</span>
                    <span className="text-[11px] text-neutral-400">PDF, JPG, PNG (max 5MB)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {lawyerFormStep === 1 ? (
              <>
                <button
                  onClick={() => { setShowAddLawyerModal(false); setEditLawyerTarget(null); setLawyerFormStep(1) }}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setLawyerFormStep(2)}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
                >
                  Next
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setLawyerFormStep(1)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => { handleSaveLawyer(); setLawyerFormStep(1) }}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
                >
                  {editLawyerTarget ? 'Save Changes' : 'Add Lawyer'}
                </button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add/Edit Employee Modal ───────────────────────────────────── */}
      <Dialog open={showAddEmployeeModal || !!editEmployeeTarget} onOpenChange={(open) => { if (!open) { setShowAddEmployeeModal(false); setEditEmployeeTarget(null) } }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">
              {editEmployeeTarget ? 'Edit Employee' : 'Add Employee'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Name</label>
              <input
                type="text"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
              <input
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="employee@example.com"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Phone</label>
              <input
                type="tel"
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 XXXXX XXXXX"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Department</label>
              <input
                type="text"
                value={employeeForm.department}
                onChange={(e) => setEmployeeForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="e.g. Sales, Legal, Operations"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Role / Designation</label>
              <input
                type="text"
                value={employeeForm.designation}
                onChange={(e) => setEmployeeForm((f) => ({ ...f, designation: e.target.value }))}
                placeholder="e.g. Senior Executive"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => { setShowAddEmployeeModal(false); setEditEmployeeTarget(null) }}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEmployee}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              {editEmployeeTarget ? 'Save Changes' : 'Add Employee'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Toggle Employee Status Confirmation ───────────────────────── */}
      <Dialog open={!!toggleEmployeeStatusTarget} onOpenChange={(open) => { if (!open) setToggleEmployeeStatusTarget(null) }}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">
              {toggleEmployeeStatusTarget?.status === 'active' ? 'Deactivate' : 'Activate'} Employee
            </DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Are you sure you want to {toggleEmployeeStatusTarget?.status === 'active' ? 'deactivate' : 'activate'} {toggleEmployeeStatusTarget ? `${toggleEmployeeStatusTarget.firstName} ${toggleEmployeeStatusTarget.lastName}` : ''}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setToggleEmployeeStatusTarget(null)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleToggleEmployeeStatusConfirm}
              className={toggleEmployeeStatusTarget?.status === 'active'
                ? "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                : "rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
              }
            >
              {toggleEmployeeStatusTarget?.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Tab: Users & Roles
// ═════════════════════════════════════════════════════════════════════════════

const PERM_SELECT_CLS: Record<PermissionLevel, string> = {
  full: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
  read: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
  none: 'text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
}

function UsersTab({
  rolePermissions,
  onPermissionChange,
}: {
  rolePermissions: TeamManagementProps['rolePermissions']
  onPermissionChange?: (module: string, role: string, level: PermissionLevel) => void
  [key: string]: any
}) {
  return (
    <div className="space-y-4">
      {/* Permissions Matrix */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Role Permissions Matrix
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Module
                </th>
                {PERM_ROLES.map((r) => (
                  <th
                    key={r}
                    className="px-3 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
                  >
                    {ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rolePermissions.map((row, i) => (
                <tr
                  key={row.module}
                  className={`border-t border-neutral-100 dark:border-neutral-800 ${
                    i % 2 === 0 ? '' : 'bg-neutral-50/50 dark:bg-neutral-800/20'
                  }`}
                >
                  <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300 font-medium whitespace-nowrap">
                    {row.module}
                  </td>
                  {PERM_ROLES.map((role) => {
                    const level = row[role]
                    const selectCls = PERM_SELECT_CLS[level]
                    return (
                      <td key={role} className="px-2 py-1.5 text-center">
                        <div className="relative inline-block">
                          <select
                            value={level}
                            onChange={(e) => onPermissionChange?.(row.module, role, e.target.value as PermissionLevel)}
                            className={`text-xs font-medium pl-2.5 pr-6 py-1 rounded-md border cursor-pointer appearance-none w-[80px] focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors ${selectCls}`}
                          >
                            <option value="full">Full</option>
                            <option value="read">Read</option>
                            <option value="none">—</option>
                          </select>
                          <ChevronDown size={11} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 opacity-50" />
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Tab: Lawyers Directory
// ═════════════════════════════════════════════════════════════════════════════

function LawyersTab({
  lawyers,
  specializations,
  search,
  sort,
  specFilter,
  availFilter,
  expandedLawyer,
  onSearch,
  onSort,
  onSpecFilter,
  onAvailFilter,
  onExpand,
  onAdd,
  onEdit,
  onUpdateAvailability,
  onView,
  rowAction = 'expand',
}: {
  lawyers: Lawyer[]
  specializations: string[]
  search: string
  sort: { key: string; dir: 'asc' | 'desc' }
  specFilter: string
  availFilter: string
  expandedLawyer: string | null
  onSearch: (v: string) => void
  onSort: (key: string) => void
  onSpecFilter: (v: string) => void
  onAvailFilter: (v: string) => void
  onExpand: (id: string) => void
  onAdd?: () => void
  onEdit?: (id: string) => void
  onUpdateAvailability?: (id: string, status: Lawyer['availability']) => void
  onView?: (id: string) => void
  rowAction?: 'expand' | 'view'
}) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search lawyers..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>
          <select
            value={specFilter}
            onChange={(e) => onSpecFilter(e.target.value)}
            className="text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          >
            <option value="all">All Specializations</option>
            {specializations.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => onAdd?.()}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-500 text-white transition-colors"
        >
          <Plus size={15} />
          Add Lawyer
        </button>
      </div>

      {/* Lawyers Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                <th className="w-8 px-4 py-3" />
                <SortTh label="Name" sortKey="name" current={sort} onSort={onSort} />
                <SortTh label="Specialization" sortKey="specialization" current={sort} onSort={onSort} />
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                  Bar Council ID
                </th>
                <SortTh label="Location" sortKey="location" current={sort} onSort={onSort} />
                <SortTh label="Experience" sortKey="experienceYears" current={sort} onSort={onSort} />
                <SortTh label="Active Cases" sortKey="activeCases" current={sort} onSort={onSort} />
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {lawyers.map((lawyer) => {
                const expanded = expandedLawyer === lawyer.id
                return (
                  <LawyerRow
                    key={lawyer.id}
                    lawyer={lawyer}
                    expanded={expanded}
                    onExpand={() => onExpand(lawyer.id)}
                    onEdit={() => onEdit?.(lawyer.id)}
                    onView={() => onView?.(lawyer.id)}
                    rowAction={rowAction}
                  />
                )
              })}
              {lawyers.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-neutral-400 dark:text-neutral-500">
                    <Scale size={24} className="mx-auto mb-2 opacity-40" />
                    No lawyers match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function LawyerRow({
  lawyer,
  expanded,
  onExpand,
  onEdit,
  onView,
  rowAction = 'expand',
}: {
  lawyer: Lawyer
  expanded: boolean
  onExpand: () => void
  onEdit?: () => void
  onView?: () => void
  rowAction?: 'expand' | 'view'
}) {
  const handleRowClick = rowAction === 'view' ? () => onView?.() : onExpand
  return (
    <>
      <tr
        className={`border-t border-neutral-100 dark:border-neutral-800 cursor-pointer transition-colors ${
          expanded
            ? 'bg-orange-50/50 dark:bg-orange-900/10'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
        }`}
        onClick={handleRowClick}
      >
        <td className="px-4 py-3">
          {rowAction === 'expand' && (
            expanded ? (
              <ChevronUp size={14} className="text-orange-500" />
            ) : (
              <ChevronDown size={14} className="text-neutral-400" />
            )
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {initials(lawyer.name)}
            </div>
            <span className="font-medium text-neutral-900 dark:text-white whitespace-nowrap">
              {lawyer.name}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
          {lawyer.specialization}
        </td>
        <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 font-mono text-xs whitespace-nowrap">
          {lawyer.barCouncilId}
        </td>
        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} className="text-neutral-400" />
            {lawyer.location}
          </span>
        </td>
        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
          {lawyer.experienceYears} yrs
        </td>
        <td className="px-4 py-3 text-center font-medium text-neutral-800 dark:text-neutral-200">
          {lawyer.activeCases}
        </td>
        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onView?.()}
              className="p-1.5 rounded-md text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
              title="View details"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={() => onEdit?.()}
              className="p-1.5 rounded-md text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:text-orange-400 dark:hover:bg-orange-900/20 transition-colors"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-t border-orange-200/50 dark:border-orange-800/30">
          <td colSpan={10} className="px-0 py-0">
            <LawyerDetail lawyer={lawyer} />
          </td>
        </tr>
      )}
    </>
  )
}

export function LawyerDetail({ lawyer }: { lawyer: Lawyer }) {
  return (
    <div className="bg-orange-50/30 dark:bg-orange-900/5 px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Profile */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Contact Details
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <Mail size={13} className="text-neutral-400" />
            <span className="font-mono text-xs">{lawyer.email}</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <Phone size={13} className="text-neutral-400" />
            {lawyer.phone}
          </div>
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <MapPin size={13} className="text-neutral-400" />
            {lawyer.location}
          </div>
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <Calendar size={13} className="text-neutral-400" />
            {lawyer.experienceYears} years experience
          </div>
        </div>
      </div>

      {/* Case Stats */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Case Performance
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Active Cases</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
              {lawyer.activeCases}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Handled</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
              {lawyer.totalCasesHandled}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Success Rate</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {lawyer.successRate}%
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Avg Resolution</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
              {lawyer.avgResolutionDays}d
            </p>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Documents
        </h4>
        <div className="space-y-2">
          {lawyer.documents.map((doc) => (
            <div
              key={doc.type}
              className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2"
            >
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{doc.type}</span>
              <DocBadge status={doc.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Tab: Employees (HRMS)
// ═════════════════════════════════════════════════════════════════════════════

function EmployeesTab({
  employees,
  departments,
  search,
  sort,
  deptFilter,
  statusFilter,
  onSearch,
  onSort,
  onDeptFilter,
  onStatusFilter,
  onAdd,
  onEdit,
  onToggleStatus,
  onView,
}: {
  employees: Employee[]
  departments: string[]
  search: string
  sort: { key: string; dir: 'asc' | 'desc' }
  deptFilter: string
  statusFilter: string
  onSearch: (v: string) => void
  onSort: (key: string) => void
  onDeptFilter: (v: string) => void
  onStatusFilter: (v: string) => void
  onAdd?: () => void
  onEdit?: (id: string) => void
  onToggleStatus?: (id: string) => void
  onView?: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => onDeptFilter(e.target.value)}
            className="text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilter(e.target.value)}
            className="text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button
          onClick={() => onAdd?.()}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-500 text-white transition-colors"
        >
          <Plus size={15} />
          Add Employee
        </button>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                <SortTh label="Employee ID" sortKey="employeeId" current={sort} onSort={onSort} />
                <SortTh label="Name" sortKey="name" current={sort} onSort={onSort} />
                <SortTh label="Department" sortKey="department" current={sort} onSort={onSort} />
                <SortTh label="Designation" sortKey="designation" current={sort} onSort={onSort} />
                <SortTh label="Joined" sortKey="dateOfJoining" current={sort} onSort={onSort} />
                <SortTh label="Status" sortKey="status" current={sort} onSort={onSort} />
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                    {emp.employeeId}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <span className="font-medium text-neutral-900 dark:text-white whitespace-nowrap">
                          {emp.firstName} {emp.lastName}
                        </span>
                        <p className="text-xs text-neutral-400 font-mono">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                    {emp.department}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                    {emp.designation}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs whitespace-nowrap">
                    {formatDate(emp.dateOfJoining)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_BADGE[emp.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                      {emp.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit?.(emp.id)}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:text-orange-400 dark:hover:bg-orange-900/20 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onToggleStatus?.(emp.id)}
                        className={`p-1.5 rounded-md transition-colors ${
                          emp.status === 'active'
                            ? 'text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20'
                            : 'text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20'
                        }`}
                        title={emp.status === 'active' ? 'Deactivate' : 'Reactivate'}
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-neutral-400 dark:text-neutral-500">
                    <Briefcase size={24} className="mx-auto mb-2 opacity-40" />
                    No employees match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
