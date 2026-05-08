'use client'

import { useState } from 'react'

import {
  PencilEdit01Icon,
  Delete01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'

import { Icon } from '@/components/icon'

import { Button } from '@/components/ui/button'

import {
  Card,
  CardContent,
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { Contractor } from '@/lib/types'

interface ContractorCardProps {
  Contractor: Contractor
  canManage?: boolean
  onEdit: (Contractor: Contractor) => void
  onDelete: (id: string) => Promise<void>
  onToggleActive: (Contractor: Contractor) => void
  onClick?: (Contractor: Contractor) => void
}

export function ContractorCard({
  Contractor,
  canManage,
  onEdit,
  onDelete,
  onToggleActive,
  onClick,
}: ContractorCardProps) {
  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Open confirmation dialog
  const handleDeleteClick = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  // Confirm delete
  const handleConfirmDelete = () => {
  console.log('[CONFIRM DELETE]', Contractor.id)

  onDelete(Contractor.id)

  setShowDeleteDialog(false)
}
  return (
    <>
      {/* Contractor Card */}
      <Card
        className={`group py-0 gap-0 transition-colors hover:border-foreground/20 ${
          !Contractor.isActive ? 'opacity-60' : ''
        } ${onClick ? 'cursor-pointer' : ''}`}
      >
        <CardContent className="px-3 py-2.5 flex items-center gap-3">
          <button
            type="button"
            className="flex flex-1 min-w-0 items-center gap-3 text-left"
            onClick={() => onClick?.(Contractor)}
            disabled={!onClick}
          >
            <div className="h-9 w-9 shrink-0 rounded-full bg-muted flex items-center justify-center">
              <Icon
                icon={UserIcon}
                size={18}
                className="text-muted-foreground"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">
                  {Contractor.name}
                </p>

                {!Contractor.isActive && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] shrink-0"
                  >
                    Inactive
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {Contractor.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </button>

          {canManage && (
            <div className="flex items-center gap-1">
              {/* Edit Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(Contractor)
                }}
              >
                <Icon icon={PencilEdit01Icon} size={14} />
              </Button>

              {/* Delete Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                onClick={handleDeleteClick}
              >
                <Icon icon={Delete01Icon} size={14} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Delete Contractor
            </DialogTitle>

            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium">
                {Contractor.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}