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
      if (e.shift === 'none') return `${label}: select a shift`
      if (!e.memberQuantity || e.memberQuantity <= 0) return `${label}: quantity must be greater than 0`
      if (!e.workDate) return `${label}: set a work date`
      if (worksFrom && e.workDate < worksFrom) return `${label}: work date is before Works From`
      if (worksTo && e.workDate > worksTo) return `${label}: work date is after Works To`
      const uniqueKey = `${e.contractorId}::${e.workDate}`
      if (seen.has(uniqueKey)) return `${label}: contractor already added for this date`
      seen.add(uniqueKey)
    }
    return null
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      eventsApi.syncEventContractors(
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
      ),
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
