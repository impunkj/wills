import { useState, useMemo } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Save,
  AlertCircle,
  Check,
  Paperclip,
  FileText,
  X,
  Loader2,
} from 'lucide-react'
import type {
  Lead,
  LeadSource,
  LeadType,
  WealthManager,
} from '../types'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LeadFormProps {
  /** If provided, the form is in edit mode. Otherwise, it's create mode. */
  lead?: Lead
  /** Wealth Managers for the mandatory assignment dropdown */
  wealthManagers: WealthManager[]
  /** List of employees for the assigned-to dropdown */
  employees?: string[]
  /** Called when the form is saved */
  onSave?: (data: Partial<Lead>) => void
  /** Called when the user cancels */
  onCancel?: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCES: LeadSource[] = ['Website', 'Referral', 'Wealth Manager', 'Walk-in', 'Campaign']

const LEAD_TYPES: LeadType[] = ['HNI', 'Individual', 'Corporate']

const SERVICE_OPTIONS = [
  'Will Drafting',
  'Will Advisory',
  'Trust Drafting',
  'Trust Registration',
  'Trust Advisory',
  'Succession Certificate',
  'Application Filing',
  'Court Representation',
]

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
]

const STEPS = [
  { label: 'Basic Details', description: 'Contact & address' },
  { label: 'Lead Details', description: 'Professional & classification' },
  { label: 'Assignment', description: 'Assignment & notes' },
]

// ---------------------------------------------------------------------------
// LeadForm Component
// ---------------------------------------------------------------------------

