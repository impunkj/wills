import { api } from '@/lib/api'
import type {
  FollowUp,
  FollowUpInput,
  Lead,
  LeadSource,
  LeadStatus,
  LeadType,
  Quotation,
  QuotationItem,
  QuotationSentVia,
  Service,
  StatusCounts,
} from '@/features/sales-crm/types'

export interface SalesCrmLeadFilters {
  status?: LeadStatus
  search?: string
  page?: number
  limit?: number
}

export interface CreateLeadDto {
  source: LeadSource
  name: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  pinCode: string
  company?: string
  designation?: string
  serviceInterest: string
  wealthManagerId?: string
  wealthManagerName?: string
  wealthManager?: {
    wealthManagerId: string
    wealthManagerName: string
  }
  assignedEmployee: string
  assignedAgentId?: string
  leadType: LeadType
  status?: LeadStatus
  notes?: string
  taxContext?: {
    sellerState: string
    customerState: string
  }
}

export type UpdateLeadDto = Partial<CreateLeadDto>

export interface CreateQuotationDto {
  items: Array<{
    serviceId: string
    serviceName: string
    quantity: number
    unitPrice: number
  }>
  taxRateOverride?: number
  generatedBy?: string
}

export interface BulkExportFilters extends SalesCrmLeadFilters {
  format?: 'csv' | 'xlsx'
}

export interface LeadsResponse {
  leads: Lead[]
  statusCounts: StatusCounts
}

export interface LeadDetailResponse {
  lead: Lead
  followUps: FollowUp[]
  quotations: Quotation[]
}

export interface BulkImportResponse {
  importedCount: number
  leads: Lead[]
}

export interface BulkExportResponse {
  format: 'csv' | 'xlsx'
  exportedCount: number
  leads: Lead[]
}

export interface AssignToAccountResponse {
  lead: Lead
  accountEntry: {
    id: string
    leadId: string
    customerId: string
    caseId: string
    status: string
    createdAt?: string
    updatedAt?: string
  }
}

export async function getLeads(filters: SalesCrmLeadFilters = {}): Promise<LeadsResponse> {
  const { data } = await api.get<LeadsResponse>('/sales-crm/leads', {
    params: {
      status: filters.status,
      search: filters.search,
      page: filters.page,
      limit: filters.limit,
    },
  })
  return data
}

export async function getLead(id: string): Promise<LeadDetailResponse> {
  const { data } = await api.get<LeadDetailResponse>(`/sales-crm/leads/${id}`)
  return data
}

export async function createLead(dto: CreateLeadDto): Promise<Lead> {
  if (!dto.wealthManagerId) {
    throw new Error('wealthManagerId is required')
  }

  const { data } = await api.post<Lead>('/sales-crm/leads', dto)
  return data
}

export async function updateLead(id: string, dto: UpdateLeadDto): Promise<Lead> {
  const { data } = await api.patch<Lead>(`/sales-crm/leads/${id}`, dto)
  return data
}

export async function deleteLead(id: string): Promise<Lead> {
  const { data } = await api.delete<Lead>(`/sales-crm/leads/${id}`)
  return data
}

export async function getStatusCounts(): Promise<StatusCounts> {
  const { data } = await api.get<StatusCounts>('/sales-crm/leads/status-counts')
  return data
}

export async function addFollowUp(leadId: string, dto: FollowUpInput): Promise<FollowUp> {
  const { data } = await api.post<FollowUp>(`/sales-crm/leads/${leadId}/follow-ups`, dto)
  return data
}

export async function createQuotation(
  leadId: string,
  dto: CreateQuotationDto,
): Promise<Quotation> {
  const { data } = await api.post<Quotation>(`/sales-crm/leads/${leadId}/quotations`, {
    ...dto,
    leadId,
  })
  return data
}

export async function sendQuotation(
  id: string,
  channel: QuotationSentVia,
): Promise<Quotation> {
  const { data } = await api.post<Quotation>(`/sales-crm/quotations/${id}/send`, {
    via: channel,
  })
  return data
}

export async function bulkImport(file: File): Promise<BulkImportResponse> {
  const records = await parseLeadImportFile(file)
  const { data } = await api.post<BulkImportResponse>('/sales-crm/leads/import', {
    records,
  })
  return data
}

export async function bulkExport(
  filters: BulkExportFilters = {},
): Promise<BulkExportResponse> {
  const { data } = await api.get<BulkExportResponse>('/sales-crm/leads/export', {
    params: {
      status: filters.status,
      search: filters.search,
      page: filters.page,
      limit: filters.limit,
      format: filters.format ?? 'csv',
    },
  })
  return data
}

