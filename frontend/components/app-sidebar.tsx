'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, LayoutGrid, Users2, ScrollText, Settings as SettingsIcon, LogOut, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, canViewCatalog, canViewUsers, canViewAudit } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'

const getNavItems = (role: string) => {
  if (role === 'admin') {
    // Events in middle (position 3 of 5)
    return [
      { href: '/catalog', label: 'Catalog', icon: LayoutGrid, permission: canViewCatalog },
      { href: '/users', label: 'Users', icon: Users2, permission: canViewUsers },
      { href: '/events', label: 'Events', icon: CalendarDays, permission: () => true },
      { href: '/audit', label: 'Audits', icon: ScrollText, permission: canViewAudit },
      { href: '/account', label: 'Account', icon: SettingsIcon, permission: () => true },
    ]
  } else {
    // Events in second position for karigar/manager
    return [
      { href: '/catalog', label: 'Catalog', icon: LayoutGrid, permission: canViewCatalog },
      { href: '/events', label: 'Events', icon: CalendarDays, permission: () => true },
      { href: '/users', label: 'Users', icon: Users2, permission: canViewUsers },
      { href: '/audit', label: 'Audits', icon: ScrollText, permission: canViewAudit },
      { href: '/account', label: 'Account', icon: SettingsIcon, permission: () => true },
    ]
  }
}

const roleColors = {
  'admin': 'bg-primary text-primary-foreground',
  'karigar': 'bg-info text-foreground',
  'manager': 'bg-finished text-foreground',
}

export function AppSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  const navItems = getNavItems(user?.role || 'karigar')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!user) return null
  if (!mounted) return null

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen skeu-panel border-r border-border transition-all duration-250 ease-in-out',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-bold text-sm">F</span>
          </div>
          {!collapsed && (
            <span className="text-xl text-foreground">
              Flora<span className="text-primary">Event</span>
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
                  'flex items-center gap-3 px-4 py-3 mx-2 rounded-md transition-all relative',
                  isActive
                    ? 'bg-gradient-to-r from-sidebar-accent to-sidebar-accent/50 text-sidebar-accent-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r" />
                )}
                <item.icon className="w-5 h-5 shrink-0 stroke-[2.5]" />
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
            className="w-full justify-center"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* User Section */}
        <div className="border-t border-border p-4">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-sm font-medium">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <Badge className={cn('text-xs mt-0.5', roleColors[user.role])}>
                  {user.role}
                </Badge>
              </div>
            )}
          </div>

          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="w-full mt-3"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </aside>

      {/* ✅ UPDATED MOBILE NAVBAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#f3f3f3] border-t border-border">
        <div className="flex items-center justify-center px-2 py-3 gap-2">

          {navItems
            .filter(item => item.permission(user.role))
            .map((item) => {
              const isActive = pathname.startsWith(item.href)

              if (isActive) {
                return (
                  <button
                    key={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all duration-200 bg-primary text-primary-foreground cursor-default"
                    )}
                  >
                    <item.icon className="w-5 h-5 stroke-[2.2]" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all duration-200 text-black hover:bg-gray-300 active:scale-95"
                  )}
                >
                  <item.icon className="w-5 h-5 stroke-[2.2] stroke-black"/>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              )
            })}
        </div>
      </nav>
    </>
  )
}
