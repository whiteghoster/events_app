'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth, canViewCatalog, canViewUsers, canViewAudit } from '@/lib/auth-context'
import { Icon } from '@/components/icon'
import {
  Calendar01Icon,
  CatalogueIcon,
  UserGroupIcon,
  Audit01Icon,
  FlowerIcon,
  Settings01Icon,
  DashboardSquare01Icon,
} from '@hugeicons/core-free-icons'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import type { IconSvgElement } from '@hugeicons/react'

interface NavItem {
  title: string
  href: string
  icon: IconSvgElement
  badge?: string
  show?: boolean
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) return null

  const navMain: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: DashboardSquare01Icon, show: user.role === 'admin' },
    { title: 'Events', href: '/events', icon: Calendar01Icon },
    { title: 'Catalog', href: '/catalog', icon: CatalogueIcon, show: canViewCatalog(user.role) },
    { title: 'Team', href: '/users', icon: UserGroupIcon, show: canViewUsers(user.role) },
    { title: 'Audit Trail', href: '/audit', icon: Audit01Icon, show: canViewAudit(user.role) },
  ].filter(item => item.show !== false)

  const navSecondary: NavItem[] = [
    { title: 'Settings', href: '/account', icon: Settings01Icon },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* Branded Header */}
      <SidebarHeader className="pb-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="data-[slot=sidebar-menu-button]:!p-3">
              <Link href="/events">
                <div className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground size-10 shadow-sm">
                  <Icon icon={FlowerIcon} size={20} />
                </div>
                <div className="grid flex-1 text-left text-base leading-tight">
                  <span className="font-semibold text-lg">Zevan</span>
                  <span className="text-sm text-muted-foreground">Event Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Primary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider text-[11px]">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="py-3 md:py-2">
                      <Link href={item.href}>
                        <Icon icon={item.icon} size={20} />
                        <span className="text-base md:text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary - pushed to bottom */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="uppercase tracking-wider text-[11px]">
            Support
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="py-3 md:py-2">
                      <Link href={item.href}>
                        <Icon icon={item.icon} size={20} />
                        <span className="text-base md:text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
