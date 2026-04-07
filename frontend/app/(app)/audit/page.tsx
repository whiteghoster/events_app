'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Search } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useAuth, canViewAudit } from '@/lib/auth-context'
import { auditLog, users } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AuditAction } from '@/lib/types'

const entityTypes = ['All', 'Event', 'Product', 'Category', 'Event Row', 'User']
const actions: (AuditAction | 'All')[] = ['All', 'Created', 'Updated', 'Deleted']

const actionColors: Record<AuditAction, string> = {
  'Created': 'bg-success/20 text-success border-success/30',
  'Updated': 'bg-warning/20 text-warning border-warning/30',
  'Deleted': 'bg-destructive/20 text-destructive border-destructive/30',
}

export default function AuditPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('All')
  const [actionFilter, setActionFilter] = useState<AuditAction | 'All'>('All')
  const [userFilter, setUserFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 25

  if (!currentUser || !canViewAudit(currentUser.role)) {
    router.replace('/events')
    return null
  }

  const filteredLog = useMemo(() => {
    return auditLog.filter(entry => {
      const matchesSearch = !search || 
        entry.change.toLowerCase().includes(search.toLowerCase()) ||
        entry.entityName.toLowerCase().includes(search.toLowerCase())
      
      const matchesEntity = entityFilter === 'All' || entry.entityType === entityFilter
      const matchesAction = actionFilter === 'All' || entry.action === actionFilter
      const matchesUser = userFilter === 'All' || entry.userId === userFilter
      
      const entryDate = new Date(entry.timestamp).toISOString().split('T')[0]
      const matchesDateFrom = !dateFrom || entryDate >= dateFrom
      const matchesDateTo = !dateTo || entryDate <= dateTo
      
      return matchesSearch && matchesEntity && matchesAction && matchesUser && matchesDateFrom && matchesDateTo
    })
  }, [search, entityFilter, actionFilter, userFilter, dateFrom, dateTo])

  const paginatedLog = filteredLog.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filteredLog.length / perPage)

  const handleExportCSV = () => {
    const headers = ['When', 'Who', 'Action', 'Entity', 'Name', 'Change']
    const rows = filteredLog.map(entry => [
      new Date(entry.timestamp).toLocaleString('en-IN'),
      entry.userName,
      entry.action,
      entry.entityType,
      entry.entityName,
      entry.change,
    ])
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
              {users.map(u => (
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
              <TableHead className="text-muted-foreground">When</TableHead>
              <TableHead className="text-muted-foreground">Who</TableHead>
              <TableHead className="text-muted-foreground">Action</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">Entity</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Name</TableHead>
              <TableHead className="text-muted-foreground">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLog.map(entry => (
              <TableRow key={entry.id} className="border-border">
                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(entry.timestamp).toLocaleString('en-IN', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </TableCell>
                <TableCell className="font-medium">{entry.userName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('text-xs', actionColors[entry.action])}>
                    {entry.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{entry.entityType}</TableCell>
                <TableCell className="font-medium hidden md:table-cell">{entry.entityName}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">{entry.change}</TableCell>
              </TableRow>
            ))}
            {paginatedLog.length === 0 && (
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
              Showing {(page - 1) * perPage + 1} - {Math.min(page * perPage, filteredLog.length)} of {filteredLog.length}
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
