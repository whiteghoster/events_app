'use client'

import { ReactNode } from 'react'

interface StaggeredGridProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggeredGrid({ children, className = '', staggerDelay = 50 }: StaggeredGridProps) {
  return (
    <div className={className}>
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <div
            key={index}
            className="animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: `${index * staggerDelay}ms` }}
          >
            {child}
          </div>
        ))
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      )}
    </div>
  )
}
