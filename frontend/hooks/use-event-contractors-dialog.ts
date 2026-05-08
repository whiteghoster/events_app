'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ContractorsApi, eventsApi } from '@/lib/api'
import type { ContractorEntry, EventContractor } from '@/lib/types'

interface UseEventContractorsDialogArgs {
  eventId: string
  open: boolean
  defaultFromDate?: string
  defaultToDate?: string
  existing: EventContractor[]
  onClose: () => void
}

function toEntry(c: EventContractor): ContractorEntry {
  return {
    id: c.id,
    contractorId: c.contractorId,
    shift: c.shift ?? 'none',
    memberQuantity: c.memberQuantity || 1,
    workDate: c.workDate,
  }
}

function deriveRange(existing: EventContractor[], fallbackFrom?: string, fallbackTo?: string) {
  // Use fallback dates (from event delivery dates or saved universal work dates)
  if (fallbackFrom || fallbackTo) {
    return {
      from: fallbackFrom || '',
      to: fallbackTo || '',
    }
  }

  // Only use existing contractor dates if no fallback dates are provided
  const dates = existing
    .map(c => c.workDate)
    .filter((d): d is string => Boolean(d))
    .sort()

  return {
    from: dates[0] || '',
    to: dates[dates.length - 1] || '',
  }
}

