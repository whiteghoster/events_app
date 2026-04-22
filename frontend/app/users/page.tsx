'use client'

import { useState, useMemo } from 'react'
import { Icon } from '@/components/icon'
import { Add01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import { useAuth, canManageUsers } from '@/lib/auth-context'
import { useUsers } from '@/hooks/use-users'
import { UserCard } from '@/components/users/user-card'
import { UserDialog } from '@/components/users/user-dialog'
import { EmptyState } from '@/components/empty-state'
import { PageTransition } from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

export default function UsersPage() {
  const { user } = useAuth()
  const {
    users, dialogOpen, setDialogOpen, editingUser,
    isLoading, isInitialLoading, formData, setFormData,
    openDialog, generatePassword, saveUser,
    deactivateUser, activateUser, permanentlyDeleteUser,
  } = useUsers(user?.id || '')

  const canManage = user ? canManageUsers(user.role) : false
  const [search, setSearch] = useState('')

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  }, [users, search])

  return (
    <PageTransition>
      {/* Controls */}
      <div className="mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Icon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {canManage && (
            <>
              <Button size="sm" onClick={() => openDialog()} className="hidden sm:flex">
                <Icon icon={Add01Icon} size={16} className="mr-1.5" />
                Add User
              </Button>
              <Button size="icon" onClick={() => openDialog()} className="sm:hidden h-8 w-8 shrink-0">
                <Icon icon={Add01Icon} size={16} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isInitialLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              currentUser={{ id: user?.id || '', role: user?.role || 'karigar' }}
              onEdit={openDialog}
              onDeactivate={deactivateUser}
              onActivate={activateUser}
              onPermanentlyDelete={permanentlyDeleteUser}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={search ? 'No members found' : 'No team members'}
          description={search ? 'No members match your search criteria' : 'Add your first team member to get started'}
          action={
            canManage && !search ? (
              <Button onClick={() => openDialog()}>
                <Icon icon={Add01Icon} size={16} className="mr-2" />
                Add User
              </Button>
            ) : undefined
          }
        />
      )}

      {/* User create/edit dialog */}
      <UserDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        editingUser={editingUser}
        isLoading={isLoading}
        formData={formData}
        setFormData={setFormData}
        generatePassword={generatePassword}
        saveUser={saveUser}
      />
    </PageTransition>
  )
}
