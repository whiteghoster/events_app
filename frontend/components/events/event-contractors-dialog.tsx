'use client'

import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEventContractorsDialog } from '@/hooks/use-event-contractors-dialog'
import type { EventContractor } from '@/lib/types'

interface EventContractorsDialogProps {
  eventId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  existing: EventContractor[]
  defaultFromDate?: string
  defaultToDate?: string
}

export function EventContractorsDialog({
  eventId,
  open,
  onOpenChange,
  existing,
  defaultFromDate,
  defaultToDate,
}: EventContractorsDialogProps) {
  const {
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
    isSaving,
  } = useEventContractorsDialog({
    eventId,
    open,
    defaultFromDate,
    defaultToDate,
    existing,
    onClose: () => onOpenChange(false),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contractors</DialogTitle>
          <DialogDescription>
            Set the work period and assign contractors with their shift, quantity, and dates.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg border">
          <div className="space-y-1.5">
            <Label htmlFor="worksFrom" className="text-xs">Works From</Label>
            <Input
              id="worksFrom"
              type="date"
              value={worksFrom}
              onChange={(e) => setWorksFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="worksTo" className="text-xs">Works To</Label>
            <Input
              id="worksTo"
              type="date"
              value={worksTo}
              min={worksFrom || undefined}
              onChange={(e) => setWorksTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Assignments</p>
          <Button type="button" variant="outline" size="sm" onClick={addEntry}>
            <Plus className="h-4 w-4 mr-1" />
            Add Contractor
          </Button>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">
            No contractors assigned. Click &quot;Add Contractor&quot; to start.
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 border rounded-lg bg-muted/30"
              >
                <div className="sm:col-span-4">
                  <Label className="text-xs mb-1 block">Contractor</Label>
                  <Select
                    value={entry.contractorId || ''}
                    onValueChange={(value) => updateEntry(index, { contractorId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          contractorsLoading
                            ? 'Loading...'
                            : contractors.length === 0
                              ? 'No contractors'
                              : 'Select contractor'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {contractors.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs mb-1 block">Shift</Label>
                  <Select
                    value={entry.shift}
                    onValueChange={(value) =>
                      updateEntry(index, { shift: value as typeof entry.shift })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs mb-1 block">Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    value={entry.memberQuantity}
                    onChange={(e) =>
                      updateEntry(index, { memberQuantity: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="sm:col-span-3">
                  <Label className="text-xs mb-1 block">Work Date</Label>
                  <Input
                    type="date"
                    value={entry.workDate || ''}
                    min={worksFrom || undefined}
                    max={worksTo || undefined}
                    onChange={(e) => updateEntry(index, { workDate: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-1 flex items-end justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeEntry(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
