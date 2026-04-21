'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Download, Search, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useAuth, canViewAudit } from '@/lib/auth-context'
import { auditApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { AuditAction, AuditEntry } from '@/lib/types'

const entityTypes = ['All', 'Event', 'Product', 'Category', 'Event Product', 'User']
const actions: (AuditAction | 'All')[] = ['All', 'create', 'update', 'delete']
const userRoles = ['All', 'admin', 'manager', 'karigar'] as const

const actionColors: Record<AuditAction, string> = {
  'create': 'bg-success/20 text-success border-success/30',
  'update': 'bg-warning/20 text-warning border-warning/30',
  'delete': 'bg-destructive/20 text-destructive border-destructive/30',
}

const actionDisplayNames: Record<AuditAction, string> = {
  'create': 'Created',
  'update': 'Updated',
  'delete': 'Deleted',
}

const roleColors: Record<string, string> = {
  'admin': 'bg-primary/20 text-primary border-primary/30',
  'karigar': 'bg-info/20 text-info border-info/30',
  'manager': 'bg-finished/20 text-finished border-finished/30',
}

export default function AuditPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  
  const [page, setPage] = useState(1)
  const perPage = 25

  const [entityFilter, setEntityFilter] = useState('All')
  const [actionFilter, setActionFilter] = useState<AuditAction | 'All'>('All')
  const [roleFilter, setRoleFilter] = useState<string>('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Use React Query for better caching and performance
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit', 'logs', page, perPage, entityFilter, actionFilter, roleFilter, dateFrom, dateTo],
    queryFn: () => auditApi.getAuditLogs({
      entity_type: entityFilter === 'All' ? undefined : entityFilter,
      action: actionFilter === 'All' ? undefined : actionFilter,
      user_role: roleFilter === 'All' ? undefined : roleFilter,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
      limit: perPage,
    }),
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: (previousData) => previousData,
  })

  const logs = auditData?.data || []
  const total = auditData?.pagination?.total || 0
  const totalPages = Math.ceil(total / perPage)

  if (!currentUser || !canViewAudit(currentUser.role)) {
    router.replace('/events')
    return null
  }

  const handleExportCSV = async () => {
    try {
      toast.loading('Preparing comprehensive export...', { id: 'export-loading' })
      
      // Fetch ALL audits without role filter to get comprehensive data
      const res = await auditApi.getAuditLogs({
        page: 1,
        limit: 1000, // Get up to 1000 records for export
      })
      
      // Comprehensive headers with all details
      const headers = [
        'ID',
        'Timestamp',
        'Date',
        'Time',
        'Action',
        'Entity Type',
        'Entity ID',
        'Entity Name',
        'User Name',
        'User Email',
        'User Role',
        'Old Values',
        'New Values',
        'Changes Summary'
      ]
      
      const rows = res.data.map((entry: any) => {
        const timestamp = new Date(entry.timestamp || entry.created_at)
        const oldVals = entry.old_values || {}
        const newVals = entry.new_values || {}
        
        // Generate changes summary
        let changesSummary = ''
        if (entry.action === 'create') {
          changesSummary = `Created new ${entry.entityType}`
        } else if (entry.action === 'delete') {
          changesSummary = `Deleted ${entry.entityType}`
        } else if (entry.action === 'update') {
          const changedKeys = Object.keys(newVals).filter(k => k !== 'updated_at' && oldVals[k] !== newVals[k])
          changesSummary = changedKeys.length > 0 
            ? `Updated: ${changedKeys.join(', ')}` 
            : 'Updated'
        }
        
        return [
          entry.id,
          timestamp.toISOString(),
          timestamp.toLocaleDateString('en-IN'),
          timestamp.toLocaleTimeString('en-IN'),
          entry.action,
          entry.entityType,
          entry.entityId,
          entry.entityName,
          entry.userName,
          entry.userId,
          entry.userRole,
          JSON.stringify(oldVals).replace(/"/g, '""'),
          JSON.stringify(newVals).replace(/"/g, '""'),
          changesSummary
        ]
      })
      
      // Proper CSV formatting with escaping
      const csv = [headers, ...rows]
        .map(row => row.map(cell => {
          const cellStr = String(cell || '')
          // Escape quotes and wrap in quotes if contains special chars
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return `"${cellStr}"`
        }).join(','))
        .join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_logs_complete_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${rows.length} audit records`, { id: 'export-loading' })
    } catch (err) {
      toast.error('Export failed', { id: 'export-loading' })
      console.error('Export error:', err)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        title="Audit Trail"
        action={
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      {/* Role Filter Tabs - Responsive */}
      <div className="mb-4 p-1 skeu-panel rounded-xl overflow-x-auto">
        <div className="flex justify-center sm:justify-center gap-2 min-w-max px-2">
          {userRoles.map((role) => (
            <button
              key={role}
              onClick={() => {
                setRoleFilter(role)
                setPage(1)
              }}
              className={cn(
                'px-3 sm:px-4 py-2 text-sm font-medium transition-all rounded-lg relative capitalize whitespace-nowrap',
                roleFilter === role
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-secondary hover:to-secondary/50'
              )}
            >
              {role === 'All' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Filters - Responsive */}
      <div className="skeu-panel bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="skeu-card min-w-[140px] w-full sm:w-auto">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent className="skeu-card">
              {entityTypes.map(e => (
                <SelectItem key={e} value={e}>{e === 'All' ? 'All Entities' : e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as AuditAction | 'All')}>
            <SelectTrigger className="skeu-card min-w-[120px] w-full sm:w-auto">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent className="skeu-card">
              {actions.map(a => (
                <SelectItem key={a} value={a}>{a === 'All' ? 'All Actions' : actionDisplayNames[a as AuditAction] || a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-xs text-muted-foreground">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="skeu-card text-xs sm:text-sm w-full sm:w-[150px]"
              />
            </div>
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-xs text-muted-foreground">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="skeu-card text-xs sm:text-sm w-full sm:w-[150px]"
              />
            </div>
          </div>
          <Button variant="outline" size="icon" className="skeu-card h-10 w-10 shrink-0 mt-4 sm:mt-0" onClick={() => setPage(1)}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Log Table */}
      <div className="skeu-card bg-card rounded-xl border border-border overflow-hidden">
        {/* Mobile Card View */}
        <div className="lg:hidden">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p>Loading activities...</p>
            </div>
          ) : logs.map(entry => (
            <div key={entry.id} className="p-4 border-b border-border last:border-b-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge variant="outline" className={cn('text-xs', actionColors[entry.action])}>
                  {actionDisplayNames[entry.action] || entry.action}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(entry.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{entry.userName}</span>
                  <Badge variant="outline" className={cn('text-[10px] px-1.5 h-5 uppercase', roleColors[entry.userRole] || 'bg-secondary/50')}>
                    {entry.userRole?.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{entry.entityType}</div>
                {entry.entityName && <div className="font-medium">{entry.entityName}</div>}
                <div className="text-muted-foreground text-sm whitespace-pre-wrap break-words">{entry.change}</div>
              </div>
            </div>
          ))}
          {!isLoading && logs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
                <p className="text-sm font-medium">
                  {roleFilter !== 'All' 
                    ? `No ${roleFilter} audits yet` 
                    : (total === 0 ? 'No audits yet' : 'No audit entries found on this page')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {roleFilter !== 'All' 
                    ? `No audit logs found for ${roleFilter} role` 
                    : 'Audit logs will appear here when actions are performed'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground w-[180px]">When</TableHead>
              <TableHead className="text-muted-foreground">User Name</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Action</TableHead>
              <TableHead className="text-muted-foreground">Entity</TableHead>
              <TableHead className="text-muted-foreground">Entity Name</TableHead>
              <TableHead className="text-muted-foreground">Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p>Loading activities...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.map(entry => (
              <TableRow key={entry.id} className="border-border">
                <TableCell className="font-mono text-[10px] text-muted-foreground leading-tight">
                  <div className="font-semibold text-foreground/80">
                    {new Date(entry.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div>
                    {new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{entry.userName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('text-[10px] px-1.5 h-5 uppercase', roleColors[entry.userRole] || 'bg-secondary/50')}>
                    {entry.userRole?.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('text-xs', actionColors[entry.action])}>
                    {actionDisplayNames[entry.action] || entry.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{entry.entityType}</TableCell>
                <TableCell className="font-medium">{entry.entityName}</TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-pre-wrap break-words max-w-md">{entry.change}</TableCell>
              </TableRow>
            ))}
            {!isLoading && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-xl">📋</span>
                    </div>
                    <p className="text-sm font-medium">
                      {roleFilter !== 'All' 
                        ? `No ${roleFilter} audits yet` 
                        : (total === 0 ? 'No audits yet' : 'No audit entries found on this page')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {roleFilter !== 'All' 
                        ? `No audit logs found for ${roleFilter} role` 
                        : 'Audit logs will appear here when actions are performed'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>

        {/* Pagination - Only show if there are entries */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} • Showing {(page - 1) * perPage + 1} - {Math.min(page * perPage, total)} of {total} entries
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className="min-w-[36px] h-9"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-2"
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
