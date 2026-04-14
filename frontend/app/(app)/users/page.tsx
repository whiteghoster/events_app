'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
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
  { value: 'staff', label: 'Staff' },
  { value: 'staff_member', label: 'Staff Member' },
]

const roleColors: Record<UserRole, string> = {
  'admin': 'bg-primary text-primary-foreground',
  'staff': 'bg-info text-foreground',
  'staff_member': 'bg-finished text-foreground',
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
    role: 'staff' as UserRole,
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
        role: user.role,
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        role: 'staff',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required')
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
          password: Math.random().toString(36).slice(-10), // Random password for invitee
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        title="Team Members"
        action={
          <Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        }
      />

      <div className="bg-card rounded-xl border border-border overflow-hidden">
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
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenDialog(user)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {user.id !== currentUser.id && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
            <DialogTitle>{editingUser ? 'Edit User' : 'Invite User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user details and permissions.' : 'Send an invitation to join the team.'}
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
              {editingUser ? 'Save' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
