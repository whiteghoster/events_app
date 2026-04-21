'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import type { Category } from '@/lib/types'

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCategory: Category | null
  newCategoryName: string
  setNewCategoryName: (name: string) => void
  isSaving: boolean
  saveCategory: () => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  editingCategory,
  newCategoryName,
  setNewCategoryName,
  isSaving,
  saveCategory,
}: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogDescription>{editingCategory ? 'Update the name.' : 'Create a new category.'}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label>Category Name *</Label>
          <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g., Gift Hampers" className="mt-2" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={saveCategory} disabled={isSaving}>
            {isSaving && <Skeleton className="h-4 w-4 mr-2 rounded-full" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
