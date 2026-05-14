'use client'

import { Icon } from '@/components/icon'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import type { Contractor, ContractorFormData } from '@/lib/types'

interface ContractorDialogProps {
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  editingContractor: Contractor | null
  formData: ContractorFormData
  setFormData: (data: ContractorFormData) => void
  saveContractor: () => void
  isLoading: boolean
}

export function ContractorDialog({
  dialogOpen,
  setDialogOpen,
  editingContractor,
  formData,
  setFormData,
  saveContractor,
  isLoading,
}: ContractorDialogProps) {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editingContractor ? 'Edit Contractor' : 'Add Contractor'}</DialogTitle>
          <DialogDescription>
            {editingContractor ? 'Update the contractor details' : 'Add a new contractor to the system'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Enter contractor name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Active</Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={saveContractor} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Icon icon={Add01Icon} size={16} className="mr-1.5" />
                {editingContractor ? 'Update' : 'Add'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
