'use client'

import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSkeleton } from '@/components/skeletons'
import type { AuditAction, AuditEntry, AuditTableProps } from '@/lib/types'

const actionLabel: Record<AuditAction, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
}

export function AuditTable({ logs, isLoading }: AuditTableProps) {
  return (
    <>
      {/* Mobile View */}
      <div className="lg:hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={3} />
        ) : logs.length > 0 ? (
          logs.map(entry => (
            <div key={entry.id} className="p-4 border-b last:border-b-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {actionLabel[entry.action] || entry.action}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(entry.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{entry.userName}</span>
                  <Badge variant="secondary" className="text-[10px] capitalize">{entry.userRole}</Badge>
                </div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">{entry.entityType}</p>
                {entry.entityName && <p className="font-medium">{entry.entityName}</p>}
                {entry.change && <p className="text-muted-foreground text-sm">{entry.change}</p>}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">No audit entries found.</div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <TableSkeleton rows={8} cols={7} />
                </TableCell>
              </TableRow>
            ) : logs.length > 0 ? (
              logs.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <div>{new Date(entry.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div>{new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </TableCell>
                  <TableCell className="font-medium">{entry.userName}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs capitalize">{entry.userRole}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{actionLabel[entry.action] || entry.action}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground uppercase font-semibold">{entry.entityType}</TableCell>
                  <TableCell className="font-medium">{entry.entityName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-md truncate">{entry.change}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No audit entries found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
