import { useState } from 'react'
import { formatCurrency, formatDate, timeAgo } from '@/lib/format'
import {
  ArrowLeft,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Users,
  Briefcase,
  IndianRupee,
  Wallet,
  TrendingUp,
  Crown,
  Award,
  Medal,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Eye,
  UserPlus,
  Shield,
  ChevronRight,
  Gem,
  Package,
  User,
  Scale,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { AddWMForm } from './AddWMForm'
import type {
  WMDetailProps,
  WealthManager,
  WMWalletTransaction,
  WMTeamMember,
  WMCustomer,
  WMPackage,
  WMPackageStatus,
  WMTier,
  WMStatus,
  WalletTransactionType,
  TeamMemberStatus,
} from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TabKey = 'details' | 'wallet' | 'team' | 'customers' | 'cases' | 'packages'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'details', label: 'Details', icon: <User size={14} /> },
  { key: 'wallet', label: 'Wallet', icon: <Wallet size={14} /> },
  { key: 'team', label: 'Team', icon: <Users size={14} /> },
  { key: 'customers', label: 'Customers', icon: <Briefcase size={14} /> },
  { key: 'cases', label: 'Cases', icon: <Scale size={14} /> },
  { key: 'packages', label: 'Packages', icon: <Package size={14} /> },
]

