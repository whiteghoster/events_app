'use client'

import { PencilEdit01Icon, Delete01Icon, UserIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Contractor } from '@/lib/types'

interface ContractorCardProps {
  Contractor: Contractor
  canManage?: boolean
  onEdit: (Contractor: Contractor) => void
  onDelete: (id: string) => void
  onToggleActive: (Contractor: Contractor) => void
  onClick?: (Contractor: Contractor) => void
}

export function ContractorCard({ Contractor, canManage, onEdit, onDelete, onToggleActive, onClick }: ContractorCardProps) {
  return (
    <Card className={`group py-0 gap-0 transition-colors hover:border-foreground/20 ${!Contractor.isActive ? 'opacity-60' : ''} ${onClick ? 'cursor-pointer' : ''}`}>
      <CardContent className="px-3 py-2.5 flex items-center gap-3">
        <button
          type="button"
          className="flex flex-1 min-w-0 items-center gap-3 text-left"
          onClick={() => onClick?.(Contractor)}
          disabled={!onClick}
        >
          <div className="h-9 w-9 shrink-0 rounded-full bg-muted flex items-center justify-center">
            <Icon icon={UserIcon} size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{Contractor.name}</p>
              {!Contractor.isActive && <Badge variant="destructive" className="text-[10px] shrink-0">Inactive</Badge>}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {Contractor.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </button>
        {canManage && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={(e) => { e.stopPropagation(); onEdit(Contractor) }}
            >
              <Icon icon={PencilEdit01Icon} size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(Contractor.id) }}
            >
              <Icon icon={Delete01Icon} size={14} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
