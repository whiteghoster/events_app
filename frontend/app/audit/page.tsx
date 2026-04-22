'use client'

import { Icon } from '@/components/icon'
import { Download01Icon } from '@hugeicons/core-free-icons'
import { useAuditLogs } from '@/hooks/use-audit-logs'
import { AuditFilters } from '@/components/audit/audit-filters'
import { AuditTable } from '@/components/audit/audit-table'
import { AuditPagination } from '@/components/audit/audit-pagination'
import { PageTransition } from '@/components/page-transition'
import { Button } from '@/components/ui/button'

export default function AuditPage() {
  const {
    logs, total, totalPages, isLoading,
    page, setPage,
    entityFilter, setEntityFilter,
    actionFilter, setActionFilter,
    roleFilter, setRoleFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    handleExportCSV,
  } = useAuditLogs()

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">Audit Trail</h1>
          {!isLoading && total > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} log entr{total !== 1 ? 'ies' : 'y'}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Icon icon={Download01Icon} size={16} className="mr-1.5" />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>

      {/* Filters */}
      <AuditFilters
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        entityFilter={entityFilter}
        setEntityFilter={setEntityFilter}
        actionFilter={actionFilter}
        setActionFilter={setActionFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        setPage={setPage}
      />

      {/* Table */}
      <div className="mt-4">
        <AuditTable logs={logs} isLoading={isLoading} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4">
          <AuditPagination
            page={page}
            totalPages={totalPages}
            total={total}
            setPage={setPage}
          />
        </div>
      )}
    </PageTransition>
  )
}
