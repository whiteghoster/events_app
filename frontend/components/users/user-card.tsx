'use client'

import { useState } from 'react'
import { PencilEdit01Icon, Delete01Icon, UserCheck01Icon, Shield01Icon, MoreVerticalIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { UserCardProps } from '@/lib/types'

export function UserCard({ user, currentUser, onEdit, onDeactivate, onActivate, onPermanentlyDelete }: UserCardProps) {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase()
  const isInactive = user.isActive === false
  const isAdmin = currentUser.role === 'admin'
  const isSelf = user.id === currentUser.id
  const [dialogOpen, setDialogOpen] = useState(false)

  if (!isAdmin) {
    return (
      <Card className={`group py-0 gap-0 transition-colors hover:border-foreground/20 ${isInactive ? 'opacity-60' : ''}`}>
        <CardContent className="px-3 py-2.5 flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-muted text-xs font-medium flex items-center justify-center">{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{user.name}</p>
              {isInactive && <Badge variant="destructive" className="text-[10px] shrink-0">Inactive</Badge>}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
          </div>
          <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{user.role}</Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={`group py-0 gap-0 transition-colors hover:border-foreground/20 ${isInactive ? 'opacity-60' : ''}`}>
        <CardContent className="px-3 py-2.5 flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-muted text-xs font-medium flex items-center justify-center">{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{user.name}</p>
              {isInactive && <Badge variant="destructive" className="text-[10px] shrink-0">Inactive</Badge>}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
          </div>
          <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{user.role}</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setDialogOpen(true)}
          >
            <Icon icon={MoreVerticalIcon} size={14} />
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>User Actions</DialogTitle>
            <DialogDescription>{user.name} ({user.email})</DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-2">
            {!isInactive ? (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => {
                    onEdit(user)
                    setDialogOpen(false)
                  }}
                >
                  <Icon icon={PencilEdit01Icon} size={18} className="text-blue-500" />
                  <div className="text-left">
                    <p className="font-medium">Edit User</p>
                    <p className="text-xs text-muted-foreground">Change name, email, or role</p>
                  </div>
                </Button>
                {!isSelf && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3 border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      onDeactivate(user)
                      setDialogOpen(false)
                    }}
                  >
                    <Icon icon={Delete01Icon} size={18} />
                    <div className="text-left">
                      <p className="font-medium">Deactivate</p>
                      <p className="text-xs text-muted-foreground">Disable user account</p>
                    </div>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => {
                    onActivate(user)
                    setDialogOpen(false)
                  }}
                >
                  <Icon icon={UserCheck01Icon} size={18} className="text-green-500" />
                  <div className="text-left">
                    <p className="font-medium">Activate</p>
                    <p className="text-xs text-muted-foreground">Re-enable user account</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3 border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    onPermanentlyDelete(user)
                    setDialogOpen(false)
                  }}
                >
                  <Icon icon={Shield01Icon} size={18} />
                  <div className="text-left">
                    <p className="font-medium">Delete</p>
                    <p className="text-xs text-muted-foreground">Permanently remove user</p>
                  </div>
                </Button>
              </>
            )}
          </div>
          <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full">
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
