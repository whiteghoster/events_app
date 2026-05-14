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
  isError: boolean
  error: Error | null
} {
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['contractorEvents', contractorId],
    queryFn: () => ContractorsApi.getContractorEvents(contractorId!),
    enabled: open && !!contractorId,
  })

  return {
    assignments: data || [],
    isLoading,
    isError,
    error: error as Error | null,
  }
}
