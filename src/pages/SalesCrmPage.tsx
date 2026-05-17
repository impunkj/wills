import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from '@/components/ui/toaster'
import { LeadDetail, LeadForm, LeadsList, QuotationBuilder, ServicesCatalog } from '@/features/sales-crm/components'
import type {
  FollowUp,
  FollowUpInput,
  Lead,
  Quotation,
  QuotationItem,
  Service,
  StatusCounts,
  WealthManager,
} from '@/features/sales-crm/types'
import {
  addFollowUp,
  assignToAccount,
  bulkExport,
  bulkImport,
  createLead,
  createQuotation,
  deleteLead,
  deriveServices,
  getLead,
  getLeads,
  serializeLeadsToCsv,
  sendQuotation,
  type CreateLeadDto,
  type CreateQuotationDto,
  updateLead,
} from '@/services/sales-crm.service'
import {
  getEmployees as getTeamEmployees,
  getWealthManagers as getTeamWealthManagers,
  type TeamUserOption,
} from '@/services/team.service'

const EMPTY_STATUS_COUNTS: StatusCounts = {
  all: 0,
  new: 0,
  assigned: 0,
  'follow-up': 0,
  'quotation-sent': 0,
  projected: 0,
  'invoice-sent': 0,
  won: 0,
  lost: 0,
}

type PageMode = 'list' | 'new' | 'detail' | 'quotation' | 'services'

type DraftSaveState = {
  leadId: string
  signature: string
  promise: Promise<Quotation>
}

