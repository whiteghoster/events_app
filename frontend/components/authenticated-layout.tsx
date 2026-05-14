'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import type { AuthenticatedLayoutProps } from '@/lib/types'

const PUBLIC_ROUTES = ['/login', '/auth/callback']

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route))

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated && !isPublicRoute) {
      router.replace('/login')
    }
  }, [mounted, isAuthenticated, isLoading, isPublicRoute, router])

  // Public routes always render without sidebar
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Before hydration completes or while auth is loading, render nothing
  // to avoid hydration mismatch (server has no localStorage access)
  if (!mounted || isLoading || !isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '18rem',
          '--header-height': '3.5rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
