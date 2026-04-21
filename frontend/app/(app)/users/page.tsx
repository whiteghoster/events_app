'use client'

import { useRouter } from 'next/navigation'
import { UserAdd01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/icon'
import { PageHeader } from '@/components/page-header'
import { useAuth, canViewUsers } from '@/lib/auth-context'
import { useUsers } from '@/hooks/use-users'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/page-transition'
import { PageSkeleton } from '@/components/skeletons'
import { UserCard } from '@/components/users/user-card'
import { UserDialog } from '@/components/users/user-dialog'

export default function UsersPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()

  if (!currentUser || !canViewUsers(currentUser.role)) {
    router.replace('/events')
    return null
  }

  const users = useUsers(currentUser.id)

  if (users.isInitialLoading) {
    return <PageSkeleton />
  }

  return (
    <PageTransition>
      <PageHeader
        title="Team Members"
        action={
          currentUser.role === 'admin' ? (
            <Button onClick={() => users.openDialog()}>
              <Icon icon={UserAdd01Icon} size={16} className="mr-2" />
              Invite Member
            </Button>
          ) : undefined
        }
      />

      <p className="text-sm text-muted-foreground mb-4">{users.users.length} member{users.users.length !== 1 ? 's' : ''}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.users.map(user => (
          <UserCard
            key={user.id}
            user={user}
            currentUser={currentUser}
            onEdit={users.openDialog}
            onDeactivate={users.deactivateUser}
            onActivate={users.activateUser}
            onPermanentlyDelete={users.permanentlyDeleteUser}
          />
        ))}
      </div>

      <UserDialog
        dialogOpen={users.dialogOpen}
        setDialogOpen={users.setDialogOpen}
        editingUser={users.editingUser}
        isLoading={users.isLoading}
        formData={users.formData}
        setFormData={users.setFormData}
        generatePassword={users.generatePassword}
        saveUser={users.saveUser}
      />
    </PageTransition>
  )
}
