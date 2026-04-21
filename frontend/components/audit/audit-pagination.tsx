'use client'

import { Button } from '@/components/ui/button'

interface AuditPaginationProps {
  page: number
  totalPages: number
  total: number
  setPage: (page: number | ((prev: number) => number)) => void
}

export function AuditPagination({ page, totalPages, total, setPage }: AuditPaginationProps) {
  if (total <= 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages} ({total} entries)
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>First</Button>
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum: number
          if (totalPages <= 5) pageNum = i + 1
          else if (page <= 3) pageNum = i + 1
          else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
          else pageNum = page - 2 + i
          return (
            <Button key={pageNum} variant={page === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setPage(pageNum)} className="min-w-[36px]">
              {pageNum}
            </Button>
          )
        })}
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
        <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</Button>
      </div>
    </div>
  )
}
