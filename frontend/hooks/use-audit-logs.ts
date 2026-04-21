import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { auditApi } from '@/lib/api'
import type { AuditAction } from '@/lib/types'

export function useAuditLogs() {
  const [page, setPage] = useState(1)
  const perPage = 25
  const [entityFilter, setEntityFilter] = useState('All')
  const [actionFilter, setActionFilter] = useState<AuditAction | 'All'>('All')
  const [roleFilter, setRoleFilter] = useState<string>('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

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
    staleTime: 1000 * 60 * 2,
    placeholderData: (previousData) => previousData,
  })

  const logs = auditData?.data || []
  const total = auditData?.pagination?.total || 0
  const totalPages = Math.ceil(total / perPage)

  const handleExportCSV = async () => {
    try {
      toast.loading('Preparing export...', { id: 'export-loading' })
      const res = await auditApi.getAuditLogs({ page: 1, limit: 1000 })

      const headers = [
        'ID', 'Timestamp', 'Date', 'Time', 'Action', 'Entity Type',
        'Entity ID', 'Entity Name', 'User Name', 'User Email', 'User Role',
        'Old Values', 'New Values', 'Changes Summary',
      ]

      const rows = res.data.map((entry: any) => {
        const timestamp = new Date(entry.timestamp || entry.created_at)
        const oldVals = entry.old_values || {}
        const newVals = entry.new_values || {}
        let changesSummary = ''
        if (entry.action === 'create') changesSummary = `Created new ${entry.entityType}`
        else if (entry.action === 'delete') changesSummary = `Deleted ${entry.entityType}`
        else if (entry.action === 'update') {
          const changedKeys = Object.keys(newVals).filter(k => k !== 'updated_at' && oldVals[k] !== newVals[k])
          changesSummary = changedKeys.length > 0 ? `Updated: ${changedKeys.join(', ')}` : 'Updated'
        }
        return [
          entry.id, timestamp.toISOString(),
          timestamp.toLocaleDateString('en-IN'), timestamp.toLocaleTimeString('en-IN'),
          entry.action, entry.entityType, entry.entityId, entry.entityName,
          entry.userName, entry.userId, entry.userRole,
          JSON.stringify(oldVals).replace(/"/g, '""'),
          JSON.stringify(newVals).replace(/"/g, '""'),
          changesSummary,
        ]
      })

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${rows.length} records`, { id: 'export-loading' })
    } catch {
      toast.error('Export failed', { id: 'export-loading' })
    }
  }

  return {
    logs,
    total,
    totalPages,
    isLoading,
    page,
    setPage,
    perPage,
    entityFilter,
    setEntityFilter,
    actionFilter,
    setActionFilter,
    roleFilter,
    setRoleFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    handleExportCSV,
  }
}
