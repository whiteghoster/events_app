'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Package, Users, FileText, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, canViewCatalog, canViewUsers, canViewAudit } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { SidebarRegisterForm } from '@/components/sidebar-register-form'

const navItems = [
  { href: '/events', label: 'Events', icon: Calendar, permission: () => true },
  { href: '/catalog', label: 'Catalog', icon: Package, permission: canViewCatalog },
  { href: '/users', label: 'Users', icon: Users, permission: canViewUsers },
  { href: '/audit', label: 'Audit Log', icon: FileText, permission: canViewAudit },
]

const roleColors = {
  'admin': 'bg-primary text-primary-foreground',
  'staff': 'bg-info text-foreground',
  'staff_member': 'bg-finished text-foreground',
}

export function AppSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  if (!user) return null

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen bg-card border-r border-border transition-all duration-250 ease-in-out',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">E</span>
          </div>
          {!collapsed && (
            <span className="font-serif text-xl text-foreground">
              Event<span className="text-primary">OS</span>
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navItems.map(item => {
            if (!item.permission(user.role)) return null
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 mx-2 rounded-md transition-colors relative',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r" />
                )}
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse Button */}
        <div className="px-2 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center text-muted-foreground"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* User Section */}
        <div className="border-t border-border p-4">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-foreground font-medium text-sm">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <Badge variant="secondary" className={cn('text-xs mt-0.5', roleColors[user.role])}>
                  {user.role}
                </Badge>
              </div>
            )}
          </div>
          {user.role === 'admin' && (
            <div className="mb-4">
              <SidebarRegisterForm collapsed={collapsed} />
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="w-full mt-3 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-1 left-0 right-0 bg-card border-t border-border flex z-[100] pb-[env(safe-area-inset-bottom)] px-2">
        {navItems.map(item => {
          if (!item.permission(user.role)) return null
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center py-3 gap-1 transition-colors min-w-0',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={logout}
          className="flex-1 flex flex-col items-center py-3 gap-1 transition-colors text-muted-foreground hover:text-foreground flex-shrink-0 min-w-0"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-medium truncate w-full text-center">Log Out</span>
        </button>
      </nav>
    </>
  )
}
