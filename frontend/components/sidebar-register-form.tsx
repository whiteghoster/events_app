'use client'

import { useState } from 'react'
import { UserPlus, Loader2, Wand2, Shield, User, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usersApi } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

interface SidebarRegisterFormProps {
  collapsed?: boolean
}

export function SidebarRegisterForm({ collapsed }: SidebarRegisterFormProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'karigar',
  })

  // Only allow admin users to create users
  if (user?.role !== 'admin') {
    return null
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      await usersApi.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })
      toast.success('Team member invited successfully')
      setIsOpen(false)
      setFormData({ name: '', email: '', password: '', role: 'karigar' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="secondary"
          className={cn(
            'w-full justify-start gap-3 bg-primary/10 text-primary hover:bg-primary/20 border-none transition-all duration-200',
            collapsed ? 'px-0 justify-center' : 'px-4'
          )}
          title="Invite Member"
        >
          <UserPlus className="w-5 h-5" />
          {!collapsed && <span className="font-semibold text-sm">Invite Member</span>}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[450px] bg-card border-l border-border flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Admin Tool</span>
          </div>
          <SheetTitle className="text-2xl">Quick Invite</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Create a new account for a karigar, manager, or administrator.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <User className="w-3 h-3" /> Full Name
              </Label>
              <Input
                placeholder="John Doe"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-secondary/50 border-border focus:ring-primary/20"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Mail className="w-3 h-3" /> Professional Email
              </Label>
              <Input
                type="email"
                placeholder="john@floraindia.com"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-secondary/50 border-border focus:ring-primary/20"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Lock className="w-3 h-3" /> Initial Password
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-secondary/50 border-border flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  className="shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={generatePassword}
                  title="Generate Secure Password"
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                System Role
              </Label>
              <Select 
                value={formData.role} 
                onValueChange={v => setFormData(prev => ({ ...prev, role: v }))}
              >
                <SelectTrigger className="bg-secondary/50 border-border">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="karigar">Karigar (Standard)</SelectItem>
                  <SelectItem value="manager">Manager (Field)</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        <SheetFooter className="p-6 border-t border-border bg-secondary/30">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-11"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            Send Invitation
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
