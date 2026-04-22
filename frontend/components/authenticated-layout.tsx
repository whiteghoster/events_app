'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

const PUBLIC_ROUTES = ['/login', '/auth/callback']

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route))

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, isPublicRoute, router])

  // Public routes render without the sidebar/auth guard
  if (isPublicRoute) {
    return <>{children}</>
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 rounded-full border-[3px] border-primary/20" />
          <div className="absolute w-20 h-20 rounded-full border-[3px] border-transparent border-t-primary brand-loader-ring" />
          <div className="absolute w-24 h-24 rounded-full bg-primary/5 brand-loader-pulse" />
          <img
            src="/icon.svg"
            alt="FloraEvent"
            className="w-10 h-10 rounded-lg"
          />
        </div>
      </div>
    )
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