export function useEventContractorsDialog({
  eventId,
  open,
  defaultFromDate,
  defaultToDate,
  existing,
  onClose,
}: UseEventContractorsDialogArgs) {
  const queryClient = useQueryClient()

  const [worksFrom, setWorksFrom] = useState('')
  const [worksTo, setWorksTo] = useState('')
  const [entries, setEntries] = useState<ContractorEntry[]>([])

  const { data: contractors = [], isLoading: contractorsLoading } = useQuery({
    queryKey: ['contractors', 'active'],
    queryFn: () => ContractorsApi.getAll(),
    enabled: open,
    select: (rows) => rows.filter(r => r.isActive),
  })

  useEffect(() => {
    if (!open) return
    const range = deriveRange(existing, defaultFromDate, defaultToDate)
    setWorksFrom(range.from)
    setWorksTo(range.to)
    setEntries(existing.length > 0 ? existing.map(toEntry) : [])
    // Initialize once when the dialog opens; user edits should not be overwritten by background refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const addEntry = () => {
    // Prefer worksFrom, but if it's empty, use worksTo
    const defaultDate = worksFrom || worksTo || '';
    setEntries(prev => [
      ...prev,
      {
        contractorId: '',
        shift: 'none',
        memberQuantity: 1,
        workDate: defaultDate,
      },
    ])
  }

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, patch: Partial<ContractorEntry>) => {
    setEntries(prev => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  const validate = (): string | null => {
    if (worksFrom && worksTo && worksFrom > worksTo) {
      return 'Works To must be on or after Works From'
    }
    if (entries.length === 0) {
      return 'Add at least one contractor'
    }
    const seen = new Set<string>()
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]
      const label = `Row ${i + 1}`
      if (!e.contractorId) return `${label}: select a contractor`

      // Check for duplicate contractor with same work date
      const contractorKey =
        `${e.contractorId}-${e.shift}-${e.workDate || ''}`

      if (seen.has(contractorKey)) {
        return `${label}: contractor already assigned for this shift and date`
      }

      seen.add(contractorKey)
      if (e.shift === 'none') return `${label}: select a shift`
      if (!e.memberQuantity || e.memberQuantity <= 0) return `${label}: quantity must be greater than 0`
      if (!e.workDate) return `${label}: set a work date`
      if (worksFrom && e.workDate < worksFrom) return `${label}: work date is before Works From`
      if (worksTo && e.workDate > worksTo) return `${label}: work date is after Works To`
    }
    return null
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      try {
        // First try to use sync endpoint
        return await eventsApi.syncEventContractors(
          eventId,
          entries.map(e => ({
            contractorId: e.contractorId!,
            shift: e.shift === 'none' ? undefined : e.shift,
            memberQuantity: e.memberQuantity,
            workDate: e.workDate,
          })),
          {
            workFrom: worksFrom || undefined,
            workTo: worksTo || undefined,
          },
        )
      } catch (error: any) {
        console.log('Sync error:', error)
        // If sync fails due to conflict, fall back to individual operations
        const errorMessage = error.message || error.response?.data?.message || error.toString()
        if (errorMessage.includes('ON CONFLICT') || errorMessage.includes('duplicate')) {
          toast.info('Processing contractors individually due to date conflicts...')

          // Get existing contractors for this event
          const existingContractors = await eventsApi.getEventContractors(eventId)

          // Process each entry individually
          for (const entry of entries) {
            if (entry.contractorId) {
              try {
                // Try to add/update this contractor
                console.log('Adding contractor:', entry)
                console.log('Event ID for API call:', eventId)
                let addResult: any = null
                try {
                  const payload = {
                    contractorId: entry.contractorId,
                    shift: entry.shift === 'none' ? undefined : entry.shift,
                    memberQuantity: entry.memberQuantity,
                    workDate: entry.workDate,
                  }
                  console.log('Payload being sent:', payload)
                  addResult = await eventsApi.addEventContractor(eventId, payload)
                  console.log('Add result:', addResult)
                } catch (addError) {
                  console.log('Add operation error:', addError)
                  throw addError
                }
                // Update local state with the result
                if (addResult) {
                  setEntries(prev => {
                    const existingIndex = prev.findIndex(e => e.contractorId === entry.contractorId && e.workDate === entry.workDate && e.shift === entry.shift
                    )
                    return existingIndex >= 0
                      ? prev.map((e, i) => i === existingIndex ? addResult : e)
                      : [...prev, addResult]
                  })
                } else {
                  console.log('Add operation returned no result')
                }
              } catch (addError: any) {
                console.log('Add failed:', addError.message)
                // If add fails, it might be a duplicate - try update
                if (addError.message?.includes('duplicate') || addError.message?.includes('conflict')) {
                  const existing = existingContractors.find(c => c.contractorId === entry.contractorId && c.workDate === entry.workDate && c.shift === entry.shift
                  )
                  if (existing) {
                    console.log('Updating existing contractor:', existing)
                    const updateResult = await eventsApi.updateEventContractor(
                      eventId,
                      existing.id,
                      {
                        shift: entry.shift === 'none' ? undefined : entry.shift,
                        memberQuantity: entry.memberQuantity,
                      })
                    console.log('Update result:', updateResult)
                    // Update local state with the update result
                    if (updateResult) {
                      setEntries(prev => {
                        const existingIndex = prev.findIndex(e =>
                          e.contractorId === entry.contractorId &&
                          e.workDate === entry.workDate &&
                          e.shift === entry.shift
                        )
                        if (existingIndex >= 0) {
                          const updated = [...prev]
                          updated[existingIndex] = { ...prev[existingIndex], ...updateResult }
                          return updated
                        }
                        return prev
                      })
                    } else {
                      console.log('Update operation returned no result')
                    }
                  } else {
                    console.log('No existing contractor found for update')
                  }
                } else {
                  console.log('Add failed with unexpected error:', addError)
                }
              }
            }
          }

          console.log('Individual operations completed, returning empty array')
          return []
        }

        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventContractors', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      toast.success('Contractors saved')
      onClose()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to save contractors')
    },
  })

  const submit = () => {
    const error = validate()
    if (error) {
      toast.error(error)
      return
    }
    saveMutation.mutate()
  }

  return {
    contractors,
    contractorsLoading,
    worksFrom,
    setWorksFrom,
    worksTo,
    setWorksTo,
    entries,
    addEntry,
    removeEntry,
    updateEntry,
    submit,
    isSaving: saveMutation.isPending,
  }
}
