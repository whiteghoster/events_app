'use client'

import { usePathname } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'

const pageTitles: Record<string, string> = {
  '/events': 'Events',
  '/events/new': 'Create Event',
  '/catalog': 'Product Catalog',
  '/users': 'Team Members',
  '/audit': 'Audit Trail',
  '/account': 'My Account',
}

export function SiteHeader() {
  const pathname = usePathname()

  const title = pageTitles[pathname]
    || (pathname.startsWith('/events/') && pathname.endsWith('/edit') ? 'Edit Event' : '')
    || (pathname.startsWith('/events/') ? 'Event Details' : '')
    || 'FloraEvent'

  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-[var(--header-height)]">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <div className="mx-2 h-4 w-[1.5px] rounded-full bg-foreground/20" />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}
