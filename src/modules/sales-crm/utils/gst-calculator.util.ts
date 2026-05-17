export type GstType = 'cgst-sgst' | 'igst'

export interface GstCalculationInput {
  taxableAmount: number
  sellerState: string
  customerState: string
  totalRate?: number
}

export interface GstCalculationResult {
  gstType: GstType
  taxableAmount: number
  totalRate: number
  cgstRate: number
  sgstRate: number
  igstRate: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalTaxAmount: number
  grossAmount: number
}

const DEFAULT_TOTAL_GST_RATE = 18

export function calculateIndianGst(input: GstCalculationInput): GstCalculationResult {
  const taxableAmount = roundCurrency(input.taxableAmount)
  const totalRate = input.totalRate ?? DEFAULT_TOTAL_GST_RATE

  if (taxableAmount < 0) {
    throw new Error('taxableAmount cannot be negative')
  }

  if (totalRate < 0) {
    throw new Error('totalRate cannot be negative')
  }

  const sameState = normalizeState(input.sellerState) === normalizeState(input.customerState)

  if (sameState) {
    const halfRate = totalRate / 2
    const cgstAmount = calculateTaxAmount(taxableAmount, halfRate)
    const sgstAmount = calculateTaxAmount(taxableAmount, halfRate)
    const totalTaxAmount = roundCurrency(cgstAmount + sgstAmount)

    return {
      gstType: 'cgst-sgst',
      taxableAmount,
      totalRate,
      cgstRate: halfRate,
      sgstRate: halfRate,
      igstRate: 0,
      cgstAmount,
      sgstAmount,
      igstAmount: 0,
      totalTaxAmount,
      grossAmount: roundCurrency(taxableAmount + totalTaxAmount),
    }
  }

  const igstAmount = calculateTaxAmount(taxableAmount, totalRate)

  return {
    gstType: 'igst',
    taxableAmount,
    totalRate,
    cgstRate: 0,
    sgstRate: 0,
    igstRate: totalRate,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount,
    totalTaxAmount: igstAmount,
    grossAmount: roundCurrency(taxableAmount + igstAmount),
  }
}

export function calculateTaxAmount(taxableAmount: number, rate: number): number {
  return roundCurrency((taxableAmount * rate) / 100)
}

export function normalizeState(state: string): string {
  return state.trim().replace(/\s+/g, ' ').toLowerCase()
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
