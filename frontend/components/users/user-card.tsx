'use client'

import { PencilEdit01Icon, Delete01Icon, UserCheck01Icon, Shield01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import type { User } from '@/lib/types'

interface UserCardProps {
  user: User
  currentUser: { id: string; role: string }
  onEdit: (user: User) => void
  onDeactivate: (user: User) => void
  onActivate: (user: User) => void
  onPermanentlyDelete: (user: User) => void
}

export function UserCard({ user, currentUser, onEdit, onDeactivate, onActivate, onPermanentlyDelete }: UserCardProps) {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase()
  const isInactive = user.isActive === false

  return (
    <Card className={isInactive ? 'opacity-60' : ''}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="text-sm font-medium bg-muted">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <Badge variant="secondary" className="text-[10px] capitalize">{user.role}</Badge>
              {isInactive && <Badge variant="destructive" className="text-[10px]">Inactive</Badge>}
            </div>
          </div>
        </div>

        {currentUser.role === 'admin' && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center justify-end gap-1">
              {!isInactive ? (
                <>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onEdit(user)}>
                    <Icon icon={PencilEdit01Icon} size={12} className="mr-1" /> Edit
                  </Button>
                  {user.id !== currentUser.id && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => onDeactivate(user)}>
                      <Icon icon={Delete01Icon} size={12} className="mr-1" /> Deactivate
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onActivate(user)}>
                    <Icon icon={UserCheck01Icon} size={12} className="mr-1" /> Activate
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => onPermanentlyDelete(user)}>
                    <Icon icon={Shield01Icon} size={12} className="mr-1" /> Delete
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
