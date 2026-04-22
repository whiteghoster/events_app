'use client'

import { Icon } from '@/components/icon'
import { UserAdd01Icon, MagicWand01Icon, Shield01Icon, UserIcon, Mail01Icon, LockIcon } from '@hugeicons/core-free-icons'
import { Loader2 } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useRegisterForm } from '@/hooks/use-register-form'
import type { SidebarRegisterFormProps } from '@/lib/types'

export function SidebarRegisterForm({ collapsed }: SidebarRegisterFormProps) {
  const { user } = useAuth()
  const {
    isOpen, setIsOpen, isLoading, formData,
    handleChange, generatePassword, handleSubmit,
  } = useRegisterForm()

  if (user?.role !== 'admin') {
    return null
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
          <Icon icon={UserAdd01Icon} size={20} />
          {!collapsed && <span className="font-semibold text-sm">Invite Member</span>}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[450px] bg-card border-l border-border flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Icon icon={Shield01Icon} size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Admin Tool</span>
          </div>
          <SheetTitle className="text-2xl">Quick Invite</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Create a new account for a karigar, manager, or administrator.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Icon icon={UserIcon} size={12} /> Full Name
              </Label>
              <Input
                placeholder="John Doe"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                className="bg-secondary/50 border-border focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Icon icon={Mail01Icon} size={12} /> Professional Email
              </Label>
              <Input
                type="email"
                placeholder="john@floraindia.com"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                className="bg-secondary/50 border-border focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Icon icon={LockIcon} size={12} /> Initial Password
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={e => handleChange('password', e.target.value)}
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
                  <Icon icon={MagicWand01Icon} size={16} />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                System Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={v => handleChange('role', v)}
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
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Icon icon={UserAdd01Icon} size={16} className="mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
