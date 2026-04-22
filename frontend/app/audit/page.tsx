'use client'

import { Icon } from '@/components/icon'
import { Download01Icon } from '@hugeicons/core-free-icons'
import { useAuditLogs } from '@/hooks/use-audit-logs'
import { AuditFilters } from '@/components/audit/audit-filters'
import { AuditTable } from '@/components/audit/audit-table'
import { AuditPagination } from '@/components/audit/audit-pagination'
import { PageTransition } from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const userRoles = ['All', 'admin', 'manager', 'karigar'] as const

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
      {/* Controls */}
      <div className="mb-6 space-y-3 sm:space-y-0">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }} className="flex-1 sm:flex-none">
            <TabsList className="w-full sm:w-auto">
              {userRoles.map(role => (
                <TabsTrigger key={role} value={role} className="flex-1 sm:flex-none capitalize">
                  {role === 'All' ? 'All Roles' : role}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="hidden sm:flex">
              <Icon icon={Download01Icon} size={16} className="mr-1.5" />
              Export CSV
            </Button>
            <Button variant="outline" size="icon" onClick={handleExportCSV} className="sm:hidden h-8 w-8">
              <Icon icon={Download01Icon} size={16} />
            </Button>
          </div>
        </div>
      </div>

      {!isLoading && total > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          {total} log entr{total !== 1 ? 'ies' : 'y'}
        </p>
      )}

      {/* Filters */}
      <AuditFilters
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
      <div className="mt-4 overflow-hidden">
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
