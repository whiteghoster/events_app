'use client'

import { Add01Icon, Delete01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar01Icon } from '@hugeicons/core-free-icons'
import type { Contractor, ContractorEntry } from '@/lib/types'

interface EventContractorFormProps {
  entries: ContractorEntry[]
  contractors: Contractor[]
  isLoadingContractors?: boolean
  fromDate?: string
  toDate?: string
  onFromDateChange?: (value: string) => void
  onToDateChange?: (value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: string, value: string | number) => void
}

export function EventContractorForm({
  entries,
  contractors,
  isLoadingContractors,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onAdd,
  onRemove,
  onUpdate,
}: EventContractorFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Contractors</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Set work period and add contractor assignments
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="flex items-center gap-1"
        >
          <Icon icon={Add01Icon} size={16} />
          Add Contractor
        </Button>
      </div>

      {/* Universal Contractor Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg border">
        <div className="space-y-2">
          <Label htmlFor="contractorFromDate" className="text-xs flex items-center gap-1">
            <Icon icon={Calendar01Icon} size={12} />
            Work Period From
          </Label>
          <Input
            id="contractorFromDate"
            type="date"
            value={fromDate || ''}
            onChange={(e) => onFromDateChange?.(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contractorToDate" className="text-xs flex items-center gap-1">
            <Icon icon={Calendar01Icon} size={12} />
            Work Period To
          </Label>
          <Input
            id="contractorToDate"
            type="date"
            value={toDate || ''}
            onChange={(e) => onToDateChange?.(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No contractors assigned. Click "Add Contractor" to add one.
        </p>
      )}

      {entries.map((entry, index) => (
        <div
          key={index}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 border rounded-lg bg-muted/30"
        >
          <div className="sm:col-span-5">
            <Label className="text-xs mb-1 block">Contractor</Label>
            <Select
              value={entry.contractorId}
              onValueChange={(value) => onUpdate(index, 'contractorId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingContractors ? "Loading contractors..." : contractors.length === 0 ? "No contractors available" : "Select contractor"}>
                  {entry.contractorId && contractors.find(c => c.id === entry.contractorId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {isLoadingContractors ? (
                  <div className="px-2 py-2 text-sm text-muted-foreground">
                    Loading contractors...
                  </div>
                ) : contractors.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-muted-foreground">
                    No contractors available
                  </div>
                ) : (
                  contractors.map((contractor) => (
                    <SelectItem key={contractor.id} value={contractor.id}>
                      {contractor.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Label className="text-xs mb-1 block">Shift</Label>
            <Select
              value={entry.shift}
              onValueChange={(value) => onUpdate(index, 'shift', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select shift</SelectItem>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="night">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Label className="text-xs mb-1 block">Members</Label>
            <Input
              type="number"
              min={0}
              value={entry.memberQuantity}
              onChange={(e) => onUpdate(index, 'memberQuantity', parseInt(e.target.value) || 0)}
              className="h-10"
            />
          </div>

          <div className="sm:col-span-1 flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
            >
              <Icon icon={Delete01Icon} size={18} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
