'use client'

import { useRouter } from 'next/navigation'
import { Download01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/icon'
import { PageHeader } from '@/components/page-header'
import { useAuth, canViewAudit } from '@/lib/auth-context'
import { useAuditLogs } from '@/hooks/use-audit-logs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageTransition } from '@/components/page-transition'
import { AuditFilters } from '@/components/audit/audit-filters'
import { AuditTable } from '@/components/audit/audit-table'
import { AuditPagination } from '@/components/audit/audit-pagination'

export default function AuditPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const audit = useAuditLogs()

  if (!currentUser || !canViewAudit(currentUser.role)) {
    router.replace('/events')
    return null
  }

  return (
    <PageTransition>
      <PageHeader
        title="Audit Trail"
        action={
          <Button variant="outline" onClick={audit.handleExportCSV}>
            <Icon icon={Download01Icon} size={16} className="mr-2" /> Export CSV
          </Button>
        }
      />

      <AuditFilters
        roleFilter={audit.roleFilter}
        setRoleFilter={audit.setRoleFilter}
        entityFilter={audit.entityFilter}
        setEntityFilter={audit.setEntityFilter}
        actionFilter={audit.actionFilter}
        setActionFilter={audit.setActionFilter}
        dateFrom={audit.dateFrom}
        setDateFrom={audit.setDateFrom}
        dateTo={audit.dateTo}
        setDateTo={audit.setDateTo}
        setPage={audit.setPage}
      />

      <Card className="overflow-hidden">
        <AuditTable logs={audit.logs} isLoading={audit.isLoading} />
        <AuditPagination
          page={audit.page}
          totalPages={audit.totalPages}
          total={audit.total}
          setPage={audit.setPage}
        />
      </Card>
    </PageTransition>
  )
}
