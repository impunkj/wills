import { useState, useMemo } from 'react'
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Send,
  MessageCircle,
  Save,
  Search,
  FileText,
  IndianRupee,
  Clock,
  CheckSquare,
  ShoppingCart,
  X,
} from 'lucide-react'
import type {
  Lead,
  Service,
  ServiceCategory,
  Quotation,
  QuotationItem,
} from '../types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface QuotationBuilderProps {
  /** The lead this quotation is being created for */
  lead: Lead
  /** Available services from the catalog */
  services: Service[]
  /** Optional existing quotation (for editing) */
  quotation?: Quotation
  /** Called when quotation is saved as draft */
  onSave?: (data: {
    items: QuotationItem[]
    subtotal: number
    taxRate: number
    taxAmount: number
    total: number
  }) => void
  /** Called when quotation is sent via email */
  onSendEmail?: () => void
  /** Called when quotation is sent via WhatsApp */
  onSendWhatsApp?: () => void
  /** Called when user navigates back */
  onBack?: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAX_RATE = 18 // GST percentage

const CATEGORY_ORDER: ServiceCategory[] = ['Wills', 'Trusts', 'Succession Certificate']

const CATEGORY_COLORS: Record<ServiceCategory, { bg: string; text: string; badge: string }> = {
  Wills: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-700 dark:text-orange-300',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  },
  Trusts: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  },
  'Succession Certificate': {
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// ---------------------------------------------------------------------------
// QuotationBuilder Component
// ---------------------------------------------------------------------------

export function QuotationBuilder({
  lead,
  services,
  quotation,
  onSave,
  onSendEmail,
  onSendWhatsApp,
  onBack,
}: QuotationBuilderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all')

  // Line items state
  const [items, setItems] = useState<QuotationItem[]>(() => {
    if (quotation?.items) return [...quotation.items]
    return []
  })

  // Manual discount (flat amount in INR)
  const [discount, setDiscount] = useState<number>(0)

  // Send modal state
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [sendVia, setSendVia] = useState<'email' | 'whatsapp'>('email')

  // Derived: group active services by category
  const activeServices = useMemo(
    () => services.filter((s) => s.isActive),
    [services]
  )

  const filteredServices = useMemo(() => {
    let result = activeServices

    if (selectedCategory !== 'all') {
      result = result.filter((s) => s.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      )
    }

    return result
  }, [activeServices, selectedCategory, searchQuery])

  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {}
    for (const s of filteredServices) {
      if (!groups[s.category]) groups[s.category] = []
      groups[s.category].push(s)
    }
    return groups
  }, [filteredServices])

  // Pricing calculations
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items])
  const cappedDiscount = Math.min(Math.max(0, discount), subtotal)
  const discountedSubtotal = subtotal - cappedDiscount
  const taxAmount = Math.round((discountedSubtotal * TAX_RATE) / 100)
  const total = discountedSubtotal + taxAmount

  // Item management
  const addItem = (service: Service) => {
    const existing = items.find((i) => i.serviceId === service.id)
    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.serviceId === service.id
            ? { ...i, quantity: i.quantity + 1, amount: (i.quantity + 1) * i.unitPrice }
            : i
        )
      )
    } else {
      setItems((prev) => [
        ...prev,
        {
          serviceId: service.id,
          serviceName: service.name,
          quantity: 1,
          unitPrice: service.basePrice,
          amount: service.basePrice,
        },
      ])
    }
  }

  const updateQuantity = (serviceId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.serviceId !== serviceId) return i
          const newQty = Math.max(0, i.quantity + delta)
          if (newQty === 0) return null as any
          return { ...i, quantity: newQty, amount: newQty * i.unitPrice }
        })
        .filter(Boolean)
    )
  }

  const removeItem = (serviceId: string) => {
    setItems((prev) => prev.filter((i) => i.serviceId !== serviceId))
  }

  const isInCart = (serviceId: string) => items.some((i) => i.serviceId === serviceId)
  const getItemQty = (serviceId: string) => items.find((i) => i.serviceId === serviceId)?.quantity ?? 0

  const handleSave = () => {
    onSave?.({ items, subtotal, taxRate: TAX_RATE, taxAmount, total })
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => onBack?.()}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <ArrowLeft size={20} strokeWidth={2} />
              </button>
              <h1 className="text-[22px] font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                {quotation ? 'Edit Quotation' : 'New Quotation'}
              </h1>
            </div>
            <p className="mt-0.5 text-[13px] text-neutral-600 dark:text-neutral-400">
              Creating quotation for{' '}
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                {lead.name}
              </span>
              <span
                className="ml-2 text-[11px] text-neutral-400"
                style={{ fontFamily: '"IBM Plex Mono", monospace' }}
              >
                {lead.id}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBack?.()}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-[7px] text-[12px] font-medium text-neutral-600 transition-all hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              <X size={13} strokeWidth={2} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={items.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-[7px] text-[12px] font-medium text-neutral-600 transition-all hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              <Save size={13} strokeWidth={2} />
              Save Draft
            </button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Two-panel layout                                                  */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-[1fr_380px] gap-5">
        {/* ----- Left: Service Catalog ----- */}
        <div className="space-y-4">
          {/* Search + Category filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                strokeWidth={2}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-[36px] w-full rounded-lg border border-neutral-200 bg-white pl-8 pr-3 text-[12px] text-neutral-800 placeholder-neutral-400 outline-none transition-colors focus:border-orange-300 focus:ring-2 focus:ring-orange-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder-neutral-500 dark:focus:border-orange-700 dark:focus:ring-orange-900/30"
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                }`}
              >
                All
              </button>
              {CATEGORY_ORDER.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                    selectedCategory === cat
                      ? `${CATEGORY_COLORS[cat].badge}`
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Service cards by category */}
          {Object.keys(groupedServices).length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200/80 bg-white py-16 dark:border-neutral-800 dark:bg-neutral-800/60">
              <Search size={24} className="mb-2 text-neutral-300 dark:text-neutral-600" />
              <p className="text-[13px] text-neutral-400">No services found</p>
            </div>
          ) : (
            CATEGORY_ORDER.filter((cat) => groupedServices[cat]).map((category) => {
              const catServices = groupedServices[category]
              const colors = CATEGORY_COLORS[category]

              return (
                <div
                  key={category}
                  className="rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-800/60"
                >
                  <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3 dark:border-neutral-700/50">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${colors.badge}`}
                    >
                      {category}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {catServices.length} service{catServices.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="divide-y divide-neutral-100 dark:divide-neutral-700/40">
                    {catServices.map((service) => {
                      const inCart = isInCart(service.id)
                      const qty = getItemQty(service.id)

                      return (
                        <div
                          key={service.id}
                          className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                            inCart
                              ? 'bg-orange-50/40 dark:bg-orange-950/10'
                              : 'hover:bg-neutral-50/60 dark:hover:bg-neutral-700/10'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
                              {service.name}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                              {service.description}
                            </p>
                            <div className="mt-1.5 flex items-center gap-3">
                              <span
                                className="text-[13px] font-bold text-neutral-900 dark:text-neutral-50"
                                style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                              >
                                {formatCurrency(service.basePrice)}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                                <Clock size={9} strokeWidth={2} />
                                {service.estimatedTAT}
                              </span>
                              {service.documentChecklist.length > 0 && (
                                <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                                  <CheckSquare size={9} strokeWidth={2} />
                                  {service.documentChecklist.length} docs
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Add / Quantity control */}
                          <div className="shrink-0 pt-1">
                            {inCart ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateQuantity(service.id, -1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                                >
                                  <Minus size={12} strokeWidth={2} />
                                </button>
                                <span
                                  className="w-7 text-center text-[13px] font-bold text-neutral-800 dark:text-neutral-100"
                                  style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                                >
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateQuantity(service.id, 1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-md border border-orange-200 bg-orange-50 text-orange-600 transition-colors hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400"
                                >
                                  <Plus size={12} strokeWidth={2} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addItem(service)}
                                className="flex h-7 items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2.5 text-[11px] font-semibold text-orange-600 transition-colors hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400"
                              >
                                <Plus size={12} strokeWidth={2} />
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ----- Right: Quotation Preview ----- */}
        <div className="space-y-4">
          {/* Quotation card */}
          <div className="sticky top-4 rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-800/60">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3.5 dark:border-neutral-700/50">
              <ShoppingCart size={14} strokeWidth={2} className="text-orange-500" />
              <h2 className="text-[14px] font-semibold text-neutral-800 dark:text-neutral-100">
                Quotation Preview
              </h2>
              {items.length > 0 && (
                <span
                  className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                  style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                >
                  {items.length} item{items.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Lead info */}
            <div className="border-b border-neutral-100 px-5 py-3 dark:border-neutral-700/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-[11px] font-bold text-white">
                  {lead.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-100">
                    {lead.name}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {lead.company || lead.city} · {lead.serviceInterest}
                  </p>
                </div>
              </div>
            </div>

            {/* Line items */}
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText size={28} className="mb-2 text-neutral-200 dark:text-neutral-700" />
                <p className="text-[12px] font-medium text-neutral-400">No services added</p>
                <p className="text-[11px] text-neutral-300 dark:text-neutral-600">
                  Select services from the catalog
                </p>
              </div>
            ) : (
              <>
                <div className="max-h-[320px] divide-y divide-neutral-100 overflow-y-auto dark:divide-neutral-700/40">
                  {items.map((item) => (
                    <div
                      key={item.serviceId}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-700/10"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium text-neutral-800 dark:text-neutral-100">
                          {item.serviceName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-neutral-400">
                          {formatCurrency(item.unitPrice)} x {item.quantity}
                        </p>
                      </div>
                      <span
                        className="shrink-0 text-[12px] font-semibold text-neutral-800 dark:text-neutral-100"
                        style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                      >
                        {formatCurrency(item.amount)}
                      </span>
                      <button
                        onClick={() => removeItem(item.serviceId)}
                        className="shrink-0 rounded p-1 text-neutral-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:text-neutral-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400"
                      >
                        <Trash2 size={12} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Pricing summary */}
                <div className="border-t border-neutral-200 px-5 py-4 dark:border-neutral-700">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-neutral-500">Subtotal</span>
                      <span
                        className="text-neutral-700 dark:text-neutral-200"
                        style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                      >
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-neutral-500 shrink-0">Discount</span>
                      <div className="flex items-center gap-1">
                        <span className="text-neutral-400" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>−</span>
                        <span className="text-neutral-400">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={discount === 0 ? '' : discount}
                          onChange={(e) => {
                            const v = e.target.value
                            setDiscount(v === '' ? 0 : Math.max(0, Number(v)))
                          }}
                          placeholder="0"
                          className="w-24 rounded-md border border-neutral-200 bg-white px-2 py-1 text-right text-[12px] text-neutral-700 placeholder-neutral-300 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                          style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-neutral-500">GST ({TAX_RATE}%)</span>
                      <span
                        className="text-neutral-700 dark:text-neutral-200"
                        style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                      >
                        {formatCurrency(taxAmount)}
                      </span>
                    </div>
                    <div className="border-t border-neutral-100 pt-2 dark:border-neutral-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
                          Total
                        </span>
                        <span
                          className="text-[18px] font-bold text-neutral-900 dark:text-neutral-50"
                          style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                        >
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Send action */}
                <div className="border-t border-neutral-200 px-5 py-4 dark:border-neutral-700">
                  <button
                    onClick={() => {
                      setSendVia('email')
                      setSendModalOpen(true)
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-orange-500 hover:shadow-md active:scale-[0.98]"
                  >
                    <Send size={13} strokeWidth={2} />
                    Send Quotation
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Send Quotation Modal                                              */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Send Quotation</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Choose how you'd like to send this quotation to {lead.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <button
              type="button"
              onClick={() => setSendVia('email')}
              className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                sendVia === 'email'
                  ? 'border-orange-500 bg-orange-50 dark:border-orange-500 dark:bg-orange-950/20'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600'
              }`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                sendVia === 'email' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
              }`}>
                <Send size={14} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">Email</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{lead.email}</p>
              </div>
              <input
                type="radio"
                checked={sendVia === 'email'}
                onChange={() => setSendVia('email')}
                className="accent-orange-500"
              />
            </button>
            <button
              type="button"
              onClick={() => setSendVia('whatsapp')}
              className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                sendVia === 'whatsapp'
                  ? 'border-orange-500 bg-orange-50 dark:border-orange-500 dark:bg-orange-950/20'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600'
              }`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                sendVia === 'whatsapp' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
              }`}>
                <MessageCircle size={14} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">WhatsApp</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{lead.phone}</p>
              </div>
              <input
                type="radio"
                checked={sendVia === 'whatsapp'}
                onChange={() => setSendVia('whatsapp')}
                className="accent-orange-500"
              />
            </button>
          </div>
          <DialogFooter>
            <button
              onClick={() => setSendModalOpen(false)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleSave()
                if (sendVia === 'email') onSendEmail?.()
                else onSendWhatsApp?.()
                setSendModalOpen(false)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              <Send size={13} strokeWidth={2} />
              Send
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
