'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Loader2, UserCheck, ShieldAlert, RefreshCw, Wand2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useAuth, canViewUsers } from '@/lib/auth-context'
import { usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { User, UserRole } from '@/lib/types'

const roles: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'karigar', label: 'Karigar' },
  { value: 'manager', label: 'Manager' },
]

const roleColors: Record<UserRole, string> = {
  'admin': 'bg-primary text-primary-foreground',
  'karigar': 'bg-info text-foreground',
  'manager': 'bg-finished text-foreground',
}

export default function UsersPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  
  const [users, setUsers] = useState<User[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'karigar' as UserRole,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsInitialLoading(true)
      const res = await usersApi.getUsers()
      setUsers(res.data)
    } catch (error: any) {
      toast.error('Failed to load users')
    } finally {
      setIsInitialLoading(false)
    }
  }

  if (!currentUser || !canViewUsers(currentUser.role)) {
    router.replace('/events')
    return null
  }

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'karigar',
      })
    }
    setDialogOpen(true)
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, password }))
    toast.success('Secure password generated')
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users')
      return
    }

    setIsLoading(true)
    try {
      if (editingUser) {
        const updated = await usersApi.updateUser(editingUser.id, {
          name: formData.name,
          role: formData.role,
        })
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
        toast.success('User updated successfully')
      } else {
        await usersApi.createUser({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password,
        })
        toast.success('User invitation created')
        fetchUsers()
      }
      setDialogOpen(false)
    } catch (error: any) {
      console.error('Save failed:', error)
      toast.error(error.message || 'Error processing request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (user.id === currentUser.id) {
      toast.error('You cannot delete yourself')
      return
    }
    
    if (!confirm(`Are you sure you want to deactivate ${user.name}?`)) return

    try {
      await usersApi.deleteUser(user.id)
      // Update local state instead of full refresh
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: false } : u))
      toast.success('User has been deactivated')
    } catch (error: any) {
      console.error('Deactivation failed:', error)
      toast.error(error.message || 'Failed to deactivate user')
    }
  }

  const handleActivate = async (user: User) => {
    try {
      const updated = await usersApi.activateUser(user.id)
      setUsers(prev => prev.map(u => u.id === user.id ? updated : u))
      toast.success('User account re-activated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate user')
    }
  }

  const handlePermanentDelete = async (user: User) => {
    const confirmed = window.confirm(
      `DANGER: Are you sure you want to PERMANENTLY delete ${user.name}? This will remove all their auth credentials and database records. This cannot be undone.`
    )
    if (!confirmed) return

    setIsLoading(true)
    try {
      await usersApi.permanentlyDeleteUser(user.id)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      toast.success('User permanently deleted')
    } catch (error: any) {
      toast.error(error.message || 'Failed to permanently delete user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Team Members"
        />
        {currentUser.role === 'admin' && (
          <Button 
            onClick={() => handleOpenDialog()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Invite Member
          </Button>
        )}
      </div>

      <div className="skeu-card bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">Created</TableHead>
              <TableHead className="text-muted-foreground w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id} className="border-border">
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={cn('text-xs', roleColors[user.role])}>
                      {user.role}
                    </Badge>
                    {user.isActive === false && (
                      <Badge variant="outline" className="text-[10px] uppercase border-destructive text-destructive">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {user.isActive !== false ? (
                      <>
                        {currentUser.role === 'admin' && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenDialog(user)}
                            title="Edit User"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {currentUser.role === 'admin' && user.id !== currentUser.id && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(user)}
                            title="Deactivate User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        {currentUser.role === 'admin' && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-success hover:text-success/80"
                            onClick={() => handleActivate(user)}
                            title="Activate User"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}
                        {currentUser.role === 'admin' && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive hover:text-destructive/80"
                            onClick={() => handlePermanentDelete(user)}
                            title="Permanently Delete"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user details and permissions.' : 'Create a new team member account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-label">Name <span className="text-primary">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-label">Email <span className="text-primary">*</span></Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@company.com"
                disabled={!!editingUser}
                className={editingUser ? 'opacity-60' : ''}
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label className="text-label">Password <span className="text-primary">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generatePassword}
                    title="Generate Secure Password"
                  >
                    <Wand2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-label">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as UserRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingUser ? 'Save' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