export function SalesCrmPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const [leads, setLeads] = useState<Lead[]>([])
  const [statusCounts, setStatusCounts] = useState<StatusCounts>(EMPTY_STATUS_COUNTS)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [wealthManagers, setWealthManagers] = useState<WealthManager[]>([])
  const [employees, setEmployees] = useState<TeamUserOption[]>([])
  const draftSaveRef = useRef<DraftSaveState | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const selectedLeadId = searchParams.get('leadId')
  const view = searchParams.get('view')
  const action = searchParams.get('action')
  const pathname = location.pathname

  const mode: PageMode = useMemo(() => {
    if (pathname.endsWith('/new')) {
      return 'new'
    }
    if (view === 'services') {
      return 'services'
    }
    if (action === 'create-quotation' && selectedLeadId) {
      return 'quotation'
    }
    if (selectedLeadId) {
      return 'detail'
    }
    return 'list'
  }, [action, pathname, selectedLeadId, view])

  useEffect(() => {
    let active = true

    async function loadList() {
      setIsLoading(true)
      try {
        const data = await getLeads()
        if (!active) {
          return
        }
        setLeads(data.leads)
        setStatusCounts(data.statusCounts)
      } catch (error) {
        if (!active) {
          return
        }
        toast.error('Unable to load Sales CRM leads', getErrorMessage(error))
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadList()

    return () => {
      active = false
    }
  }, [refreshKey])

  useEffect(() => {
    let active = true

    async function loadDropdowns() {
      try {
        const [wmRows, employeeRows] = await Promise.all([
          getTeamWealthManagers(),
          getTeamEmployees(),
        ])
        if (!active) {
          return
        }
        setWealthManagers(
          wmRows.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: '',
            company: 'Wills24',
            totalSales: 0,
            isActive: true,
          })),
        )
        setEmployees(employeeRows)
      } catch (error) {
        if (!active) {
          return
        }
        toast.error('Unable to load team options', getErrorMessage(error))
      }
    }

    void loadDropdowns()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedLeadId) {
      setSelectedLead(null)
      setFollowUps([])
      setQuotations([])
      return
    }

    const leadId = selectedLeadId

    let active = true

    async function loadDetail() {
      setIsDetailLoading(true)
      try {
        const data = await getLead(leadId)
        if (!active) {
          return
        }
        setSelectedLead(data.lead)
        setFollowUps(data.followUps)
        setQuotations(data.quotations)
      } catch (error) {
        if (!active) {
          return
        }
        toast.error('Unable to load lead details', getErrorMessage(error))
      } finally {
        if (active) {
          setIsDetailLoading(false)
        }
      }
    }

    void loadDetail()

    return () => {
      active = false
    }
  }, [selectedLeadId, refreshKey])

  useEffect(() => {
    if (action === 'new-lead') {
      navigate('/sales-crm/new', { replace: true })
      return
    }

    if (action === 'create-quotation' && !selectedLeadId) {
      toast.info('Select a lead first', 'Open a lead and create the quotation from its detail view.')
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('action')
      setSearchParams(nextParams, { replace: true })
    }
  }, [action, navigate, searchParams, selectedLeadId, setSearchParams])

  const services = useMemo(
    () => deriveServices(leads, quotations),
    [leads, quotations],
  )

  function goToList() {
    navigate('/sales-crm')
  }

  function openLead(id: string) {
    navigate(`/sales-crm?leadId=${encodeURIComponent(id)}`)
  }

  function openQuotationBuilder(leadId: string) {
    navigate(`/sales-crm?leadId=${encodeURIComponent(leadId)}&action=create-quotation`)
  }

  function openServices() {
    navigate('/sales-crm?view=services')
  }

  async function refreshListAndDetail(leadId?: string) {
    setRefreshKey((value) => value + 1)
    if (leadId) {
      navigate(`/sales-crm?leadId=${encodeURIComponent(leadId)}`)
    }
  }

  async function handleCreateLead(payload: Partial<Lead>) {
    const wealthManager = wealthManagers.find((manager) => manager.id === payload.wealthManagerId)
    if (!wealthManager) {
      toast.error('Wealth Manager required', 'Choose an available Wealth Manager before creating the lead.')
      return
    }

    try {
      const created = await createLead(mapLeadFormPayload(payload, wealthManager))
      toast.success('Lead created', `${created.name} has been added to Sales CRM.`)
      await refreshListAndDetail(created.id)
    } catch (error) {
      toast.error('Unable to create lead', getErrorMessage(error))
    }
  }

  async function handleUpdateLead(id: string, payload?: Partial<Lead>) {
    if (!payload) {
      return
    }

    try {
      const wealthManager =
        payload.wealthManagerId
          ? wealthManagers.find((manager) => manager.id === payload.wealthManagerId)
          : undefined
      const updated = await updateLead(id, mapLeadUpdatePayload(payload, wealthManager))
      toast.success('Lead updated', `${updated.name} has been synced with Sales CRM.`)
      await refreshListAndDetail(id)
    } catch (error) {
      toast.error('Unable to update lead', getErrorMessage(error))
    }
  }

  async function handleDeleteLead(id: string) {
    try {
      const deleted = await deleteLead(id)
      toast.success('Lead deleted', `${deleted.name} has been removed from the active pipeline.`)
      if (selectedLeadId === id) {
        goToList()
      }
      await refreshListAndDetail()
    } catch (error) {
      toast.error('Unable to delete lead', getErrorMessage(error))
    }
  }

  async function handleAddFollowUp(leadId: string, payload?: FollowUpInput) {
    if (!payload) {
      return
    }

    try {
      await addFollowUp(leadId, payload)
      toast.success('Follow-up added', 'The latest follow-up has been saved.')
      await refreshListAndDetail(leadId)
    } catch (error) {
      toast.error('Unable to save follow-up', getErrorMessage(error))
    }
  }

  async function handleAssignToAccount(leadId: string) {
    try {
      const result = await assignToAccount(leadId)
      toast.success('Lead assigned to Accounts', `Customer ${result.accountEntry.customerId} and case ${result.accountEntry.caseId} were linked.`)
      await refreshListAndDetail(leadId)
    } catch (error) {
      toast.error('Unable to assign lead to Accounts', getErrorMessage(error))
    }
  }

  async function handleImportLeads() {
    importInputRef.current?.click()
  }

  async function handleImportFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const result = await bulkImport(file)
      toast.success('Leads imported', `${result.importedCount} leads were imported.`)
      await refreshListAndDetail()
    } catch (error) {
      toast.error('Unable to import leads', getErrorMessage(error))
    } finally {
      event.target.value = ''
    }
  }

  async function handleExportLeads() {
    try {
      const result = await bulkExport({ format: 'csv' })
      downloadCsvFile('sales-crm-export.csv', serializeLeadsToCsv(result.leads))
      toast.success('Leads exported', `${result.exportedCount} leads were exported.`)
    } catch (error) {
      toast.error('Unable to export leads', getErrorMessage(error))
    }
  }

  function ensureDraftSave(
    leadId: string,
    payload: CreateQuotationDto,
  ): Promise<Quotation> {
    const signature = JSON.stringify(payload)
    const cached = draftSaveRef.current

    if (cached && cached.leadId === leadId && cached.signature === signature) {
      return cached.promise
    }

    const promise = createQuotation(leadId, payload)
    draftSaveRef.current = { leadId, signature, promise }
    return promise
  }

  async function handleQuotationSave(leadId: string, items: QuotationItem[], taxRate: number) {
    const payload: CreateQuotationDto = {
      items: items.map((item) => ({
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      taxRateOverride: taxRate,
      generatedBy: 'Wills24 Admin',
    }

    try {
      const quotation = await ensureDraftSave(leadId, payload)
      toast.success('Quotation saved', `${quotation.referenceNumber} is ready.`)
      await refreshListAndDetail(leadId)
    } catch (error) {
      toast.error('Unable to save quotation', getErrorMessage(error))
    }
  }

  async function handleQuotationSend(channel: 'email' | 'whatsapp') {
    if (!selectedLeadId || !draftSaveRef.current || draftSaveRef.current.leadId !== selectedLeadId) {
      toast.error('Save the quotation first', 'Add at least one service before sending.')
      return
    }

    try {
      const draft = await draftSaveRef.current.promise
      const sent = await sendQuotation(draft.id, channel)
      toast.success('Quotation sent', `${sent.referenceNumber} was sent via ${channel}.`)
      await refreshListAndDetail(selectedLeadId)
      navigate(`/sales-crm?leadId=${encodeURIComponent(selectedLeadId)}`)
    } catch (error) {
      toast.error('Unable to send quotation', getErrorMessage(error))
    }
  }

  async function handleSendExistingQuotation(quotationId: string, channel: 'email' | 'whatsapp') {
    try {
      const sent = await sendQuotation(quotationId, channel)
      toast.success('Quotation sent', `${sent.referenceNumber} was sent via ${channel}.`)
      await refreshListAndDetail(sent.leadId)
    } catch (error) {
      toast.error('Unable to send quotation', getErrorMessage(error))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-96 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900" />
      </div>
    )
  }

  if (mode === 'new') {
    return (
      <>
        <input
          ref={importInputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={handleImportFileChange}
        />
        <LeadForm
          wealthManagers={wealthManagers}
          employees={employees.map((employee) => employee.name)}
          onSave={(data) => {
            void handleCreateLead(data)
          }}
          onCancel={goToList}
        />
      </>
    )
  }

  if (mode === 'services') {
    return (
      <>
        <input
          ref={importInputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={handleImportFileChange}
        />
        <ServicesCatalog
          services={services}
          onCreate={() => {
            toast.info('Service creation is backend-gated', 'Read endpoints for the service catalog are not available yet.')
          }}
          onEdit={() => {
            toast.info('Service editing is backend-gated', 'The current backend exposes write endpoints, but not a catalog read endpoint yet.')
          }}
          onToggle={() => {
            toast.info('Service toggling is backend-gated', 'A service catalog read endpoint is needed before toggles can be kept in sync.')
          }}
        />
      </>
    )
  }

  if ((mode === 'detail' || mode === 'quotation') && selectedLeadId && (isDetailLoading || !selectedLead)) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-96 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900" />
      </div>
    )
  }

  if (mode === 'quotation' && selectedLead) {
    return (
      <>
        <input
          ref={importInputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={handleImportFileChange}
        />
        <QuotationBuilder
          lead={selectedLead}
          services={services}
          onSave={(data) => {
            void handleQuotationSave(selectedLead.id, data.items, data.taxRate)
          }}
          onSendEmail={() => {
            void handleQuotationSend('email')
          }}
          onSendWhatsApp={() => {
            void handleQuotationSend('whatsapp')
          }}
          onBack={() => navigate(`/sales-crm?leadId=${encodeURIComponent(selectedLead.id)}`)}
        />
      </>
    )
  }

  if (mode === 'detail' && selectedLead) {
    return (
      <>
        <input
          ref={importInputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={handleImportFileChange}
        />
        <LeadDetail
          lead={selectedLead}
          followUps={followUps}
          quotations={quotations}
          onBack={goToList}
          onEditLead={(id, payload) => {
            void handleUpdateLead(id, payload)
          }}
          onAddFollowUp={(leadId, payload) => {
            void handleAddFollowUp(leadId, payload)
          }}
          onCreateQuotation={openQuotationBuilder}
          onSendQuotation={(quotationId, channel) => {
            void handleSendExistingQuotation(quotationId, channel)
          }}
          onAssignToAccounts={(leadId) => {
            void handleAssignToAccount(leadId)
          }}
        />
      </>
    )
  }

  return (
    <>
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,.json"
        className="hidden"
        onChange={handleImportFileChange}
      />
      <LeadsList
        leads={leads}
        followUps={followUps}
        quotations={quotations}
        services={services}
        wealthManagers={wealthManagers}
        statusCounts={statusCounts}
        onViewLead={openLead}
        onEditLead={(id, payload) => {
          void handleUpdateLead(id, payload)
        }}
        onDeleteLead={(id) => {
          void handleDeleteLead(id)
        }}
        onCreateLead={() => navigate('/sales-crm/new')}
        onImportLeads={() => {
          void handleImportLeads()
        }}
        onExportLeads={() => {
          void handleExportLeads()
        }}
        onAddFollowUp={(leadId, payload) => {
          void handleAddFollowUp(leadId, payload)
        }}
        onAssignToAccounts={(leadId) => {
          void handleAssignToAccount(leadId)
        }}
        onCreateQuotation={openQuotationBuilder}
        onSendQuotation={(quotationId, channel) => {
          void handleSendExistingQuotation(quotationId, channel)
        }}
        onCreateService={openServices}
      />
    </>
  )
}

function mapLeadFormPayload(payload: Partial<Lead>, wealthManager: WealthManager): CreateLeadDto {
  return {
    source: payload.source ?? 'Website',
    name: payload.name ?? '',
    phone: payload.phone ?? '',
    email: payload.email ?? '',
    address: payload.address ?? 'NA',
    city: payload.city ?? 'Delhi',
    state: payload.state ?? 'Delhi',
    pinCode: payload.pinCode ?? '110001',
    company: payload.company ?? '',
    designation: payload.designation ?? '',
    serviceInterest: payload.serviceInterest ?? 'Will Drafting',
    wealthManagerId: wealthManager.id,
    wealthManagerName: wealthManager.name,
    assignedEmployee: payload.assignedEmployee ?? 'Wills24 Admin',
    leadType: payload.leadType ?? 'Individual',
    status: payload.status ?? 'new',
    notes: payload.notes ?? '',
    taxContext: payload.state
      ? { sellerState: 'Delhi', customerState: payload.state }
      : undefined,
  }
}

function mapLeadUpdatePayload(payload: Partial<Lead>, wealthManager?: WealthManager) {
  return {
    ...(payload.source ? { source: payload.source } : {}),
    ...(payload.name ? { name: payload.name } : {}),
    ...(payload.phone ? { phone: payload.phone } : {}),
    ...(payload.email ? { email: payload.email } : {}),
    ...(payload.address ? { address: payload.address } : {}),
    ...(payload.city ? { city: payload.city } : {}),
    ...(payload.state ? { state: payload.state } : {}),
    ...(payload.pinCode ? { pinCode: payload.pinCode } : {}),
    ...(payload.company !== undefined ? { company: payload.company } : {}),
    ...(payload.designation !== undefined ? { designation: payload.designation } : {}),
    ...(payload.serviceInterest ? { serviceInterest: payload.serviceInterest } : {}),
    ...(payload.assignedEmployee ? { assignedEmployee: payload.assignedEmployee } : {}),
    ...(payload.leadType ? { leadType: payload.leadType } : {}),
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
    ...(wealthManager
      ? {
          wealthManager: {
            wealthManagerId: wealthManager.id,
            wealthManagerName: wealthManager.name,
          },
        }
      : {}),
    ...(payload.state
      ? {
          taxContext: {
            sellerState: 'Delhi',
            customerState: payload.state,
          },
        }
      : {}),
  }
}

function downloadCsvFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    const responseData = error.response.data
    if (typeof responseData === 'string') {
      return responseData
    }
    if (
      responseData &&
      typeof responseData === 'object' &&
      'message' in responseData &&
      typeof responseData.message === 'string'
    ) {
      return responseData.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}
