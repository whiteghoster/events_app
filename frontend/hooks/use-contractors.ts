'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ContractorsApi } from '@/lib/api'
import type { Contractor, ContractorFormData } from '@/lib/types'
import { toast } from 'sonner'

export function useContractors() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null)

  // Form state
  const [formData, setFormData] = useState<ContractorFormData>({
    name: '',
    isActive: true,
  })

  // Fetch Contractors
  const { data: Contractors = [], isLoading } = useQuery({
    queryKey: ['Contractors'],
    queryFn: () => ContractorsApi.getAll(),
  })

  // Debug logging
  console.log('[useContractors] Contractors data:', Contractors)
  console.log('[useContractors] isLoading:', isLoading)

  // Create mutation
  const createMutation = useMutation({
    mutationFn: ContractorsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Contractors'] })
      toast.success('Contractor added successfully')
      closeDialog()
    },
    onError: () => {
      toast.error('Failed to add Contractor')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContractorFormData> }) => {
      console.log('[Contractor] Updating:', { id, data })
      return ContractorsApi.update(id, data)
    },
    onSuccess: (data) => {
      console.log('[Contractor] Update success:', data)
      queryClient.invalidateQueries({ queryKey: ['Contractors'] })
      toast.success('Contractor updated successfully')
      closeDialog()
    },
    onError: (error) => {
      console.error('[Contractor] Update error:', error)
      toast.error('Failed to update Contractor')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ContractorsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Contractors'] })
      toast.success('Contractor deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete Contractor')
    },
  })

  const openDialog = (Contractor?: Contractor) => {
    if (Contractor) {
      setEditingContractor(Contractor)
      setFormData({
        name: Contractor.name,
        isActive: Contractor.isActive,
      })
    } else {
      setEditingContractor(null)
      setFormData({ name: '', isActive: true })
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingContractor(null)
    setFormData({ name: '', isActive: true })
  }

  const saveContractor = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    if (editingContractor) {
      updateMutation.mutate({ id: editingContractor.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const deleteContractor = async (id: string) => {
    deleteMutation.mutate(id)
  }

  const toggleActive = async (Contractor: Contractor) => {
    updateMutation.mutate({
      id: Contractor.id,
      data: { isActive: !Contractor.isActive },
    })
  }

  return {
    Contractors,
    isLoading,
    dialogOpen,
    setDialogOpen,
    editingContractor,
    formData,
    setFormData,
    openDialog,
    closeDialog,
    saveContractor,
    deleteContractor,
    toggleActive,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
