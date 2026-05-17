import { useState } from 'react'
import {
  ArrowLeft,
  User,
  MapPin,
  Building2,
  Shield,
  TrendingUp,
  Crown,
  Award,
  Medal,
  Gem,
  Send,
  X,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  FileText,
  Landmark,
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react'
import type {
  AddWMFormProps,
  WMGender,
  WMTier,
  WMPermission,
  WMAddress,
  WMCompany,
} from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GENDER_OPTIONS: { value: WMGender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

const TIER_OPTIONS: { value: WMTier; label: string; icon: React.ReactNode; description: string; color: string; wills: number; price: string; validity: string }[] = [
  { value: 'platinum', label: 'Platinum', icon: <Gem size={16} />, description: '100 wills with 15 months validity', color: 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400', wills: 100, price: '₹1,50,000', validity: '15 months' },
  { value: 'gold', label: 'Gold', icon: <Crown size={16} />, description: '25 wills with 9 months validity', color: 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400', wills: 25, price: '₹50,000', validity: '9 months' },
  { value: 'silver', label: 'Silver', icon: <Award size={16} />, description: '5 wills with 6 months validity', color: 'border-neutral-400 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400', wills: 5, price: '₹15,000', validity: '6 months' },
  { value: 'bronze', label: 'Bronze', icon: <Medal size={16} />, description: '1 will with 2 months validity', color: 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400', wills: 1, price: '₹5,000', validity: '2 months' },
]

const PERMISSION_OPTIONS: { value: WMPermission; label: string; description: string }[] = [
  { value: 'leads', label: 'Leads', description: 'View and manage lead pipeline' },
  { value: 'customers', label: 'Customers', description: 'Access customer profiles' },
  { value: 'cases', label: 'Cases', description: 'Track case progress and status' },
  { value: 'documents', label: 'Documents', description: 'View and upload documents' },
]

const INPUT_CLASS = 'w-full px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddWMForm({ onSubmit, onCancel, initialData, mode = 'create' }: AddWMFormProps) {
  const isEdit = mode === 'edit'

  // Basic Info
  const [name, setName] = useState(initialData?.name ?? '')
  const [email, setEmail] = useState(initialData?.email ?? '')
  const [phone, setPhone] = useState(initialData?.phone ?? '')
  const [gender, setGender] = useState<WMGender>(initialData?.gender ?? 'male')
  const [dob, setDob] = useState(initialData?.dob ?? '')

  // Address
  const [country] = useState(initialData?.address?.country ?? 'India')
  const [state, setState] = useState(initialData?.address?.state ?? '')
  const [city, setCity] = useState(initialData?.address?.city ?? '')
  const [area, setArea] = useState(initialData?.address?.area ?? '')
  const [address, setAddress] = useState(initialData?.address?.address ?? '')
  const [pinCode, setPinCode] = useState(initialData?.address?.pinCode ?? '')

  // Company
  const [companyName, setCompanyName] = useState(initialData?.company?.name ?? '')
  const [companyEmail, setCompanyEmail] = useState(initialData?.company?.email ?? '')
  const [gstNumber, setGstNumber] = useState(initialData?.company?.gstNumber ?? '')
  const [panNumber, setPanNumber] = useState(initialData?.company?.panNumber ?? '')
  const [bankName, setBankName] = useState(initialData?.company?.bankName ?? '')
  const [accountNumber, setAccountNumber] = useState(initialData?.company?.accountNumber ?? '')
  const [ifscCode, setIfscCode] = useState(initialData?.company?.ifscCode ?? '')
  const [branch, setBranch] = useState(initialData?.company?.branch ?? '')

  // Tier
  const [tier, setTier] = useState<WMTier>(initialData?.tier ?? 'bronze')

  // Permissions
  const [permissions, setPermissions] = useState<WMPermission[]>(initialData?.permissions ?? ['leads', 'customers'])

  // Dropdown state
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false)

  // ── Handlers ──────────────────────────────────────────────────────────

  function togglePermission(perm: WMPermission) {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    )
  }

  function selectTier(t: WMTier) { setTier(t) }

  const isFormValid = name.trim() && email.trim() && phone.trim() && dob && state && city && panNumber.trim()
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSubmit() {
    if (!isFormValid || isSubmitting) return
    setIsSubmitting(true)
    setTimeout(() => {
      doSubmit()
      setIsSubmitting(false)
    }, 600)
  }

  function doSubmit() {
    onSubmit?.({
      name,
      email,
      phone,
      gender,
      dob,
      address: { country, state, city, area, address, pinCode },
      company: { name: companyName, email: companyEmail, gstNumber, panNumber, bankName, accountNumber, ifscCode, branch },
      tier,
      permissions,
    })
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={onCancel}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  {isEdit ? 'Edit Partner' : 'Add New Partner'}
                </h1>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 ml-10">
                {isEdit ? 'Update partner profile information' : 'Onboard a new wealth manager to the partner program'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form Body ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main form */}
          <div className="flex-1 space-y-6">
            {/* ── Basic Info ────────────────────────────────────────── */}
            <FormSection
              icon={<User size={16} />}
              title="Basic Information"
              description="Personal details of the wealth manager"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Full Name" required>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rakesh Mehra"
                    className={INPUT_CLASS}
                  />
                </FormField>
                <FormField label="Email" required>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rakesh@advisory.com"
                    className={INPUT_CLASS}
                  />
                </FormField>
                <FormField label="Phone" required>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98100 11223"
                    className={INPUT_CLASS}
                  />
                </FormField>
                <FormField label="Date of Birth" required>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </FormField>
              </div>

              {/* Gender */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">Gender</label>
                <div className="flex gap-3">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setGender(opt.value)}
                      className={`px-4 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        gender === opt.value
                          ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400'
                          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </FormSection>

            {/* ── Address ───────────────────────────────────────────── */}
            <FormSection
              icon={<MapPin size={16} />}
              title="Address"
              description="Partner's office or residence address"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Country">
                  <input
                    type="text"
                    value={country}
                    disabled
                    className={`${INPUT_CLASS} opacity-60`}
                  />
                </FormField>
                <FormField label="State" required>
                  <div className="relative">
                    <button
                      onClick={() => setStateDropdownOpen(!stateDropdownOpen)}
                      className={`${INPUT_CLASS} !flex items-center justify-between`}
                    >
                      <span className={state ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400'}>
                        {state || 'Select state'}
                      </span>
                      <ChevronDown size={14} className="text-neutral-400" />
                    </button>
                    {stateDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setStateDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
                          {INDIAN_STATES.map((s) => (
                            <button
                              key={s}
                              onClick={() => { setState(s); setStateDropdownOpen(false) }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer ${
                                state === s ? 'text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-950/20' : 'text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </FormField>
                <FormField label="City" required>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. New Delhi"
                    className={INPUT_CLASS}
                  />
                </FormField>
                <FormField label="Area">
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Connaught Place"
                    className={INPUT_CLASS}
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="sm:col-span-2">
                  <FormField label="Full Address">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. B-12, Barakhamba Road, Inner Circle"
                      className={INPUT_CLASS}
                    />
                  </FormField>
                </div>
                <FormField label="PIN Code">
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="e.g. 110001"
                    maxLength={6}
                    className={INPUT_CLASS}
                  />
                </FormField>
              </div>
            </FormSection>

            {/* ── Company ───────────────────────────────────────────── */}
            <FormSection
              icon={<Building2 size={16} />}
              title="Company Details"
              description="Business entity information (optional for individual partners)"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Company Name">
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Mehra Financial Advisory"
                    className={INPUT_CLASS}
                  />
                </FormField>
                <FormField label="Company Email">
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="e.g. info@mehra-advisory.com"
                    className={INPUT_CLASS}
                  />
                </FormField>
                <FormField label="GST Number">
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 07AAACM1234A1Z5"
                    maxLength={15}
                    className={`${INPUT_CLASS} font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] uppercase`}
                  />
                </FormField>
                <FormField label="PAN Number" required>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. AAACM1234A"
                    maxLength={10}
                    className={`${INPUT_CLASS} font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] uppercase`}
                  />
                </FormField>
              </div>

              {/* Bank Details */}
              <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800/60">
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-3 flex items-center gap-1.5">
                  <Landmark size={12} />
                  Bank Account Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Bank Name">
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className={INPUT_CLASS}
                    />
                  </FormField>
                  <FormField label="Account Number">
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 50100123456789"
                      className={`${INPUT_CLASS} font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)]`}
                    />
                  </FormField>
                  <FormField label="IFSC Code">
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      maxLength={11}
                      className={`${INPUT_CLASS} font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] uppercase`}
                    />
                  </FormField>
                  <FormField label="Branch">
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. Connaught Place, New Delhi"
                      className={INPUT_CLASS}
                    />
                  </FormField>
                </div>
              </div>
            </FormSection>

            {/* ── Tier & Commission ──────────────────────────────────── */}
            <FormSection
              icon={<TrendingUp size={16} />}
              title="Package Selection"
              description="Select the package tier for this partner"
            >
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-3">Partner Tier</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {TIER_OPTIONS.map((opt) => {
                  const selected = tier === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => selectTier(opt.value)}
                      className={`relative p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        selected
                          ? opt.color
                          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <div className={`mb-3 ${selected ? '' : 'text-neutral-400 dark:text-neutral-500'}`}>{opt.icon}</div>
                      <p className={`text-base font-semibold mb-1 ${selected ? '' : 'text-neutral-700 dark:text-neutral-300'}`}>{opt.label}</p>
                      <p className={`text-xs leading-relaxed ${selected ? 'opacity-80' : 'text-neutral-400 dark:text-neutral-500'}`}>{opt.description}</p>
                      <div className="mt-4 space-y-1">
                        <p className={`text-base font-bold font-[family-name:var(--font-mono,'IBM_Plex_Mono',ui-monospace,monospace)] ${selected ? '' : 'text-neutral-500 dark:text-neutral-400'}`}>
                          {opt.price}
                        </p>
                        <p className={`text-xs ${selected ? 'opacity-70' : 'text-neutral-400 dark:text-neutral-500'}`}>
                          {opt.wills} will{opt.wills !== 1 ? 's' : ''} · {opt.validity}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

            </FormSection>

            {/* ── Permissions ────────────────────────────────────────── */}
            <FormSection
              icon={<Shield size={16} />}
              title="Module Permissions"
              description="Select which modules this partner can access"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PERMISSION_OPTIONS.map((opt) => {
                  const checked = permissions.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      onClick={() => togglePermission(opt.value)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        checked
                          ? 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20'
                          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        checked
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-neutral-300 dark:border-neutral-600'
                      }`}>
                        {checked && <Check size={12} className="text-white" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${checked ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{opt.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </FormSection>

          </div>

          {/* ── Sidebar Summary ──────────────────────────────────────── */}
          <div className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-6 space-y-4">
              {/* Partner Summary */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none overflow-hidden">
                <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Partner Summary</h3>
                </div>
                <div className="p-4 space-y-3">
                  <SummaryRow label="Partner ID" value="Auto-generated" mono muted />
                  <SummaryRow label="Name" value={name || '—'} />
                  <SummaryRow label="Email" value={email || '—'} />
                  <SummaryRow label="Phone" value={phone || '—'} />
                  <SummaryRow label="Gender" value={gender === 'male' ? 'Male' : 'Female'} />
                  <SummaryRow label="DOB" value={dob || '—'} />

                  <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                    <SummaryRow label="Location" value={city && state ? `${city}, ${state}` : '—'} />
                    <SummaryRow label="Company" value={companyName || 'Individual'} />
                    <SummaryRow label="PAN" value={panNumber || '—'} mono />
                    {gstNumber && <SummaryRow label="GST" value={gstNumber} mono />}
                  </div>

                  <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                    <SummaryRow
                      label="Tier"
                      value={
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${TIER_OPTIONS.find((t) => t.value === tier)?.color}`}>
                          {TIER_OPTIONS.find((t) => t.value === tier)?.icon}
                          {TIER_OPTIONS.find((t) => t.value === tier)?.label}
                        </span>
                      }
                    />
                    <SummaryRow label="Package" value={`${TIER_OPTIONS.find((t) => t.value === tier)?.wills || 0} wills`} />
                    <SummaryRow label="Price" value={TIER_OPTIONS.find((t) => t.value === tier)?.price || '—'} mono />
                    <SummaryRow label="Validity" value={TIER_OPTIONS.find((t) => t.value === tier)?.validity || '—'} />
                  </div>

                  <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                    <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Permissions</p>
                    <div className="flex flex-wrap gap-1">
                      {permissions.length > 0 ? permissions.map((p) => (
                        <span key={p} className="inline-block px-1.5 py-0.5 text-[9px] font-medium bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded border border-orange-200 dark:border-orange-800/60">
                          {PERMISSION_OPTIONS.find((o) => o.value === p)?.label}
                        </span>
                      )) : (
                        <span className="text-[10px] text-neutral-400 italic">None selected</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto flex items-center justify-end gap-3 max-lg:sticky max-lg:bottom-0 max-lg:-mx-6 max-lg:px-6 max-lg:py-3 max-lg:bg-white/95 max-lg:dark:bg-neutral-900/95 max-lg:backdrop-blur max-lg:border-t max-lg:border-neutral-200 max-lg:dark:border-neutral-800 max-lg:z-10">
        {!isFormValid && (
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {(() => {
              const missing: string[] = []
              if (!name.trim()) missing.push('Name')
              if (!email.trim()) missing.push('Email')
              if (!phone.trim()) missing.push('Phone')
              if (!dob) missing.push('Date of Birth')
              if (!state) missing.push('State')
              if (!city) missing.push('City')
              if (!panNumber.trim()) missing.push('PAN')
              return `Required: ${missing.join(', ')}`
            })()}
          </p>
        )}
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
        >
          <X size={13} />
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer ${
            isFormValid && !isSubmitting
              ? 'text-white bg-orange-500 hover:bg-orange-500'
              : 'text-neutral-400 bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          {isSubmitting ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Partner')}
        </button>
      </div>
    </div>
  )
}

// ===========================================================================
// Sub-components
// ===========================================================================

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs dark:shadow-none p-5">
      <div className="mb-1">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  mono,
  muted,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{label}</span>
      <span className={`text-xs text-right ${mono ? 'font-[family-name:var(--font-mono,\'IBM_Plex_Mono\',ui-monospace,monospace)]' : ''} ${muted ? 'text-neutral-400 dark:text-neutral-500 italic' : 'font-medium text-neutral-800 dark:text-neutral-200'}`}>
        {value}
      </span>
    </div>
  )
}