const TIER_CONFIG: Record<WMTier, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  platinum: { label: 'Platinum', icon: <Gem size={12} />, bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800/60' },
  gold: { label: 'Gold', icon: <Crown size={12} />, bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/60' },
  silver: { label: 'Silver', icon: <Award size={12} />, bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400', border: 'border-neutral-300 dark:border-neutral-700' },
  bronze: { label: 'Bronze', icon: <Medal size={12} />, bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/60' },
}

const TXN_TYPE_CONFIG: Record<WalletTransactionType, { label: string; icon: React.ReactNode; color: string; sign: string }> = {
  package_purchase: { label: 'Package Purchase', icon: <ArrowDownLeft size={12} />, color: 'text-emerald-600 dark:text-emerald-400', sign: '+' },
  will_used: { label: 'Will Used', icon: <ArrowUpRight size={12} />, color: 'text-red-500 dark:text-red-400', sign: '−' },
}

const TEAM_STATUS_CONFIG: Record<TeamMemberStatus, { label: string; dot: string; text: string }> = {
  active: { label: 'Active', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  inactive: { label: 'Inactive', dot: 'bg-neutral-400', text: 'text-neutral-500 dark:text-neutral-400' },
}

const PACKAGE_STATUS_CONFIG: Record<WMPackageStatus, { label: string; bg: string; text: string }> = {
  active: { label: 'Active', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  expired: { label: 'Expired', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-500 dark:text-neutral-400' },
  exhausted: { label: 'Exhausted', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
}

const PERMISSION_LABELS: Record<string, string> = {
  leads: 'Leads',
  customers: 'Customers',
  cases: 'Cases',
  documents: 'Documents',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrencyShort(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount.toLocaleString('en-IN')}`
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = [
  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function WMDetail({
  wealthManager: wm,
  walletTransactions,
  teamMembers,
  customers,
  packages,
  onEdit,
  onToggleStatus,
  onViewCustomer,
  onAddTeamMember,
  onBack,
}: WMDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('details')
  const tierCfg = TIER_CONFIG[wm.tier]

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showToggleStatus, setShowToggleStatus] = useState(false)
  const [showAddTeamMember, setShowAddTeamMember] = useState(false)

  const [teamMemberForm, setTeamMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
  })

  function handleToggleStatusConfirm() {
    onToggleStatus?.()
    setShowToggleStatus(false)
  }

  function handleAddTeamMemberSave() {
    onAddTeamMember?.()
    setShowAddTeamMember(false)
    setTeamMemberForm({ name: '', email: '', phone: '', designation: '' })
  }

  // Early return: render AddWMForm in edit mode when Edit Profile is invoked
  if (showEditModal) {
    return (
      <AddWMForm
        mode="edit"
        initialData={wm}
        onCancel={() => setShowEditModal(false)}
        onSubmit={() => {
          onEdit?.()
          setShowEditModal(false)
        }}
      />
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <div>
          {/* Profile Row */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={onBack}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${getAvatarColor(wm.name)}`}>
              {wm.photoUrl ? (
                <img src={wm.photoUrl} alt={wm.name} className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                getInitials(wm.name)
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">{wm.name}</h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${tierCfg.bg} ${tierCfg.text} ${tierCfg.border}`}>
                  {tierCfg.icon}
                  {tierCfg.label} Partner
                </span>
                {wm.status === 'active' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                {wm.id}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
                <span className="flex items-center gap-1"><Phone size={11} /> {wm.phone}</span>
                <span className="flex items-center gap-1"><Mail size={11} /> {wm.email}</span>
                <span className="flex items-center gap-1"><MapPin size={11} /> {wm.address.city}, {wm.address.state}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <button
                onClick={() => setShowToggleStatus(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                {wm.status === 'active' ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                {wm.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-500 transition-colors cursor-pointer shadow-sm"
              >
                <Pencil size={13} />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-5">
            <QuickStat label="Total Sales" value={formatCurrencyShort(wm.totalSales)} />
            <QuickStat label="Customers" value={wm.totalCustomers} />
            <QuickStat label="Leads" value={wm.totalLeads} />
            <QuickStat label="Active Cases" value={wm.activeCases} />
            <QuickStat label="Wills Left" value={wm.willsRemaining} />
            <QuickStat label="Wills Used" value={wm.willsUsed} />
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            const count =
              tab.key === 'details' ? null :
              tab.key === 'wallet' ? walletTransactions.length :
              tab.key === 'team' ? teamMembers.length :
              tab.key === 'customers' ? customers.length :
              tab.key === 'cases' ? customers.reduce((sum, c) => sum + c.totalCases, 0) :
              packages.length
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                {tab.icon}
                {tab.label}
                {count !== null && (
                  <span className={`text-[10px] font-bold tabular-nums ${isActive ? 'text-orange-400 dark:text-orange-500' : 'text-neutral-400 dark:text-neutral-600'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <div>
        {activeTab === 'details' && (
          <DetailsTab wm={wm} />
        )}
        {activeTab === 'wallet' && (
          <WalletTab transactions={walletTransactions} />
        )}
        {activeTab === 'team' && (
          <TeamTab teamMembers={teamMembers} onAddTeamMember={() => setShowAddTeamMember(true)} />
        )}
        {activeTab === 'customers' && (
          <CustomersTab customers={customers} onViewCustomer={onViewCustomer} />
        )}
        {activeTab === 'cases' && (
          <CasesTab customers={customers} onViewCustomer={onViewCustomer} />
        )}
        {activeTab === 'packages' && (
          <PackagesTab packages={packages} />
        )}
      </div>

      {/* ── Toggle Status Confirmation Modal ──────────────────────────── */}
      <Dialog open={showToggleStatus} onOpenChange={setShowToggleStatus}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">
              {wm.status === 'active' ? 'Deactivate' : 'Activate'} Partner
            </DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Are you sure you want to {wm.status === 'active' ? 'deactivate' : 'activate'} {wm.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setShowToggleStatus(false)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleToggleStatusConfirm}
              className={wm.status === 'active'
                ? "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                : "rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
              }
            >
              {wm.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Team Member Modal ─────────────────────────────────────── */}
      <Dialog open={showAddTeamMember} onOpenChange={setShowAddTeamMember}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Add Team Member</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Add a new team member to this partner's team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Name</label>
              <input
                type="text"
                value={teamMemberForm.name}
                onChange={(e) => setTeamMemberForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
              <input
                type="email"
                value={teamMemberForm.email}
                onChange={(e) => setTeamMemberForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Phone</label>
              <input
                type="tel"
                value={teamMemberForm.phone}
                onChange={(e) => setTeamMemberForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 XXXXX XXXXX"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Role / Designation</label>
              <input
                type="text"
                value={teamMemberForm.designation}
                onChange={(e) => setTeamMemberForm((f) => ({ ...f, designation: e.target.value }))}
                placeholder="e.g. Relationship Manager"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowAddTeamMember(false)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTeamMemberSave}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Add Member
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===========================================================================
// Tab Components
// ===========================================================================

// ── Details Tab ─────────────────────────────────────────────────────────────

function DetailsTab({ wm }: { wm: WealthManager }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Contact */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-5">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <User size={14} className="text-orange-500" />
          Contact Information
        </h3>
        <div className="space-y-3">
          <DetailRow icon={<Mail size={13} />} label="Email" value={wm.email} />
          <DetailRow icon={<Phone size={13} />} label="Phone" value={wm.phone} />
          <DetailRow icon={<Calendar size={13} />} label="Date of Birth" value={wm.dob || '—'} />
          <DetailRow icon={<User size={13} />} label="Gender" value={wm.gender === 'male' ? 'Male' : 'Female'} />
        </div>
      </div>

      {/* Address */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-5">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <MapPin size={14} className="text-orange-500" />
          Address
        </h3>
        <div className="space-y-3">
          <DetailRow icon={<MapPin size={13} />} label="Country" value={wm.address.country} />
          <DetailRow icon={<MapPin size={13} />} label="State" value={wm.address.state || '—'} />
          <DetailRow icon={<MapPin size={13} />} label="City" value={wm.address.city || '—'} />
          {wm.address.area && <DetailRow icon={<MapPin size={13} />} label="Area" value={wm.address.area} />}
          {wm.address.address && <DetailRow icon={<MapPin size={13} />} label="Address" value={wm.address.address} />}
          {wm.address.pinCode && <DetailRow icon={<MapPin size={13} />} label="PIN Code" value={wm.address.pinCode} />}
        </div>
      </div>

      {/* Company */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-5 md:col-span-2">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <Building2 size={14} className="text-orange-500" />
          Company Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailRow icon={<Building2 size={13} />} label="Company Name" value={wm.company.name || 'Individual'} />
          {wm.company.email && <DetailRow icon={<Mail size={13} />} label="Company Email" value={wm.company.email} />}
          {wm.company.gstNumber && <DetailRow icon={<FileText size={13} />} label="GST Number" value={wm.company.gstNumber} mono />}
          <DetailRow icon={<FileText size={13} />} label="PAN Number" value={wm.company.panNumber || '—'} mono />
          {wm.company.bankName && <DetailRow icon={<Building2 size={13} />} label="Bank Name" value={wm.company.bankName} />}
          {wm.company.accountNumber && <DetailRow icon={<FileText size={13} />} label="Account Number" value={wm.company.accountNumber} mono />}
          {wm.company.ifscCode && <DetailRow icon={<FileText size={13} />} label="IFSC Code" value={wm.company.ifscCode} mono />}
          {wm.company.branch && <DetailRow icon={<MapPin size={13} />} label="Branch" value={wm.company.branch} />}
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-neutral-400 dark:text-neutral-500 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{label}</p>
        <p className={`text-sm text-neutral-700 dark:text-neutral-200 mt-0.5 ${mono ? 'font-[family-name:var(--font-mono,\'IBM_Plex_Mono\',ui-monospace,monospace)]' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ── Wallet Tab ──────────────────────────────────────────────────────────────

function WalletTab({ transactions }: { transactions: WMWalletTransaction[] }) {
  const sorted = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const totalPurchased = transactions.filter((t) => t.type === 'package_purchase').reduce((sum, t) => sum + (t.willCredits || 0), 0)
  const totalUsed = transactions.filter((t) => t.type === 'will_used').reduce((sum, t) => sum + Math.abs(t.willCredits || 0), 0)
  const totalSpent = transactions.filter((t) => t.type === 'package_purchase').reduce((sum, t) => sum + t.amount, 0)

  return (
    <div>
      {/* Wallet summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-0.5">Total Purchased</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
            {totalPurchased}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-0.5">Total Used</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
            {totalUsed}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-red-500 dark:text-red-400 mb-0.5">Total Spent</p>
          <p className="text-xl font-bold text-red-500 dark:text-red-400 tracking-tight font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
            {formatCurrency(totalSpent)}
          </p>
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
        <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Transaction History</h3>
        </div>

        {sorted.length === 0 ? (
          <EmptyState icon={<Wallet size={32} />} title="No transactions" subtitle="Wallet transaction history will appear here" />
        ) : (
          sorted.map((txn, idx) => {
            const cfg = TXN_TYPE_CONFIG[txn.type]
            const isLast = idx === sorted.length - 1
            return (
              <div
                key={txn.id}
                className={`flex items-center justify-between px-5 py-3.5 ${!isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${txn.type === 'package_purchase' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                    <span className={cfg.color}>{cfg.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{txn.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {txn.customerName && (
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{txn.customerName}</span>
                      )}
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{formatDate(txn.createdAt)}</span>
                    </div>
                    {txn.remarks && (
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">{txn.remarks}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  {txn.amount > 0 ? (
                    <p className={`text-sm font-semibold tabular-nums font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] ${cfg.color}`}>
                      {cfg.sign}{formatCurrency(txn.amount)}
                    </p>
                  ) : null}
                  {txn.willCredits != null && (
                    <p className={`text-[10px] font-medium mt-0.5 ${txn.willCredits > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {txn.willCredits > 0 ? '+' : ''}{txn.willCredits} credit{Math.abs(txn.willCredits) !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Team Tab ────────────────────────────────────────────────────────────────

function TeamTab({
  teamMembers,
  onAddTeamMember,
}: {
  teamMembers: WMTeamMember[]
  onAddTeamMember?: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Team Members</h2>
        <button
          onClick={onAddTeamMember}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-500 transition-colors cursor-pointer shadow-sm"
        >
          <UserPlus size={12} />
          Add Member
        </button>
      </div>

      {teamMembers.length === 0 ? (
        <EmptyState icon={<Users size={32} />} title="No team members" subtitle="This partner hasn't added any team members yet" />
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
          {/* Desktop table header */}
          <div className="hidden sm:grid grid-cols-[minmax(140px,2fr)_minmax(120px,1.5fr)_minmax(100px,1fr)_100px_80px_80px] gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <span>Name</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Designation</span>
            <span className="text-center">Status</span>
            <span className="text-right">Joined</span>
          </div>

          {teamMembers.map((member, idx) => {
            const isLast = idx === teamMembers.length - 1
            const statusCfg = TEAM_STATUS_CONFIG[member.status]
            const fullName = `${member.firstName} ${member.lastName}`
            return (
              <div key={member.id}>
                {/* Desktop row */}
                <div className={`hidden sm:grid grid-cols-[minmax(140px,2fr)_minmax(120px,1.5fr)_minmax(100px,1fr)_100px_80px_80px] gap-2 px-5 py-3.5 items-center ${!isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''}`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarColor(fullName)}`}>
                      {getInitials(fullName)}
                    </div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{fullName}</p>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{member.email}</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">{member.phone}</p>
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded truncate">
                    {member.designation}
                  </span>
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${statusCfg.text}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 text-right">{formatDate(member.joinedAt)}</p>
                </div>

                {/* Mobile card */}
                <div className={`sm:hidden px-5 py-4 ${!isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarColor(fullName)}`}>
                      {getInitials(fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{fullName}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${statusCfg.text}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{member.designation}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-400 dark:text-neutral-500">
                        <span>{member.phone}</span>
                        <span>{member.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Customers Tab ───────────────────────────────────────────────────────────

function CustomersTab({
  customers,
  onViewCustomer,
}: {
  customers: WMCustomer[]
  onViewCustomer?: (customerId: string) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Tagged Customers</h2>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">{customers.length} customer{customers.length !== 1 ? 's' : ''}</p>
      </div>

      {customers.length === 0 ? (
        <EmptyState icon={<Briefcase size={32} />} title="No customers yet" subtitle="Customers tagged under this partner will appear here" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {customers.map((cust) => (
            <div
              key={cust.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-4 hover:border-orange-300 dark:hover:border-orange-800 transition-colors cursor-pointer group"
              onClick={() => onViewCustomer?.(cust.customerId)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarColor(cust.customerName)}`}>
                    {getInitials(cust.customerName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{cust.customerName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">{cust.customerId}</span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{cust.city}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-neutral-300 dark:text-neutral-600 group-hover:text-orange-500 transition-colors shrink-0 mt-1" />
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded">
                  {cust.serviceType.length > 30 ? cust.serviceType.slice(0, 28) + '...' : cust.serviceType}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-200">{cust.totalCases}</span> cases
                </span>
                <span className="text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-200">{cust.activeCases}</span> active
                </span>
                <span className="ml-auto font-semibold text-neutral-900 dark:text-neutral-100 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                  {formatCurrency(cust.salesValue)}
                </span>
              </div>

              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2">
                Converted {formatDate(cust.convertedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Cases Tab ───────────────────────────────────────────────────────────────

function CasesTab({
  customers,
  onViewCustomer,
}: {
  customers: WMCustomer[]
  onViewCustomer?: (customerId: string) => void
}) {
  // Synthesize a flat per-case list from each customer's totalCases / activeCases.
  const rows = customers.flatMap((cust) => {
    const list: { caseId: string; customerId: string; customerName: string; serviceType: string; status: 'in-progress' | 'completed' }[] = []
    for (let i = 0; i < cust.totalCases; i++) {
      list.push({
        caseId: `${cust.customerId}-${String(i + 1).padStart(2, '0')}`,
        customerId: cust.customerId,
        customerName: cust.customerName,
        serviceType: cust.serviceType,
        status: i < cust.activeCases ? 'in-progress' : 'completed',
      })
    }
    return list
  })

  const total = rows.length
  const active = rows.filter((r) => r.status === 'in-progress').length
  const completed = rows.filter((r) => r.status === 'completed').length

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-0.5">Total Cases</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">{total}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-0.5">In Progress</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">{active}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-0.5">Completed</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">{completed}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">All Cases</h2>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">{total} case{total !== 1 ? 's' : ''}</p>
      </div>

      {total === 0 ? (
        <EmptyState icon={<Scale size={32} />} title="No cases yet" subtitle="Cases linked to this partner's customers will appear here" />
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
          {/* Header */}
          <div className="hidden lg:grid grid-cols-[120px_minmax(140px,1.5fr)_minmax(140px,1fr)_100px_24px] gap-2 px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <span>Case ID</span>
            <span>Customer</span>
            <span>Service Type</span>
            <span className="text-center">Status</span>
            <span />
          </div>

          {rows.map((r, idx) => {
            const statusCfg = r.status === 'in-progress'
              ? { label: 'In Progress', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' }
              : { label: 'Completed', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' }
            const isLast = idx === rows.length - 1

            return (
              <div
                key={r.caseId}
                onClick={() => onViewCustomer?.(r.customerId)}
                className={`flex lg:grid lg:grid-cols-[120px_minmax(140px,1.5fr)_minmax(140px,1fr)_100px_24px] gap-3 px-4 py-3 items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer ${
                  !isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''
                }`}
              >
                <span className="hidden lg:inline text-xs font-medium text-neutral-500 dark:text-neutral-400 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                  {r.caseId}
                </span>
                <div className="flex items-center gap-2.5 min-w-0 flex-1 lg:flex-initial">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarColor(r.customerName)}`}>
                    {getInitials(r.customerName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{r.customerName}</p>
                    <p className="lg:hidden text-[10px] text-neutral-400 dark:text-neutral-500 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">{r.caseId}</p>
                  </div>
                </div>
                <div className="hidden lg:block min-w-0">
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded truncate max-w-full" title={r.serviceType}>
                    {r.serviceType.length > 26 ? r.serviceType.slice(0, 24) + '…' : r.serviceType}
                  </span>
                </div>
                <div className="flex lg:justify-center shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${statusCfg.bg} ${statusCfg.text}`}>
                    {statusCfg.label}
                  </span>
                </div>
                <ChevronRight size={14} className="hidden lg:block text-neutral-300 dark:text-neutral-600" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Packages Tab ────────────────────────────────────────────────────────────

function PackagesTab({ packages }: { packages: WMPackage[] }) {
  const sorted = [...packages].sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())
  const totalWillsIncluded = packages.reduce((sum, p) => sum + p.willsIncluded, 0)
  const totalWillsUsed = packages.reduce((sum, p) => sum + p.willsUsed, 0)
  const totalSpent = packages.reduce((sum, p) => sum + p.totalPrice, 0)

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-0.5">Total Wills Included</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
            {totalWillsIncluded}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-0.5">Wills Used</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
            {totalWillsUsed}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400 mb-0.5">Total Spent</p>
          <p className="text-xl font-bold text-violet-600 dark:text-violet-400 tracking-tight font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
            {formatCurrency(totalSpent)}
          </p>
        </div>
      </div>

      {/* Packages table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
        <div className="hidden sm:grid grid-cols-[80px_minmax(80px,1fr)_minmax(140px,1.5fr)_90px_90px_90px_70px] gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <span>Tier</span>
          <span>Wills</span>
          <span>Progress</span>
          <span className="text-right">Price</span>
          <span>Purchased</span>
          <span>Expires</span>
          <span className="text-center">Status</span>
        </div>

        {sorted.length === 0 ? (
          <EmptyState icon={<Package size={32} />} title="No packages" subtitle="Package purchase history will appear here" />
        ) : (
          sorted.map((pkg, idx) => {
            const isLast = idx === sorted.length - 1
            const tierCfg = TIER_CONFIG[pkg.tier]
            const statusCfg = PACKAGE_STATUS_CONFIG[pkg.status]
            const usagePct = pkg.willsIncluded > 0 ? (pkg.willsUsed / pkg.willsIncluded) * 100 : 0
            return (
              <div key={pkg.id}>
                {/* Desktop row */}
                <div className={`hidden sm:grid grid-cols-[80px_minmax(80px,1fr)_minmax(140px,1.5fr)_90px_90px_90px_70px] gap-2 px-5 py-3.5 items-center ${!isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''}`}>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${tierCfg.bg} ${tierCfg.text} ${tierCfg.border}`}>
                    {tierCfg.icon}
                    {tierCfg.label}
                  </span>
                  <span className="text-xs text-neutral-600 dark:text-neutral-300 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                    {pkg.willsUsed}/{pkg.willsIncluded}
                  </span>
                  <div>
                    <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${usagePct >= 100 ? 'bg-red-500' : usagePct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(usagePct, 100)}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-0.5">{pkg.willsRemaining} remaining</p>
                  </div>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 text-right tabular-nums font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                    {formatCurrency(pkg.totalPrice)}
                  </span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{formatDate(pkg.purchasedAt)}</span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{formatDate(pkg.expiresAt)}</span>
                  <div className="flex justify-center">
                    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded ${statusCfg.bg} ${statusCfg.text}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                {/* Mobile card */}
                <div className={`sm:hidden px-5 py-4 ${!isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${tierCfg.bg} ${tierCfg.text} ${tierCfg.border}`}>
                          {tierCfg.icon}
                          {tierCfg.label}
                        </span>
                        <span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {pkg.willsUsed}/{pkg.willsIncluded} wills used · {pkg.willsRemaining} remaining
                      </p>
                      <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mt-1.5 max-w-[180px]">
                        <div
                          className={`h-full rounded-full ${usagePct >= 100 ? 'bg-red-500' : usagePct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(usagePct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">
                        {formatCurrency(pkg.totalPrice)}
                      </p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                        {formatDate(pkg.purchasedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Footer */}
        {sorted.length > 0 && (
          <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <p className="text-xs text-neutral-400 dark:text-neutral-500">{sorted.length} package{sorted.length !== 1 ? 's' : ''}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Total spent: <span className="font-bold text-neutral-800 dark:text-neutral-200 font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">{formatCurrency(totalSpent)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// Shared Sub-components
// ===========================================================================

function QuickStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center px-3 py-2 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tabular-nums font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]">{value}</p>
    </div>
  )
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="py-14 text-center">
      <div className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3">{icon}</div>
      <p className="font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{subtitle}</p>
    </div>
  )
}
