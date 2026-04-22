'use client'

import { PencilEdit01Icon, Delete01Icon, UserCheck01Icon, Shield01Icon, MoreVerticalIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserCardProps } from '@/lib/types'

export function UserCard({ user, currentUser, onEdit, onDeactivate, onActivate, onPermanentlyDelete }: UserCardProps) {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase()
  const isInactive = user.isActive === false
  const isAdmin = currentUser.role === 'admin'
  const isSelf = user.id === currentUser.id

  return (
    <Card className={`group py-0 gap-0 transition-colors hover:border-foreground/20 ${isInactive ? 'opacity-60' : ''}`}>
      <CardContent className="px-3 py-2.5 flex items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs font-medium bg-muted">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{user.name}</p>
            {isInactive && <Badge variant="destructive" className="text-[10px] shrink-0">Inactive</Badge>}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
        </div>

        <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{user.role}</Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
            >
              <Icon icon={MoreVerticalIcon} size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {isAdmin ? (
              !isInactive ? (
                <>
                  <DropdownMenuItem onClick={() => onEdit(user)}>
                    <Icon icon={PencilEdit01Icon} size={14} className="mr-2" /> Edit
                  </DropdownMenuItem>
                  {!isSelf && (
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDeactivate(user)}>
                      <Icon icon={Delete01Icon} size={14} className="mr-2" /> Deactivate
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onActivate(user)}>
                    <Icon icon={UserCheck01Icon} size={14} className="mr-2" /> Activate
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onPermanentlyDelete(user)}>
                    <Icon icon={Shield01Icon} size={14} className="mr-2" /> Delete
                  </DropdownMenuItem>
                </>
              )
            ) : (
              <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                Admin access required
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  )
}
