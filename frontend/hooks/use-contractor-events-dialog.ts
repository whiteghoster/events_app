'use client'

import { useQuery } from '@tanstack/react-query'
import { ContractorsApi } from '@/lib/api'
import type { ContractorEventAssignment } from '@/lib/types'

interface UseContractorEventsDialogArgs {
  contractorId: string | null
  open: boolean
}

export function useContractorEventsDialog({ contractorId, open }: UseContractorEventsDialogArgs): {
  assignments: ContractorEventAssignment[]
  isLoading: boolean
  error: Error | null
} {
  const { data: assignments = [], isLoading, error } = useQuery({
    queryKey: ['contractorEvents', contractorId],
    queryFn: () => ContractorsApi.getContractorEvents(contractorId!),
    enabled: open && !!contractorId,
  })

  return {
    assignments,
    isLoading,
    error: error as Error | null,
  }
}
