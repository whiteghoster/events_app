'use client'

import { useState, useMemo } from 'react'
import { Icon } from '@/components/icon'
import { Add01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import { useAuth, canManageUsers, canManageContractors } from '@/lib/auth-context'
import { useUsers } from '@/hooks/use-users'
import { useContractors } from '@/hooks/use-contractors'
import { UserCard } from '@/components/users/user-card'
import { UserDialog } from '@/components/users/user-dialog'
import { ContractorCard } from '@/components/Contractors/contractor-card'
import { ContractorDialog } from '@/components/Contractors/contractor-dialog'
import { ContractorEventsDialog } from '@/components/Contractors/contractor-events-dialog'
import { EmptyState } from '@/components/empty-state'
import { PageTransition } from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import type { Contractor } from '@/lib/types'

// Authorized emails for Manpower section
const MANPOWER_AUTHORIZED_EMAILS = [
  'anshumanprajapati575@gmail.com',
  'narchal@gmail.com'
]

export default function UsersPage() {
  const { user } = useAuth()
  const {
    users, dialogOpen, setDialogOpen, editingUser,
    isLoading, isInitialLoading, formData, setFormData,
    openDialog, generatePassword, saveUser,
    deactivateUser, activateUser, permanentlyDeleteUser,
  } = useUsers(user?.id || '')

  // Contractors hook
  const {
    Contractors,
    isLoading: isContractorsLoading,
    dialogOpen: ContractorDialogOpen,
    setDialogOpen: setContractorDialogOpen,
    editingContractor,
    formData: ContractorFormData,
    setFormData: setContractorFormData,
    openDialog: openContractorDialog,
    saveContractor,
    deleteContractor,
    toggleActive,
    isSaving: isContractorSaving,
  } = useContractors()

  const canManage = user ? canManageUsers(user.role) : false
  const canViewManpower = user ? MANPOWER_AUTHORIZED_EMAILS.includes(user.email) : false
  const canManageManpower = user ? canManageContractors(user.role) : false
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('team')

  // Contractor events dialog state
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)
  const [contractorEventsOpen, setContractorEventsOpen] = useState(false)

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  }, [users, search])

  const filteredContractors = useMemo(() => {
    if (!search.trim()) return Contractors
    const q = search.toLowerCase()
    return Contractors.filter(t =>
      t.name.toLowerCase().includes(q)
    )
  }, [Contractors, search])

  // Debug logging
  console.log('[UsersPage] Contractors:', Contractors)
  console.log('[UsersPage] filteredContractors:', filteredContractors)
  console.log('[UsersPage] search:', search)

  return (
    <PageTransition>
      {/* Controls */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Icon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {activeTab === 'team' && canManage && (
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

          {activeTab === 'manpower' && canViewManpower && canManageManpower && (
            <>
              <Button size="sm" onClick={() => openContractorDialog()} className="hidden sm:flex">
                <Icon icon={Add01Icon} size={16} className="mr-1.5" />
                Add Contractor
              </Button>
              <Button size="icon" onClick={() => openContractorDialog()} className="sm:hidden h-8 w-8 shrink-0">
                <Icon icon={Add01Icon} size={16} />
              </Button>
            </>
          )}
        </div>

        {/* Tabs */}
        {canViewManpower && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="team">Team Members</TabsTrigger>
              <TabsTrigger value="manpower">Manpower</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Team Members Tab Content */}
      {(!canViewManpower || activeTab === 'team') && (
        <>
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
        </>
      )}

      {/* Manpower Tab Content */}
      {canViewManpower && activeTab === 'manpower' && (
        <>
          {isContractorsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContractors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredContractors.map((t) => (
                <ContractorCard
                  key={`${t.id}-${t.name}-${t.isActive}`}  // Stable key with multiple properties
                  Contractor={t}
                  canManage={canManageManpower}
                  onEdit={openContractorDialog}
                  onDelete={deleteContractor}
                  onToggleActive={toggleActive}
                  onClick={(c) => { setSelectedContractor(c); setContractorEventsOpen(true) }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={search ? 'No Contractors found' : 'No Contractors'}
              description={search ? 'No Contractors match your search' : 'Add your first Contractor to get started'}
              action={
                canManageManpower && !search ? (
                  <Button onClick={() => openContractorDialog()}>
                    <Icon icon={Add01Icon} size={16} className="mr-2" />
                    Add Contractor
                  </Button>
                ) : undefined
              }
            />
          )}
        </>
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

      {/* Contractor create/edit dialog */}
      <ContractorDialog
        dialogOpen={ContractorDialogOpen}
        setDialogOpen={setContractorDialogOpen}
        editingContractor={editingContractor}
        formData={ContractorFormData}
        setFormData={setContractorFormData}
        saveContractor={saveContractor}
        isLoading={isContractorSaving}
      />

      {/* Contractor events detail dialog */}
      <ContractorEventsDialog
        contractor={selectedContractor}
        open={contractorEventsOpen}
        onOpenChange={setContractorEventsOpen}
      />
    </PageTransition>
  )
}

