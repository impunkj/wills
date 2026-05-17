import { api } from '@/lib/api'

export async function getSalesReport(from: Date, to: Date, comparePrevious = false) {
  const { data } = await api.get('/reports/sales', {
    params: { from: from.toISOString(), to: to.toISOString(), comparePrevious },
  })
  return data
}

export async function getCaseReport(from: Date, to: Date, comparePrevious = false) {
  const { data } = await api.get('/reports/cases', {
    params: { from: from.toISOString(), to: to.toISOString(), comparePrevious },
  })
  return data
}

export async function getTeamReport(from: Date, to: Date, comparePrevious = false) {
  const { data } = await api.get('/reports/team', {
    params: { from: from.toISOString(), to: to.toISOString(), comparePrevious },
  })
  return data
}

export async function exportExcel(
  reportType: 'sales' | 'cases' | 'team',
  from: Date,
  to: Date,
) {
  const { data } = await api.get<ArrayBuffer>('/reports/export/excel', {
    params: { reportType, from: from.toISOString(), to: to.toISOString() },
    responseType: 'arraybuffer',
  })
  downloadBinary(data, `${reportType}-report.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

export async function exportPDF(
  reportType: 'sales' | 'cases' | 'team',
  from: Date,
  to: Date,
) {
  const { data } = await api.get<ArrayBuffer>('/reports/export/pdf', {
    params: { reportType, from: from.toISOString(), to: to.toISOString() },
    responseType: 'arraybuffer',
  })
  downloadBinary(data, `${reportType}-report.pdf`, 'application/pdf')
}

function downloadBinary(data: ArrayBuffer, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