export async function assignToAccount(leadId: string): Promise<AssignToAccountResponse> {
  const { data } = await api.post<AssignToAccountResponse>(
    `/sales-crm/leads/${leadId}/assign-to-account`,
    { leadId },
  )
  return data
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

function splitCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function inferLeadType(value?: string): LeadType {
  const normalized = value?.trim()
  if (normalized === 'HNI' || normalized === 'Individual' || normalized === 'Corporate') {
    return normalized
  }
  return 'Individual'
}

function inferLeadSource(value?: string): LeadSource {
  const normalized = value?.trim()
  const options: LeadSource[] = ['Website', 'Referral', 'Wealth Manager', 'Walk-in', 'Campaign']
  return options.find((option) => option.toLowerCase() === normalized?.toLowerCase()) ?? 'Website'
}

function inferLeadStatus(value?: string): LeadStatus {
  const normalized = value?.trim()
  const options: LeadStatus[] = [
    'new',
    'assigned',
    'follow-up',
    'quotation-sent',
    'projected',
    'invoice-sent',
    'won',
    'lost',
  ]
  return options.find((option) => option === normalized) ?? 'new'
}

async function parseLeadImportFile(file: File): Promise<CreateLeadDto[]> {
  const content = await file.text()
  const name = file.name.toLowerCase()

  if (name.endsWith('.json')) {
    const parsed = JSON.parse(content) as CreateLeadDto[] | { records?: CreateLeadDto[] }
    const records = Array.isArray(parsed) ? parsed : parsed.records ?? []
    return records
  }

  if (!name.endsWith('.csv')) {
    throw new Error('Only CSV and JSON lead imports are supported in the frontend importer')
  }

  const rows = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (rows.length < 2) {
    return []
  }

  const headers = splitCsvLine(rows[0]).map(normalizeHeader)
  return rows.slice(1).map((row, rowIndex) => {
    const values = splitCsvLine(row)
    const read = (header: string) => {
      const position = headers.indexOf(normalizeHeader(header))
      return position >= 0 ? values[position] ?? '' : ''
    }

    const nameValue = read('name')
    const phone = read('phone')
    const email = read('email')
    const wealthManagerName = read('wealthManagerName') || read('wealthManager')
    const wealthManagerId = read('wealthManagerId') || `WM-CSV-${rowIndex + 1}`

    if (!nameValue || !phone || !email || !wealthManagerName) {
      throw new Error('CSV import requires name, phone, email, and wealth manager columns')
    }

    return {
      source: inferLeadSource(read('source')),
      name: nameValue,
      phone,
      email,
      address: read('address') || 'NA',
      city: read('city') || 'Delhi',
      state: read('state') || 'Delhi',
      pinCode: read('pinCode') || read('pincode') || '110001',
      company: read('company'),
      designation: read('designation'),
      serviceInterest: read('serviceInterest') || read('service') || 'Will Drafting',
      wealthManager: {
      wealthManagerId,
      wealthManagerName,
      },
      assignedEmployee: read('assignedEmployee') || 'Wills24 Admin',
      leadType: inferLeadType(read('leadType')),
      status: inferLeadStatus(read('status')),
      notes: read('notes'),
    }
  })
}

export function serializeLeadsToCsv(leads: Lead[]): string {
  const headers = [
    'id',
    'name',
    'phone',
    'email',
    'source',
    'status',
    'leadType',
    'serviceInterest',
    'wealthManagerName',
    'assignedEmployee',
    'city',
    'state',
    'company',
    'createdAt',
  ]

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const rows = leads.map((lead) =>
    [
      lead.id,
      lead.name,
      lead.phone,
      lead.email,
      lead.source,
      lead.status,
      lead.leadType,
      lead.serviceInterest,
      lead.wealthManagerName,
      lead.assignedEmployee,
      lead.city,
      lead.state,
      lead.company,
      lead.createdAt,
    ]
      .map((value) => escape(String(value ?? '')))
      .join(','),
  )

  return [headers.join(','), ...rows].join('\n')
}

export function deriveServices(
  leads: Lead[],
  quotations: Quotation[] = [],
): Service[] {
  const serviceMap = new Map<string, Service>()

  quotations.forEach((quotation) => {
    quotation.items.forEach((item, index) => {
      if (!serviceMap.has(item.serviceId)) {
        serviceMap.set(item.serviceId, {
          id: item.serviceId,
          category: categorizeService(item.serviceName),
          name: item.serviceName,
          description: `${item.serviceName} imported from live quotation history`,
          basePrice: item.unitPrice,
          taxRate: quotation.taxRate,
          estimatedTAT: 'As per quotation',
          documentChecklist: [],
          isActive: true,
          createdAt: quotation.createdAt,
        })
      } else if (index === 0) {
        const existing = serviceMap.get(item.serviceId)
        if (existing) {
          serviceMap.set(item.serviceId, {
            ...existing,
            basePrice: existing.basePrice || item.unitPrice,
          })
        }
      }
    })
  })

  leads.forEach((lead, index) => {
    const key = `derived-${lead.serviceInterest.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    if (!serviceMap.has(key)) {
      serviceMap.set(key, {
        id: key,
        category: categorizeService(lead.serviceInterest),
        name: lead.serviceInterest,
        description: `${lead.serviceInterest} derived from live lead interest data`,
        basePrice: 0,
        taxRate: 18,
        estimatedTAT: 'To be configured',
        documentChecklist: [],
        isActive: true,
        createdAt: lead.createdAt || new Date(Date.now() + index).toISOString(),
      })
    }
  })

  return Array.from(serviceMap.values())
}

function categorizeService(name: string): Service['category'] {
  const value = name.toLowerCase()
  if (value.includes('trust')) {
    return 'Trusts'
  }
  if (value.includes('succession')) {
    return 'Succession Certificate'
  }
  return 'Wills'
}

export function deriveQuotationItemsFromServices(services: Service[]): QuotationItem[] {
  return services.map((service) => ({
    serviceId: service.id,
    serviceName: service.name,
    quantity: 1,
    unitPrice: service.basePrice,
    amount: service.basePrice,
  }))
}
