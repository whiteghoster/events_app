'use client';

import { useState, useCallback } from 'react';
import AuditTable from '@/components/audit-table';
import AuditFilters from '@/components/audit-filters';
import { AuditFilter as AuditFilterType } from '@/types/audit';

export default function AuditsPage() {
  const [filters, setFilters] = useState<Partial<AuditFilterType>>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const handleFilterChange = useCallback((newFilters: Partial<AuditFilterType>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return (
    <div className="h-screen overflow-auto">
      <div className="p-4 sm:p-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-2">View and manage system audit records</p>
        </div>

        <AuditFilters onFiltersChange={handleFilterChange} />
        <AuditTable
          filters={filters}
          page={page}
          limit={limit}
          onPageChange={handlePageChange}
          onLimitChange={setLimit}
        />
      </div>
    </div>
  );
}
