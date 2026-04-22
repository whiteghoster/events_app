'use client'

import { Icon } from '@/components/icon'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { useAuth, canManageUsers } from '@/lib/auth-context'
import { useUsers } from '@/hooks/use-users'
import { UserCard } from '@/components/users/user-card'
import { UserDialog } from '@/components/users/user-dialog'
import { EmptyState } from '@/components/empty-state'
import { PageTransition } from '@/components/page-transition'
import { Button } from '@/components/ui/button'
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

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">Team</h1>
          {!isInitialLoading && users.length > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {users.length} member{users.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {canManage && (
          <Button size="sm" onClick={() => openDialog()}>
            <Icon icon={Add01Icon} size={16} className="mr-1.5" />
            Add User
          </Button>
        )}
      </div>

      {/* Content */}
      {isInitialLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map((u) => (
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
          title="No team members"
          description="Add your first team member to get started"
          action={
            canManage ? (
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
