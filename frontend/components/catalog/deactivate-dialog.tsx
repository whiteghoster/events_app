'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface DeactivateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  confirmDeactivate: () => void
}

export function DeactivateDialog({
  open,
  onOpenChange,
  confirmDeactivate,
}: DeactivateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Deactivate Product</DialogTitle>
          <DialogDescription>This product may be in live events. Deactivate anyway?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={confirmDeactivate}>Deactivate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
