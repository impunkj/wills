import { useState } from 'react'
import { TeamManagement } from '../../team-management/components/TeamManagement'
import type { TeamManagementProps } from '../types'
import { LawyerDetailPage } from './LawyerDetailPage'

interface AssignedCase {
  id: string
  customerName: string
  serviceType: string
  serviceName: string
  status: string
  priority: string
  lastUpdated: string
  description: string
  assignedLawyer?: string
  lawyerId?: string
}

interface LawyersDirectoryProps extends TeamManagementProps {
  cases?: AssignedCase[]
  onViewCase?: (id: string) => void
}

export function LawyersDirectory({ cases = [], onViewCase, ...props }: LawyersDirectoryProps) {
  const [selectedLawyerId, setSelectedLawyerId] = useState<string | null>(null)

  const selectedLawyer = selectedLawyerId
    ? props.lawyers.find((l) => l.id === selectedLawyerId) ?? null
    : null

  if (selectedLawyer) {
    return (
      <LawyerDetailPage
        lawyer={selectedLawyer}
        cases={cases}
        onBack={() => setSelectedLawyerId(null)}
        onViewCase={onViewCase}
      />
    )
  }

  return (
    <TeamManagement
      {...props}
      view="lawyers-only"
      onViewLawyer={(id) => {
        setSelectedLawyerId(id)
        props.onViewLawyer?.(id)
      }}
    />
  )
}
