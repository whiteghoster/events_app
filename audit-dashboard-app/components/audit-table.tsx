'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/lib/audit-service';
import { AuditEntry, AuditFilter } from '@/types/audit';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import AuditDetail from './audit-detail';
import ExportButton from './export-button';
import { formatDistanceToNow } from 'date-fns';

interface AuditTableProps {
  filters: Partial<AuditFilter>;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function AuditTable({
  filters,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: AuditTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AuditEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audits', filters, page, limit],
    queryFn: () =>
      auditService.getAudits({
        page,
        limit,
        filters: filters as AuditFilter,
      }),
    placeholderData: (previousData) => previousData,
  });

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelected(new Set(data?.data.map((item) => item.id) || []));
    } else {
      setSelected(new Set());
    }
  }, [data]);

  const handleSelect = useCallback((id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  }, [selected]);

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;

    setIsDeleting(true);
    try {
      await auditService.deleteRecords(Array.from(selected));
      toast.success(`Deleted ${selected.size} records`);
      setSelected(new Set());
      setShowDeleteConfirm(false);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete records');
    } finally {
      setIsDeleting(false);
    }
  };

  const getOperationBadgeColor = (operation: string) => {
    switch (operation?.toUpperCase()) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selected.size > 0 && (
              <>
                <span className="text-sm text-muted-foreground">{selected.size} selected</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="flex-1 sm:flex-none"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <ExportButton filters={filters as AuditFilter} />
          </div>
        </div>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selected.size === data?.data.length && data?.data.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No audit records found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(record.id)}
                          onCheckedChange={() => handleSelect(record.id)}
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getOperationBadgeColor(record.action)}`}>
                          {record.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{record.entity_display_id || record.entity_id}</TableCell>
                      <TableCell className="text-sm">{record.entity_type}</TableCell>
                      <TableCell className="text-sm">{record.users?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Success
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAudit(record)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination and Limit */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-muted-foreground">Items per page:</span>
            <Select value={limit.toString()} onValueChange={(val) => onLimitChange(parseInt(val))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {data?.meta && data.meta.total_pages > 1 && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.meta.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page === data.meta.total_pages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Audit Records</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selected.size} record(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Audit Detail Drawer */}
      {selectedAudit && (
        <AuditDetail
          audit={selectedAudit}
          onClose={() => setSelectedAudit(null)}
        />
      )}
    </>
  );
}
