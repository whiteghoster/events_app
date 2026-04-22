'use client'

import { MagicWand01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserRole, UserDialogProps } from '@/lib/types'

const roles: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'karigar', label: 'Karigar' },
  { value: 'manager', label: 'Manager' },
]

export function UserDialog({
  dialogOpen,
  setDialogOpen,
  editingUser,
  isLoading,
  formData,
  setFormData,
  generatePassword,
  saveUser,
}: UserDialogProps) {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingUser ? 'Edit User' : 'Invite Team Member'}</DialogTitle>
          <DialogDescription>{editingUser ? 'Update user details.' : 'Create a new team member account.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@company.com" disabled={!!editingUser} />
          </div>
          {!editingUser && (
            <div className="space-y-2">
              <Label>Password *</Label>
              <div className="flex gap-2">
                <Input type="text" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder="Min 6 characters" className="flex-1" />
                <Button type="button" variant="outline" size="icon" onClick={generatePassword} title="Generate password">
                  <Icon icon={MagicWand01Icon} size={16} />
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={formData.role} onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as UserRole }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveUser} disabled={isLoading}>
            {isLoading && <Skeleton className="h-4 w-16 mr-2" />}
            {editingUser ? 'Save' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
