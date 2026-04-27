'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AuditAction, AuditFiltersProps } from '@/lib/types'

const entityTypes = ['All', 'Event', 'Event Product']
const actions: (AuditAction | 'All')[] = ['All', 'create', 'update', 'delete']

const actionLabel: Record<AuditAction, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
}

export function AuditFilters({
  entityFilter,
  setEntityFilter,
  actionFilter,
  setActionFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  setPage,
}: AuditFiltersProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-end gap-3">
        <div className="space-y-1 w-full sm:w-auto">
          <Label className="text-xs">Entity</Label>
          <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1) }}>
            <SelectTrigger className="min-w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {entityTypes.map(e => <SelectItem key={e} value={e}>{e === 'All' ? 'All Entities' : e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 w-full sm:w-auto">
          <Label className="text-xs">Action</Label>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v as AuditAction | 'All'); setPage(1) }}>
            <SelectTrigger className="min-w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {actions.map(a => <SelectItem key={a} value={a}>{a === 'All' ? 'All Actions' : actionLabel[a as AuditAction]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 w-full sm:w-auto">
          <Label className="text-xs">From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="w-full sm:w-[150px]" />
        </div>
        <div className="space-y-1 w-full sm:w-auto">
          <Label className="text-xs">To</Label>
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="w-full sm:w-[150px]" />
        </div>
      </div>
    </Card>
  )
}