export function LeadForm({
  lead,
  wealthManagers,
  employees = [],
  onSave,
  onCancel,
}: LeadFormProps) {
  const isEdit = !!lead

  const [step, setStep] = useState(1)

  // Form state
  const [form, setForm] = useState({
    name: lead?.name ?? '',
    phone: lead?.phone ?? '',
    email: lead?.email ?? '',
    address: lead?.address ?? '',
    city: lead?.city ?? '',
    state: lead?.state ?? '',
    pinCode: lead?.pinCode ?? '',
    company: lead?.company ?? '',
    designation: lead?.designation ?? '',
    source: lead?.source ?? ('' as string),
    leadType: lead?.leadType ?? ('' as string),
    serviceInterest: lead?.serviceInterest ?? '',
    wealthManagerId: lead?.wealthManagerId ?? '',
    assignedEmployee: lead?.assignedEmployee ?? '',
    notes: lead?.notes ?? '',
    attachments: [] as string[],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Derived
  const activeWealthManagers = useMemo(
    () => wealthManagers.filter((wm) => wm.isActive),
    [wealthManagers]
  )

  const selectedWM = useMemo(
    () => wealthManagers.find((wm) => wm.id === form.wealthManagerId),
    [wealthManagers, form.wealthManagerId]
  )

  // Handlers
  const updateField = (field: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const validateStep = (s: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (s === 1) {
      if (!form.name.trim()) newErrors.name = 'Name is required'
      if (!form.phone.trim()) newErrors.phone = 'Phone is required'
      if (!form.email.trim()) newErrors.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Enter a valid email'
      if (!form.city.trim()) newErrors.city = 'City is required'
      if (!form.state) newErrors.state = 'State is required'
    } else if (s === 2) {
      if (!form.source) newErrors.source = 'Source is required'
      if (!form.leadType) newErrors.leadType = 'Lead type is required'
      if (!form.serviceInterest) newErrors.serviceInterest = 'Service interest is required'
    }

    setErrors((prev) => ({ ...prev, ...newErrors }))
    const stepFields = s === 1
      ? ['name', 'phone', 'email', 'city', 'state']
      : s === 2
      ? ['source', 'leadType', 'serviceInterest']
      : []
    const touchAll: Record<string, boolean> = {}
    stepFields.forEach((k) => (touchAll[k] = true))
    setTouched((prev) => ({ ...prev, ...touchAll }))

    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const handleSubmit = () => {
    if (!validateStep(3) || isSubmitting) return
    setIsSubmitting(true)
    setTimeout(() => {
      const wmName = wealthManagers.find((wm) => wm.id === form.wealthManagerId)?.name ?? ''
      onSave?.({
        ...form,
        source: form.source as LeadSource,
        leadType: form.leadType as LeadType,
        wealthManagerName: wmName,
      })
      setIsSubmitting(false)
    }, 600)
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => onCancel?.()}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <ArrowLeft size={20} strokeWidth={2} />
              </button>
              <h1 className="text-[22px] font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                {isEdit ? 'Edit Lead' : 'Add New Lead'}
              </h1>
            </div>
            <p className="mt-0.5 text-[13px] text-neutral-600 dark:text-neutral-400 ml-10">
              {isEdit
                ? `Editing ${lead.name} — ${lead.id}`
                : 'Fill in the details below to create a new lead.'}
            </p>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Stepper                                                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => {
            const stepNum = i + 1
            const isActive = step === stepNum
            const isCompleted = step > stepNum
            return (
              <div key={i} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-colors shrink-0 ${
                      isCompleted
                        ? 'bg-orange-500 text-white'
                        : isActive
                        ? 'bg-orange-500 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {isCompleted ? <Check size={16} strokeWidth={2.5} /> : stepNum}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-[13px] font-semibold ${isActive || isCompleted ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-500'}`}>
                      {s.label}
                    </p>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{s.description}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${step > stepNum ? 'bg-orange-400' : 'bg-neutral-200 dark:bg-neutral-700'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Form Sections                                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="space-y-5 max-w-4xl mx-auto">
        {/* ── Step 1: Basic Details ── */}
        {step === 1 && (
          <>
            <FormSection
              title="Contact Information"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FormField
                    label="Full Name"
                    required
                    error={touched.name ? errors.name : undefined}
                  >
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      onBlur={() => markTouched('name')}
                      placeholder="e.g. Rajesh Kumar"
                      className={inputClass(touched.name && !!errors.name)}
                    />
                  </FormField>
                </div>
                <FormField
                  label="Phone Number"
                  required
                  error={touched.phone ? errors.phone : undefined}
                >
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    onBlur={() => markTouched('phone')}
                    placeholder="+91 98765 43210"
                    className={inputClass(touched.phone && !!errors.phone)}
                  />
                </FormField>
                <FormField
                  label="Email Address"
                  required
                  error={touched.email ? errors.email : undefined}
                >
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    onBlur={() => markTouched('email')}
                    placeholder="name@example.com"
                    className={inputClass(touched.email && !!errors.email)}
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Address"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FormField label="Street Address">
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="e.g. Sector 62, Phase 3"
                      className={inputClass(false)}
                    />
                  </FormField>
                </div>
                <FormField
                  label="City"
                  required
                  error={touched.city ? errors.city : undefined}
                >
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    onBlur={() => markTouched('city')}
                    placeholder="e.g. Noida"
                    className={inputClass(touched.city && !!errors.city)}
                  />
                </FormField>
                <FormField
                  label="State"
                  required
                  error={touched.state ? errors.state : undefined}
                >
                  <select
                    value={form.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    onBlur={() => markTouched('state')}
                    className={selectClass(touched.state && !!errors.state)}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="PIN Code">
                  <input
                    type="text"
                    value={form.pinCode}
                    onChange={(e) => updateField('pinCode', e.target.value)}
                    placeholder="e.g. 201301"
                    maxLength={6}
                    className={inputClass(false)}
                  />
                </FormField>
              </div>
            </FormSection>
          </>
        )}

        {/* ── Step 2: Lead Details ── */}
        {step === 2 && (
          <>
            <FormSection
              title="Professional Details"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Company">
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => updateField('company', e.target.value)}
                    placeholder="e.g. Kumar Enterprises Pvt Ltd"
                    className={inputClass(false)}
                  />
                </FormField>
                <FormField label="Designation">
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => updateField('designation', e.target.value)}
                    placeholder="e.g. Managing Director"
                    className={inputClass(false)}
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Lead Classification"
            >
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  label="Source"
                  required
                  error={touched.source ? errors.source : undefined}
                >
                  <select
                    value={form.source}
                    onChange={(e) => updateField('source', e.target.value)}
                    onBlur={() => markTouched('source')}
                    className={selectClass(touched.source && !!errors.source)}
                  >
                    <option value="">Select source</option>
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  label="Lead Type"
                  required
                  error={touched.leadType ? errors.leadType : undefined}
                >
                  <select
                    value={form.leadType}
                    onChange={(e) => updateField('leadType', e.target.value)}
                    onBlur={() => markTouched('leadType')}
                    className={selectClass(touched.leadType && !!errors.leadType)}
                  >
                    <option value="">Select type</option>
                    {LEAD_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  label="Service Interest"
                  required
                  error={touched.serviceInterest ? errors.serviceInterest : undefined}
                >
                  <select
                    value={form.serviceInterest}
                    onChange={(e) => updateField('serviceInterest', e.target.value)}
                    onBlur={() => markTouched('serviceInterest')}
                    className={selectClass(touched.serviceInterest && !!errors.serviceInterest)}
                  >
                    <option value="">Select service</option>
                    {SERVICE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </FormField>
              </div>
            </FormSection>
          </>
        )}

        {/* ── Step 3: Assignment ── */}
        {step === 3 && (
          <>
            <FormSection
              title="Assignment"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormField
                    label="Wealth Manager"
                    error={touched.wealthManagerId ? errors.wealthManagerId : undefined}
                  >
                    <select
                      value={form.wealthManagerId}
                      onChange={(e) => updateField('wealthManagerId', e.target.value)}
                      onBlur={() => markTouched('wealthManagerId')}
                      className={selectClass(touched.wealthManagerId && !!errors.wealthManagerId)}
                    >
                      <option value="">Select wealth manager</option>
                      {activeWealthManagers.map((wm) => (
                        <option key={wm.id} value={wm.id}>
                          {wm.name} — {wm.company}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {selectedWM && (
                    <div className="mt-2.5 flex items-center gap-3 rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2.5 dark:border-orange-900/30 dark:bg-orange-950/20">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-[11px] font-bold text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
                        {selectedWM.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-100">
                          {selectedWM.name}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {selectedWM.company} · {selectedWM.phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <FormField label="Assigned Employee">
                  {employees.length > 0 ? (
                    <select
                      value={form.assignedEmployee}
                      onChange={(e) => updateField('assignedEmployee', e.target.value)}
                      className={selectClass(false)}
                    >
                      <option value="">Select employee</option>
                      {employees.map((emp) => (
                        <option key={emp} value={emp}>{emp}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.assignedEmployee}
                      onChange={(e) => updateField('assignedEmployee', e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className={inputClass(false)}
                    />
                  )}
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Notes"
            >
              <FormField label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Any additional information about this lead..."
                  rows={4}
                  className={`${inputClass(false)} resize-none`}
                />
              </FormField>

              <FormField label="Attachments">
                {form.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.attachments.map((file, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700"
                      >
                        <FileText size={11} />
                        {file}
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              'attachments',
                              form.attachments.filter((_, idx) => idx !== i),
                            )
                          }
                          className="text-neutral-400 hover:text-red-500 transition-colors cursor-pointer ml-0.5"
                          aria-label="Remove attachment"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const names = [
                      'Document.pdf',
                      'Agreement.pdf',
                      'ID_Proof.jpg',
                      'Brochure.pdf',
                      'Will_Draft.docx',
                      'Receipt.pdf',
                      'Photo.png',
                    ]
                    const randomFile = names[Math.floor(Math.random() * names.length)]
                    updateField('attachments', [...form.attachments, randomFile])
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <Paperclip size={12} />
                  Add Attachment
                </button>
              </FormField>
            </FormSection>
          </>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Footer navigation                                                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="max-w-4xl mx-auto mt-6 flex items-center justify-between border-t border-neutral-200 pt-5 dark:border-neutral-700/50 max-lg:sticky max-lg:bottom-0 max-lg:-mx-6 max-lg:px-6 max-lg:py-3 max-lg:bg-white/95 max-lg:dark:bg-neutral-900/95 max-lg:backdrop-blur max-lg:z-10 max-lg:mt-0">
        <div>
          {step > 1 ? (
            <button
              onClick={handlePrev}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[12px] font-medium text-neutral-600 transition-all hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600 cursor-pointer"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Previous
            </button>
          ) : (
            <p className="text-[11px] text-neutral-400">
              <span className="text-rose-500">*</span> Required fields
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-5 py-2 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98] cursor-pointer"
            >
              Next
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-5 py-2 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} strokeWidth={2} />}
              {isSubmitting
                ? isEdit ? 'Saving…' : 'Creating…'
                : isEdit ? 'Update Lead' : 'Create Lead'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FormSection({
  title,
  highlight,
  children,
}: {
  title: string
  highlight?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={`rounded-xl border bg-white dark:bg-neutral-800/60 ${
        highlight
          ? 'border-orange-200 dark:border-orange-900/40'
          : 'border-neutral-200/80 dark:border-neutral-800'
      }`}
    >
      <div
        className={`border-b px-5 py-3.5 ${
          highlight
            ? 'border-orange-100 bg-orange-50/30 dark:border-orange-900/30 dark:bg-orange-950/10'
            : 'border-neutral-100 dark:border-neutral-700/50'
        }`}
      >
        <h3 className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
          {title}
          {highlight && (
            <span className="ml-1.5 text-[10px] font-medium text-orange-500">Mandatory</span>
          )}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500">
          <AlertCircle size={10} strokeWidth={2} />
          {error}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

function inputClass(hasError: boolean): string {
  return `w-full rounded-lg border px-3 py-2 text-[13px] text-neutral-800 placeholder-neutral-400 outline-none transition-colors dark:text-neutral-200 dark:placeholder-neutral-500 ${
    hasError
      ? 'border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-rose-700 dark:bg-rose-950/10 dark:focus:ring-rose-900/30'
      : 'border-neutral-200 bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:border-orange-700 dark:focus:ring-orange-900/30'
  }`
}

function selectClass(hasError: boolean): string {
  return `${inputClass(hasError)} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_8px_center] bg-no-repeat pr-8`
}
