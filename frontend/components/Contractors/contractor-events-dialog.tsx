'use client'

import { Loader2 } from 'lucide-react'
import { Icon } from '@/components/icon'
import { UserIcon } from '@hugeicons/core-free-icons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/status-badge'
import { useContractorEventsDialog } from '@/hooks/use-contractor-events-dialog'
import type { Contractor } from '@/lib/types'

interface ContractorEventsDialogProps {
  contractor: Contractor | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContractorEventsDialog({
  contractor,
  open,
  onOpenChange,
}: ContractorEventsDialogProps) {
  const { assignments, isLoading, isError, error } = useContractorEventsDialog({
    contractorId: contractor?.id ?? null,
    open,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center">
              <Icon icon={UserIcon} size={20} className="text-muted-foreground" />
            </div>
            <div>
              <DialogTitle className="text-base">{contractor?.name ?? 'Contractor'}</DialogTitle>
              <div className="mt-0.5">
                {contractor?.isActive ? (
                  <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px]">Inactive</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">
            Event Assignments
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive py-10 text-center border border-dashed rounded-lg">
              Failed to load contractor events{error?.message ? `: ${error.message}` : '.'}
            </p>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center border border-dashed rounded-lg">
              No events assigned to this contractor yet.
            </p>
          ) : (
            <div className="space-y-2">
              {assignments.map((a, idx) => (
                <div
                  key={`${a.eventId}-${idx}`}
                  className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-3 border rounded-lg bg-muted/30"
                >
                  {/* Event code + name */}
                  {a.eventCode && (
                    <Badge variant="secondary" className="font-mono text-[11px] shrink-0">
                      {a.eventCode}
                    </Badge>
                  )}
                  <span className="font-medium text-sm truncate">{a.eventName}</span>

                  {/* Status + member count */}
                  {a.shift && (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {a.shift}
                    </Badge>
                  )}
                  {a.memberQuantity > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {a.memberQuantity} member{a.memberQuantity !== 1 ? 's' : ''}
                    </span>
                  )}

                  {/* Work date */}
                  {a.workDate && (
                    <span className="text-xs text-muted-foreground sm:ml-auto">
                      {new Date(a.workDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
