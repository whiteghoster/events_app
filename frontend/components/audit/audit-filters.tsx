'use client'

import { Icon } from '@/components/icon'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AuditAction, AuditFiltersProps } from '@/lib/types'

const entityTypes = ['All', 'Event', 'Product', 'Category', 'Event Product', 'User']
const actions: (AuditAction | 'All')[] = ['All', 'create', 'update', 'delete']
const userRoles = ['All', 'admin', 'manager', 'karigar'] as const

const actionLabel: Record<AuditAction, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
}

export function AuditFilters({
  roleFilter,
  setRoleFilter,
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
    <>
      {/* Role Filter */}
      <Tabs value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }} className="mb-4">
        <TabsList>
          {userRoles.map(role => (
            <TabsTrigger key={role} value={role} className="capitalize">
              {role === 'All' ? 'All Roles' : role}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-end gap-3">
          <div className="space-y-1 w-full sm:w-auto">
            <Label className="text-xs">Entity</Label>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="min-w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {entityTypes.map(e => <SelectItem key={e} value={e}>{e === 'All' ? 'All Entities' : e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 w-full sm:w-auto">
            <Label className="text-xs">Action</Label>
            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as AuditAction | 'All')}>
              <SelectTrigger className="min-w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {actions.map(a => <SelectItem key={a} value={a}>{a === 'All' ? 'All Actions' : actionLabel[a as AuditAction]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 w-full sm:w-auto">
            <Label className="text-xs">From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full sm:w-[150px]" />
          </div>
          <div className="space-y-1 w-full sm:w-auto">
            <Label className="text-xs">To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full sm:w-[150px]" />
          </div>
        </div>
      </Card>
    </>
  )
}
