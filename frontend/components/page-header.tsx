'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  breadcrumbs?: BreadcrumbItem[]
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, breadcrumbs, action, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="w-4 h-4" />}
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl md:text-3xl text-foreground">{title}</h1>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  )
}
