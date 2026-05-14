'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface CloseEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  closeStatus: 'hold' | 'finished'
  setCloseStatus: (status: 'hold' | 'finished') => void
  onConfirm: () => void
}

export function CloseEventDialog({
  open,
  onOpenChange,
  clientName,
  closeStatus,
  setCloseStatus,
  onConfirm,
}: CloseEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Close Event</DialogTitle>
          <DialogDescription>Choose a closing status for &quot;{clientName}&quot;.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={closeStatus} onValueChange={(v) => setCloseStatus(v as 'hold' | 'finished')} className="space-y-3 py-4">
          <div className="flex items-center space-x-3 p-3 rounded-md border">
            <RadioGroupItem value="hold" id="hold" />
            <Label htmlFor="hold" className="flex-1 cursor-pointer">
              <p className="font-medium">Hold</p>
              <p className="text-sm text-muted-foreground">Admin can still edit</p>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-md border">
            <RadioGroupItem value="finished" id="finished" />
            <Label htmlFor="finished" className="flex-1 cursor-pointer">
              <p className="font-medium">Finished</p>
              <p className="text-sm text-muted-foreground">Permanently read-only</p>
            </Label>
          </div>
        </RadioGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
