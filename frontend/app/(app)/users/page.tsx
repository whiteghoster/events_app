'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useAuth, canViewUsers } from '@/lib/auth-context'
import { users as initialUsers } from '@/lib/mock-data'
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

const roles: UserRole[] = ['Admin', 'Staff', 'Staff Member']

const roleColors: Record<UserRole, string> = {
  'Admin': 'bg-primary text-primary-foreground',
  'Staff': 'bg-info text-foreground',
  'Staff Member': 'bg-finished text-foreground',
}

export default function UsersPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Staff' as UserRole,
  })

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
        role: 'Staff',
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
    await new Promise(resolve => setTimeout(resolve, 500))

    if (editingUser) {
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { ...u, name: formData.name, role: formData.role }
          : u
      ))
      toast.success('User updated')
    } else {
      const newUser: User = {
        id: `new-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        createdAt: new Date().toISOString().split('T')[0],
      }
      setUsers(prev => [...prev, newUser])
      toast.success('Invite sent')
    }
    
    setIsLoading(false)
    setDialogOpen(false)
  }

  const handleDelete = (user: User) => {
    if (user.id === currentUser.id) {
      toast.error('You cannot delete yourself')
      return
    }
    setUsers(prev => prev.filter(u => u.id !== user.id))
    toast.success('User removed')
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
                  <Badge className={cn('text-xs', roleColors[user.role])}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">
                  {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
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
                    <SelectItem key={r} value={r}>{r}</SelectItem>
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
