'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Search, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useAuth, canViewAudit } from '@/lib/auth-context'
import { auditApi, usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { AuditAction, User, AuditEntry } from '@/lib/types'

const entityTypes = ['All', 'Event', 'Product', 'Category', 'Event Row', 'User']
const actions: (AuditAction | 'All')[] = ['All', 'Created', 'Updated', 'Deleted']

const actionColors: Record<AuditAction, string> = {
  'Created': 'bg-success/20 text-success border-success/30',
  'Updated': 'bg-warning/20 text-warning border-warning/30',
  'Deleted': 'bg-destructive/20 text-destructive border-destructive/30',
}

const roleColors: Record<string, string> = {
  'admin': 'bg-primary/20 text-primary border-primary/30',
  'staff': 'bg-info/20 text-info border-info/30',
  'staff_member': 'bg-finished/20 text-finished border-finished/30',
}

export default function AuditPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('All')
  const [actionFilter, setActionFilter] = useState<AuditAction | 'All'>('All')
  const [userFilter, setUserFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 25

  const fetchUsers = useCallback(async () => {
    try {
      const res = await usersApi.getUsers(1, 100)
      setAvailableUsers(res.data)
    } catch (error) {
      console.error('Failed to fetch users for audit filter')
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await auditApi.getAuditLogs({
        entity_type: entityFilter === 'All' ? undefined : entityFilter,
        action: actionFilter === 'All' ? undefined : actionFilter,
        page,
        limit: perPage,
      })
      setLogs(res.data)
      setTotal(res.pagination.total)
    } catch (error) {
      toast.error('Failed to load audit logs')
    } finally {
      setIsLoading(false)
    }
  }, [entityFilter, actionFilter, page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  if (!currentUser || !canViewAudit(currentUser.role)) {
    router.replace('/events')
    return null
  }

  const totalPages = Math.ceil(total / perPage)

  const handleExportCSV = async () => {
    try {
      toast.loading('Preparing export...', { id: 'export-loading' })
      const res = await auditApi.exportAuditLogs({
        entity_type: entityFilter === 'All' ? undefined : entityFilter,
        action: actionFilter === 'All' ? undefined : actionFilter,
        user_id: userFilter === 'All' ? undefined : userFilter,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: search || undefined,
      })
      
      const headers = ['ID', 'When', 'Action', 'Entity', 'Change']
      const rows = res.data.map((entry: any) => [
        entry.id,
        new Date(entry.created_at).toLocaleString('en-IN'),
        entry.action,
        entry.entity_type,
        `New: ${JSON.stringify(entry.new_values || {})}`
      ])
      
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export completed', { id: 'export-loading' })
    } catch (err) {
      toast.error('Export failed', { id: 'export-loading' })
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

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="xl:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search changes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map(e => (
                <SelectItem key={e} value={e}>{e === 'All' ? 'All Entities' : e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as AuditAction | 'All')}>
            <SelectTrigger>
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {actions.map(a => (
                <SelectItem key={a} value={a}>{a === 'All' ? 'All Actions' : a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger>
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Users</SelectItem>
              {availableUsers.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From"
              className="flex-1"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground w-[180px]">When</TableHead>
              <TableHead className="text-muted-foreground">User Name</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Action</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">Entity</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Entity Name</TableHead>
              <TableHead className="text-muted-foreground">Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
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
                    {entry.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell text-xs uppercase tracking-wider font-semibold">{entry.entityType}</TableCell>
                <TableCell className="font-medium hidden md:table-cell">{entry.entityName}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate text-sm">{entry.change}</TableCell>
              </TableRow>
            ))}
            {!isLoading && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No audit entries found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * perPage + 1} - {Math.min(page * perPage, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
